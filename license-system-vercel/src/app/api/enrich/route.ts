import { NextRequest, NextResponse } from 'next/server';

// Email extraction regex - matches most valid email formats
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

// Social media patterns
const SOCIAL_PATTERNS = {
  facebook: /(?:facebook\.com|fb\.com)\/(?:#!\/)?(?:pages\/)?([^\/\s"'<>?&]+)/gi,
  instagram: /instagram\.com\/([^\/\s"'<>?&]+)/gi,
  twitter: /(?:twitter\.com|x\.com)\/([^\/\s"'<>?&]+)/gi,
  linkedin: /linkedin\.com\/(?:in|company)\/([^\/\s"'<>?&]+)/gi,
  youtube: /youtube\.com\/(?:c\/|channel\/|user\/|@)?([^\/\s"'<>?&]+)/gi,
  tiktok: /tiktok\.com\/@([^\/\s"'<>?&]+)/gi,
};

// Phone number extraction regex - matches various formats
const PHONE_REGEX = /(?:(?:\+|00)[1-9]\d{0,3}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

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
  const matches = html.match(EMAIL_REGEX) || [];
  const uniqueEmails = Array.from(new Set(matches.map(e => e.toLowerCase())));
  return uniqueEmails.filter(isValidEmail).slice(0, 5); // Max 5 emails per site
}

function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters for length check
  const digits = phone.replace(/\D/g, '');
  
  // Valid phone numbers typically have 7-15 digits
  if (digits.length < 7 || digits.length > 15) return false;
  
  // Avoid common false positives (years, prices, etc.)
  if (/^(19|20)\d{2}$/.test(digits)) return false; // Years like 2024
  if (/^\d{1,2}$/.test(digits)) return false; // Too short
  
  return true;
}

function extractPhones(html: string): string[] {
  const matches = html.match(PHONE_REGEX) || [];
  const cleaned = matches.map(p => p.trim()).filter(p => isValidPhone(p));
  const uniquePhones = Array.from(new Set(cleaned));
  return uniquePhones.slice(0, 3); // Max 3 phones per site
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

// Single lead enrichment
async function enrichLead(websiteUrl: string): Promise<{
  emails: string[];
  phones: string[];
  social: Record<string, string>;
  contactPages: string[];
}> {
  const html = await fetchWebsite(websiteUrl);
  
  if (!html) {
    return { emails: [], phones: [], social: {}, contactPages: [] };
  }
  
  const emails = extractEmails(html);
  const phones = extractPhones(html);
  const social = extractSocialMedia(html);
  const contactPages = extractContactPages(html, websiteUrl);
  
  return { emails, phones, social, contactPages };
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
