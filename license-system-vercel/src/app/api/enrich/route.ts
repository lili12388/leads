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
  /youremailservice\.com$/i,  // Placeholder email
  /yourcompany\.com$/i,       // Placeholder email
  /yourdomain\.com$/i,        // Placeholder email
  /yourwebsite\.com$/i,       // Placeholder email
  /yoursite\.com$/i,          // Placeholder email
  /sample\.com$/i,            // Placeholder email
  /placeholder\.com$/i,       // Placeholder email
];

function isValidEmail(email: string): boolean {
  // Decode URL encoding first (e.g., %20 -> space, then trim)
  try {
    email = decodeURIComponent(email).trim();
  } catch (e) {
    // If decoding fails, just trim
    email = email.trim();
  }
  
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
  
  // Check domain has at least 4 characters (e.g., "a.co" is minimum)
  if (domain.length < 4) return false;
  
  // Check local part isn't too generic
  const localPart = parts[0].toLowerCase();
  const genericLocalParts = ['noreply', 'no-reply', 'donotreply', 'mailer-daemon', 'postmaster', 'you', 'your', 'email', 'user', 'test'];
  if (genericLocalParts.includes(localPart)) return false;
  
  return true;
}

// Decode HTML entities in email addresses
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#64;/g, '@')
    .replace(/&#x40;/g, '@')
    .replace(/\[at\]/gi, '@')
    .replace(/\(at\)/gi, '@')
    .replace(/ at /gi, '@')
    .replace(/&#46;/g, '.')
    .replace(/&#x2e;/g, '.')
    .replace(/\[dot\]/gi, '.')
    .replace(/\(dot\)/gi, '.')
    .replace(/ dot /gi, '.');
}

function extractEmails(html: string): string[] {
  const emails: string[] = [];
  
  // Decode common obfuscation patterns first
  const decodedHtml = decodeHtmlEntities(html);
  
  // 1. Extract from JSON-LD schema (most reliable for business sites)
  // Match: "email": "value" or "email" : "value" with flexible spacing
  const schemaRegex = /"email"\s*:\s*"([^"]+)"/gi;
  let schemaMatch;
  while ((schemaMatch = schemaRegex.exec(html)) !== null) {
    const email = schemaMatch[1].trim();
    if (email.includes('@')) {
      emails.push(email.toLowerCase());
    }
  }
  
  // Also check for email in other JSON-LD formats
  const schemaRegex2 = /'email'\s*:\s*'([^']+)'/gi;
  while ((schemaMatch = schemaRegex2.exec(html)) !== null) {
    const email = schemaMatch[1].trim();
    if (email.includes('@')) {
      emails.push(email.toLowerCase());
    }
  }
  
  // 2. Extract from mailto: links (various formats)
  const mailtoPatterns = [
    /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi,
    /href=["']mailto:([^"'?#\s]+)/gi,
    /href\s*=\s*["']mailto:([^"'?#\s]+)/gi,
  ];
  
  for (const pattern of mailtoPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const email = match[1].trim();
      if (email.includes('@')) {
        emails.push(email.toLowerCase());
      }
    }
    pattern.lastIndex = 0;
  }
  
  // 3. Extract emails from common HTML patterns
  // Look for email in data attributes, title, aria-label etc
  const attrPatterns = [
    /data-email=["']([^"']+@[^"']+)["']/gi,
    /title=["']([^"']+@[^"']+)["']/gi,
    /aria-label=["'][^"']*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})[^"']*["']/gi,
  ];
  
  for (const pattern of attrPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const email = match[1].trim();
      if (email.includes('@')) {
        emails.push(email.toLowerCase());
      }
    }
    pattern.lastIndex = 0;
  }
  
  // 4. Extract from plain text using general regex (on decoded HTML)
  const textMatches = decodedHtml.match(EMAIL_REGEX) || [];
  textMatches.forEach(e => emails.push(e.toLowerCase()));
  
  // Clean and dedupe emails, decode URL encoding
  const cleanedEmails = emails.map(e => {
    try {
      return decodeURIComponent(e).trim().toLowerCase();
    } catch {
      return e.trim().toLowerCase();
    }
  });
  
  const uniqueEmails = Array.from(new Set(cleanedEmails));
  return uniqueEmails.filter(isValidEmail).slice(0, 5); // Max 5 emails per site
}

function isValidPhone(phone: string): boolean {
  // Clean the phone number
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Valid phone numbers typically have 10-15 digits (with or without country code)
  if (cleaned.length < 10 || cleaned.length > 16) return false;
  
  // Avoid common false positives
  if (/^(19|20)\d{6,}$/.test(cleaned) && cleaned.length === 8) return false; // Dates
  
  // Filter out fake/placeholder numbers with repeating patterns
  // Remove country code (1) if present for US numbers
  const digitsToCheck = cleaned.length === 11 && cleaned.startsWith('1') 
    ? cleaned.slice(1) 
    : cleaned.slice(-10); // Take last 10 digits
  
  if (digitsToCheck.length === 10) {
    const areaCode = digitsToCheck.slice(0, 3);
    const prefix = digitsToCheck.slice(3, 6);
    const line = digitsToCheck.slice(6, 10);
    
    // Filter out repeating digit patterns like 333-3333, 666-6666, 999-9999
    const isRepeatingPrefix = /^(\d)\1{2}$/.test(prefix);
    const isRepeatingLine = /^(\d)\1{3}$/.test(line);
    if (isRepeatingPrefix && isRepeatingLine) {
      return false;
    }
    
    // Filter out obvious fake patterns
    const fakePatterns = [
      '0000000000', '1111111111', '2222222222', '3333333333',
      '4444444444', '5555555555', '6666666666', '7777777777',
      '8888888888', '9999999999', '1234567890', '0987654321',
      '1234567891', '0000000001', '1230001234'
    ];
    if (fakePatterns.includes(digitsToCheck)) {
      return false;
    }
    
    // Filter out numbers where all digits are the same
    if (/^(\d)\1{9}$/.test(digitsToCheck)) {
      return false;
    }
    
    // Filter 555-xxxx numbers (reserved for fiction)
    if (prefix === '555') {
      return false;
    }
    
    // Filter invalid area codes (000, 911, etc.)
    const invalidAreaCodes = ['000', '111', '911', '999'];
    if (invalidAreaCodes.includes(areaCode)) {
      return false;
    }
  }
  
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

// Multiple User-Agents to rotate through if one fails
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

async function fetchWithRetry(url: string, retryCount = 0): Promise<string | null> {
  const userAgent = USER_AGENTS[retryCount % USER_AGENTS.length];
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout (faster)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeout);
    
    // If blocked, retry with different User-Agent
    if ((response.status === 403 || response.status === 429) && retryCount < 2) {
      await new Promise(r => setTimeout(r, 200)); // Quick retry
      return fetchWithRetry(url, retryCount + 1);
    }
    
    if (!response.ok) return null;
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }
    
    const html = await response.text();
    return html.slice(0, 500000); // Limit to 500KB
    
  } catch (error: any) {
    // On timeout or network error, retry with different User-Agent
    if (retryCount < 2) {
      return fetchWithRetry(url, retryCount + 1);
    }
    return null;
  }
}

async function fetchWebsite(url: string): Promise<string | null> {
  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Try https first
  let html = await fetchWithRetry(url);
  
  // If https fails and URL was auto-prefixed, try http
  if (!html && url.startsWith('https://')) {
    const httpUrl = url.replace('https://', 'http://');
    html = await fetchWithRetry(httpUrl);
  }
  
  return html;
}

// Single lead enrichment - checks homepage and contact page (emails only, no phone scraping)
async function enrichLead(websiteUrl: string): Promise<{
  emails: string[];
  social: Record<string, string>;
}> {
  // Ensure URL has protocol
  if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
    websiteUrl = 'https://' + websiteUrl;
  }
  
  const html = await fetchWebsite(websiteUrl);
  
  if (!html) {
    return { emails: [], social: {} };
  }
  
  let emails = extractEmails(html);
  const social = extractSocialMedia(html);
  
  // If we found an email, we're done - no need to fetch more pages
  if (emails.length > 0) {
    return { emails: emails.slice(0, 1), social };
  }
  
  // No email found on homepage - try ONE contact page
  const baseUrl = new URL(websiteUrl);
  const contactPages = extractContactPages(html, websiteUrl);
  
  // Priority: found contact links first, then common paths
  const contactUrls = [...contactPages, baseUrl.origin + '/contact', baseUrl.origin + '/contact-us'];
  
  // Try just the first contact page
  for (const url of contactUrls.slice(0, 1)) {
    try {
      const contactHtml = await fetchWebsite(url);
      if (contactHtml) {
        const contactEmails = extractEmails(contactHtml);
        if (contactEmails.length > 0) {
          emails = contactEmails;
          break;
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  return { 
    emails: emails.slice(0, 1), 
    social
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
    const debug = request.nextUrl.searchParams.get('debug') === 'true';
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }
    
    // If debug mode, return detailed info about what we're fetching
    if (debug) {
      let websiteUrl = url;
      if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(websiteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          signal: controller.signal,
          redirect: 'follow',
        });
        
        clearTimeout(timeout);
        
        const contentType = response.headers.get('content-type') || '';
        const html = await response.text();
        
        // Test each regex
        const schemaEmailRegex = /"email"\s*:\s*"([^"]+@[^"]+)"/gi;
        const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
        
        const schemaEmails: string[] = [];
        let match;
        while ((match = schemaEmailRegex.exec(html)) !== null) {
          schemaEmails.push(match[1]);
        }
        
        const mailtoEmails: string[] = [];
        while ((match = mailtoRegex.exec(html)) !== null) {
          mailtoEmails.push(match[1]);
        }
        
        // Check if email string exists at all
        const hasEmailWord = html.includes('"email"');
        const hasHotmail = html.toLowerCase().includes('hotmail');
        const hasMidtown = html.toLowerCase().includes('midtowncenter');
        
        return NextResponse.json({
          success: true,
          url: websiteUrl,
          htmlLength: html.length,
          statusCode: response.status,
          contentType,
          hasEmailWord,
          hasHotmail,
          hasMidtown,
          schemaEmails,
          mailtoEmails,
          htmlSample: html.substring(0, 2000), // First 2KB
        });
      } catch (fetchError: any) {
        return NextResponse.json({
          success: false,
          url: websiteUrl,
          error: fetchError.message || 'Fetch failed',
        });
      }
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
