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
    
    // Helper to format phone numbers (prefix with ' to prevent formula parsing)
    const formatPhone = (phone: string) => {
      if (!phone) return '';
      // Prefix with single quote to force text interpretation in Google Sheets
      return phone.startsWith('+') ? `'${phone}` : phone;
    };
    
    // Convert leads to rows (no dedup - extension already handles it)
    // Only website shows "NOT FOUND", other empty fields are blank
    const rows = leads.map((lead: any) => [
      lead.name || '',
      formatPhone(lead.phone || ''),
      lead.email || '',
      lead.website || 'NOT FOUND',
      lead.address || '',
      lead.instagram || '',
      lead.facebook || '',
      lead.category || '',
      lead.reviewCount?.toString() || '',
      lead.averageRating?.toString() || '',
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
      { ok: true, appended: leads.length },
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
