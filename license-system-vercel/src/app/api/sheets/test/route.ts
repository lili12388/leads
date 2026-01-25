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

async function getSheetsClient() {
  const credentials = getServiceAccountCredentials();
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  return google.sheets({ version: 'v4', auth });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheetId, tabName = 'Leads' } = body;
    
    if (!sheetId) {
      return NextResponse.json(
        { ok: false, error: 'Missing sheetId' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const sheets = await getSheetsClient();
    
    // Try to read the sheet to verify access
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    
    const title = response.data.properties?.title || 'Unknown';
    const sheetNames = response.data.sheets?.map(s => s.properties?.title) || [];
    
    return NextResponse.json(
      { 
        ok: true, 
        message: 'Connection successful!',
        sheetTitle: title,
        availableTabs: sheetNames,
        tabExists: sheetNames.includes(tabName),
      },
      { headers: corsHeaders }
    );
    
  } catch (error: any) {
    console.error('Sheets test error:', error);
    
    let errorMessage = 'Connection failed';
    if (error.message?.includes('not found')) {
      errorMessage = 'Sheet not found. Check the Sheet ID.';
    } else if (error.message?.includes('permission') || error.code === 403) {
      errorMessage = 'Permission denied. Share the sheet with: sheets-writer@ggl-maps-extractor.iam.gserviceaccount.com';
    }
    
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
