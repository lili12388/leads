// Background script for Google Sheets integration

const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportToGoogleSheets') {
    exportToGoogleSheets(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function exportToGoogleSheets(leads) {
  try {
    // Get OAuth token
    const token = await getAuthToken();
    
    if (!token) {
      return { success: false, error: 'Failed to authenticate with Google' };
    }
    
    // Create new spreadsheet
    const spreadsheet = await createSpreadsheet(token, leads);
    
    return { 
      success: true, 
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      spreadsheetId: spreadsheet.spreadsheetId
    };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
}

function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Auth error:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

async function createSpreadsheet(token, leads) {
  // Create spreadsheet with title
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const title = `Google Maps Leads - ${timestamp}`;
  
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [{
        properties: {
          title: 'Leads',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }]
    })
  });
  
  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(error.error?.message || 'Failed to create spreadsheet');
  }
  
  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  
  // Prepare data with headers
  const headers = [
    'Name', 'Phone', 'Website', 'Address', 'Category', 
    'Rating', 'Reviews', 'Facebook', 'Instagram', 'Has Website',
    'Place ID', 'Latitude', 'Longitude'
  ];
  
  const rows = leads.map(lead => [
    lead.name || '',
    lead.phone || '',
    lead.website || '',
    lead.address || '',
    lead.category || '',
    lead.rating || '',
    lead.review_count || '',
    lead.facebook || '',
    lead.instagram || '',
    lead.has_website ? 'Yes' : 'No',
    lead.place_id || '',
    lead.latitude || '',
    lead.longitude || ''
  ]);
  
  const values = [headers, ...rows];
  
  // Write data to spreadsheet
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A1:M${values.length}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: values
      })
    }
  );
  
  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    throw new Error(error.error?.message || 'Failed to write data');
  }
  
  // Format the header row (bold, background color)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.5, blue: 0.9 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 13
              }
            }
          }
        ]
      })
    }
  );
  
  return {
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
}
