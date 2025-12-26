import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Simple API key for demo (you can change this)
const API_KEY = process.env.SHEETS_API_KEY || 'demo-sheets-key-2025';

// Google Service Account credentials from environment
function getServiceAccountCredentials() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  
  if (!privateKey || !clientEmail) {
    throw new Error('Missing Google Service Account credentials');
  }
  
  return {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, '\n'),
  };
}

// Get authenticated Google Sheets client
async function getSheetsClient() {
  const credentials = getServiceAccountCredentials();
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  return google.sheets({ version: 'v4', auth });
}

// Create header row if sheet is empty
async function ensureHeaderRow(sheets: any, spreadsheetId: string, tabName: string) {
  const headers = [
    'Name', 'Phone', 'Email', 'Website', 'Address', 
    'Instagram', 'Facebook', 'Category', 'ReviewCount', 'AverageRating'
  ];
  
  try {
    // Check if sheet has data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A1:J1`,
    });
    
    // If no data, add headers
    if (!response.data.values || response.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A1:J1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
      
      // Format header row (bold, background color)
      // Get sheet ID first
      const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
      const sheet = sheetMetadata.data.sheets?.find(
        (s: any) => s.properties?.title === tabName
      );
      
      if (sheet) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: sheet.properties.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.2, green: 0.5, blue: 0.8 },
                      textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat)',
                },
              },
            ],
          },
        });
      }
      
      return true;
    }
    return false;
  } catch (error: any) {
    // If tab doesn't exist, create it
    if (error.message?.includes('Unable to parse range')) {
      const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: tabName },
              },
            },
          ],
        },
      });
      
      // Add headers to new sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A1:J1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
      
      return true;
    }
    throw error;
  }
}

// Get existing data for deduplication
async function getExistingData(sheets: any, spreadsheetId: string, tabName: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A:J`,
    });
    
    return response.data.values || [];
  } catch (error) {
    return [];
  }
}

// Normalize domain for deduplication
function normalizeDomain(url: string): string {
  if (!url) return '';
  try {
    let domain = url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .split('/')[0];
    return domain;
  } catch {
    return url.toLowerCase();
  }
}

// Create dedup key
function createDedupKey(lead: any): string {
  const website = normalizeDomain(lead.website);
  const invalidWebsites = ['not found', 'no website found', ''];
  if (website && !invalidWebsites.includes(website)) return `web:${website}`;
  
  const phone = (lead.phone || '').replace(/\D/g, '');
  if (phone) return `phone:${phone}`;
  
  const nameAddr = `${(lead.name || '').toLowerCase()}|${(lead.address || '').toLowerCase()}`;
  return `name:${nameAddr}`;
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Invalid API key' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    const body = await request.json();
    const { sheetId, tabName = 'Leads', leads } = body;
    
    if (!sheetId || !leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Missing sheetId or leads array' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const sheets = await getSheetsClient();
    
    // Ensure header row exists
    await ensureHeaderRow(sheets, sheetId, tabName);
    
    // Get existing data for deduplication
    const existingData = await getExistingData(sheets, sheetId, tabName);
    const existingKeys = new Set<string>();
    
    // Build set of existing keys (skip header row)
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row && row.length > 0) {
        const key = createDedupKey({
          name: row[0],
          phone: row[1],
          website: row[3],
          address: row[4],
        });
        existingKeys.add(key);
      }
    }
    
    // Filter out duplicates
    const newLeads: any[] = [];
    let skippedDuplicates = 0;
    
    for (const lead of leads) {
      const key = createDedupKey(lead);
      if (existingKeys.has(key)) {
        skippedDuplicates++;
      } else {
        existingKeys.add(key); // Prevent duplicates within same batch
        newLeads.push(lead);
      }
    }
    
    if (newLeads.length === 0) {
      return NextResponse.json(
        { ok: true, appended: 0, skipped_duplicates: skippedDuplicates },
        { headers: corsHeaders }
      );
    }
    
    // Convert leads to rows
    const rows = newLeads.map(lead => [
      lead.name || 'NOT FOUND',
      lead.phone || 'NOT FOUND',
      lead.email || 'NOT FOUND',
      lead.website || 'NOT FOUND',
      lead.address || 'NOT FOUND',
      lead.instagram || 'NOT FOUND',
      lead.facebook || 'NOT FOUND',
      lead.category || 'NOT FOUND',
      lead.reviewCount?.toString() || 'NOT FOUND',
      lead.averageRating?.toString() || 'NOT FOUND',
    ]);
    
    // Append rows to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tabName}!A:J`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows,
      },
    });
    
    return NextResponse.json(
      { ok: true, appended: newLeads.length, skipped_duplicates: skippedDuplicates },
      { headers: corsHeaders }
    );
    
  } catch (error: any) {
    console.error('Sheets append error:', error);
    
    let errorMessage = 'Failed to append to sheet';
    if (error.message?.includes('not found')) {
      errorMessage = 'Sheet not found. Make sure the Sheet ID is correct.';
    } else if (error.message?.includes('permission')) {
      errorMessage = 'Permission denied. Make sure the sheet is shared with the service account.';
    }
    
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
