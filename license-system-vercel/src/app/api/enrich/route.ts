import { NextRequest, NextResponse } from 'next/server';

// Email extraction regex - matches most valid email formats
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

// Additional email patterns - mailto links
const MAILTO_REGEX = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

// Phone number patterns - multiple formats
const PHONE_PATTERNS = [
  /tel:([+\d\s\-().]+)/gi,  // tel: links
  /href=["']tel:([^"']+)["']/gi,  // tel href
  /(?:phone|tel|call|mobile|fax)[\s:]*([+]?[\d\s\-().]{10,})/gi,  // labeled phones
  /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,  // US format (123) 456-7890
  /\+1[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,  // +1 format
  /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,  // International
];

// Social media patterns
const SOCIAL_PATTERNS = {
  facebook: /(?:facebook\.com|fb\.com)\/(?:#!\/)?(?:pages\/)?([^\/\s"'<>?&]+)/gi,
  instagram: /instagram\.com\/([^\/\s"'<>?&]+)/gi,
  twitter: /(?:twitter\.com|x\.com)\/([^\/\s"'<>?&]+)/gi,
  linkedin: /linkedin\.com\/(?:in|company)\/([^\/\s"'<>?&]+)/gi,
  youtube: /youtube\.com\/(?:c\/|channel\/|user\/|@)?([^\/\s"'<>?&]+)/gi,
  tiktok: /tiktok\.com\/@([^\/\s"'<>?&]+)/gi,
};

// Contact page patterns
const CONTACT_PAGE_PATTERNS = [
  /href=["']([^"']*(?:contact|kontakt|contacto|contato|kontact)[^"']*)["']/gi,
  /href=["']([^"']*(?:about-us|about|uber-uns|qui-sommes-nous)[^"']*)["']/gi,
];

// Filter out common false positive emails
const INVALID_EMAIL_PATTERNS = [
  /example\.com$/i,
  /domain\.com$/i,
  /email\.com$/i,
  /test\.com$/i,
  /localhost/i,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.gif$/i,
  /\.svg$/i,
  /\.webp$/i,
  /\.css$/i,
  /\.js$/i,
  /sentry\.io$/i,
  /wixpress\.com$/i,
  /wordpress\.com$/i,
  /w3\.org$/i,
];

function isValidEmail(email: string): boolean {
  // Check length
  if (email.length < 5 || email.length > 254) return false;
  
  // Check against invalid patterns
  for (const pattern of INVALID_EMAIL_PATTERNS) {
    if (pattern.test(email)) return false;
  }
  
  // Check for valid TLD (at least 2 chars)
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const domain = parts[1];
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) return false;
  
  // Check local part isn't too generic
  const localPart = parts[0].toLowerCase();
  const genericLocalParts = ['noreply', 'no-reply', 'donotreply', 'mailer-daemon', 'postmaster'];
  if (genericLocalParts.includes(localPart)) return false;
  
  return true;
}

function extractEmails(html: string): string[] {
  const emails: string[] = [];
  
  // 1. Extract from JSON-LD schema (most reliable for business sites)
  const schemaRegex = /"email"\s*:\s*"([^"]+@[^"]+)"/gi;
  let schemaMatch;
  while ((schemaMatch = schemaRegex.exec(html)) !== null) {
    emails.push(schemaMatch[1].toLowerCase());
  }
  
  // 2. Extract from mailto: links
  const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  let mailtoMatch;
  while ((mailtoMatch = mailtoRegex.exec(html)) !== null) {
    emails.push(mailtoMatch[1].toLowerCase());
  }
  
  // 3. Extract from href with mailto (alternative format)
  const hrefMailtoRegex = /href=["']mailto:([^"'?]+)/gi;
  let hrefMatch;
  while ((hrefMatch = hrefMailtoRegex.exec(html)) !== null) {
    const email = hrefMatch[1].trim();
    if (email.includes('@')) {
      emails.push(email.toLowerCase());
    }
  }
  
  // 4. Also extract from plain text using general regex
  const textMatches = html.match(EMAIL_REGEX) || [];
  textMatches.forEach(e => emails.push(e.toLowerCase()));
  
  const uniqueEmails = Array.from(new Set(emails));
  return uniqueEmails.filter(isValidEmail).slice(0, 5); // Max 5 emails per site
}

function isValidPhone(phone: string): boolean {
  // Clean the phone number
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Valid phone numbers typically have 10-15 digits (with or without country code)
  if (cleaned.length < 10 || cleaned.length > 16) return false;
  
  // Avoid common false positives
  if (/^(19|20)\d{6,}$/.test(cleaned) && cleaned.length === 8) return false; // Dates
  
  return true;
}

function extractPhones(html: string): string[] {
  const phones: string[] = [];
  
  // 1. Extract from JSON-LD schema (most reliable)
  const schemaPhoneRegex = /"telephone"\s*:\s*"([^"]+)"/gi;
  let schemaMatch;
  while ((schemaMatch = schemaPhoneRegex.exec(html)) !== null) {
    const phone = schemaMatch[1].replace(/[^\d+\-() ]/g, '').trim();
    if (phone && isValidPhone(phone)) {
      phones.push(phone);
    }
  }
  
  // 2. Extract from tel: links (most reliable for clickable phones)
  const telRegex = /href=["']tel:([^"']+)["']/gi;
  let telMatch;
  while ((telMatch = telRegex.exec(html)) !== null) {
    const phone = telMatch[1].replace(/[^\d+\-() ]/g, '').trim();
    if (phone && isValidPhone(phone)) {
      phones.push(phone);
    }
  }
  
  // 3. Also look for phone patterns in text
  for (const pattern of PHONE_PATTERNS) {
    const matches = html.match(pattern) || [];
    matches.forEach(m => {
      // Clean up the match
      let phone = m.replace(/^(tel:|phone:|call:|mobile:|fax:)/i, '').trim();
      phone = phone.replace(/[^\d+\-() ]/g, '').trim();
      if (phone && isValidPhone(phone)) {
        phones.push(phone);
      }
    });
    pattern.lastIndex = 0;
  }
  
  // Dedupe and return
  const uniquePhones = Array.from(new Set(phones.map(p => p.replace(/\D/g, ''))));
  return uniquePhones.map(digits => {
    // Format nicely
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
    }
    return digits;
  }).slice(0, 3);
}

function extractContactPages(html: string, baseUrl: string): string[] {
  const contactPages: string[] = [];
  
  for (const pattern of CONTACT_PAGE_PATTERNS) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      // Skip if it's a social media or external link
      if (url.includes('facebook') || url.includes('instagram') || url.includes('twitter')) continue;
      if (url.includes('mailto:') || url.includes('tel:')) continue;
      
      // Make absolute URL
      if (url.startsWith('/')) {
        try {
          const base = new URL(baseUrl);
          url = base.origin + url;
        } catch (e) {
          continue;
        }
      } else if (!url.startsWith('http')) {
        continue; // Skip relative URLs without leading slash
      }
      
      contactPages.push(url);
    }
    pattern.lastIndex = 0;
  }
  
  return Array.from(new Set(contactPages)).slice(0, 2); // Max 2 contact pages
}

function extractSocialMedia(html: string): Record<string, string> {
  const social: Record<string, string> = {};
  
  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      // Clean up the username/handle
      let handle = match[1].split('?')[0].split('#')[0];
      // Skip generic pages
      if (!['sharer', 'share', 'intent', 'home', 'login', 'signup'].includes(handle.toLowerCase())) {
        social[platform] = handle;
      }
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  }
  
  return social;
}

async function fetchWebsite(url: string): Promise<string | null> {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    // Only process HTML content
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    
    const html = await response.text();
    
    // Limit to first 500KB to avoid memory issues
    return html.slice(0, 500000);
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

// Single lead enrichment - checks homepage and contact page
async function enrichLead(websiteUrl: string): Promise<{
  emails: string[];
  phones: string[];
  social: Record<string, string>;
  contactPages: string[];
}> {
  // Ensure URL has protocol
  if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
    websiteUrl = 'https://' + websiteUrl;
  }
  
  const html = await fetchWebsite(websiteUrl);
  
  if (!html) {
    return { emails: [], phones: [], social: {}, contactPages: [] };
  }
  
  let emails = extractEmails(html);
  let phones = extractPhones(html);
  const social = extractSocialMedia(html);
  let contactPages = extractContactPages(html, websiteUrl);
  
  // If we didn't find emails on homepage, try common contact pages
  if (emails.length === 0 || phones.length === 0) {
    const baseUrl = new URL(websiteUrl);
    const contactUrls = [
      baseUrl.origin + '/contact',
      baseUrl.origin + '/contact-us',
      baseUrl.origin + '/contactus',
      baseUrl.origin + '/about',
      baseUrl.origin + '/about-us',
    ];
    
    // Try fetching contact pages (in parallel, with limit)
    const contactResults = await Promise.all(
      contactUrls.slice(0, 2).map(async (url) => {
        try {
          const contactHtml = await fetchWebsite(url);
          if (contactHtml) {
            return {
              url,
              emails: extractEmails(contactHtml),
              phones: extractPhones(contactHtml)
            };
          }
        } catch (e) {
          // Ignore errors for contact pages
        }
        return null;
      })
    );
    
    // Merge results from contact pages
    for (const result of contactResults) {
      if (result) {
        if (emails.length === 0 && result.emails.length > 0) {
          emails = result.emails;
          if (!contactPages.includes(result.url)) {
            contactPages.push(result.url);
          }
        }
        if (phones.length === 0 && result.phones.length > 0) {
          phones = result.phones;
        }
        // Merge additional emails/phones
        result.emails.forEach(e => {
          if (!emails.includes(e)) emails.push(e);
        });
        result.phones.forEach(p => {
          if (!phones.includes(p)) phones.push(p);
        });
      }
    }
  }
  
  return { 
    emails: emails.slice(0, 5), 
    phones: phones.slice(0, 3), 
    social, 
    contactPages: contactPages.slice(0, 2) 
  };
}

// Batch enrichment endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leads, licenseKey } = body;
    
    // Validate request
    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Invalid leads array' }, { status: 400 });
    }
    
    // Optional: Validate license key here if you want to restrict access
    // For now, we'll allow all requests since it's a one-time purchase model
    
    // Process leads in parallel with concurrency limit
    const CONCURRENCY = 5; // Process 5 websites at a time
    const results: Array<{ index: number; emails: string[]; social: Record<string, string> }> = [];
    
    // Filter leads that have websites
    const leadsWithWebsites = leads
      .map((lead: any, index: number) => ({ lead, index }))
      .filter(({ lead }: any) => lead.website && lead.website !== 'NOT FOUND' && lead.website.trim() !== '');
    
    // Process in batches
    for (let i = 0; i < leadsWithWebsites.length; i += CONCURRENCY) {
      const batch = leadsWithWebsites.slice(i, i + CONCURRENCY);
      
      const batchResults = await Promise.all(
        batch.map(async ({ lead, index }: any) => {
          const enrichment = await enrichLead(lead.website);
          return { index, ...enrichment };
        })
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming servers
      if (i + CONCURRENCY < leadsWithWebsites.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return NextResponse.json({
      success: true,
      enriched: results.length,
      total: leads.length,
      results
    });
    
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Single URL enrichment (for real-time enrichment)
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }
    
    const result = await enrichLead(url);
    
    return NextResponse.json({
      success: true,
      url,
      ...result
    });
    
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
