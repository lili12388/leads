const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const puppeteer = require('puppeteer');

let mainWindow;
let browser = null;
let page = null;
let isRunning = false;
let isPaused = false;

// License System Configuration
const LICENSE_SERVER = 'https://license.mapsreach.com'; // Your Vercel deployment
const TRIAL_MAX_MESSAGES = 10;

// Cache license status to reduce API calls
let licenseCache = {
  status: null,
  lastCheck: 0,
  hardwareId: null
};

// Generate a stable hardware ID based on machine characteristics
function generateHardwareId() {
  if (licenseCache.hardwareId) return licenseCache.hardwareId;
  
  const cpus = os.cpus();
  const networkInterfaces = os.networkInterfaces();
  
  // Get first non-internal MAC address
  let macAddress = '';
  for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    for (const iface of interfaces) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        macAddress = iface.mac;
        break;
      }
    }
    if (macAddress) break;
  }
  
  // Create a stable fingerprint
  const fingerprint = [
    os.hostname(),
    os.platform(),
    os.arch(),
    cpus[0]?.model || 'unknown-cpu',
    os.totalmem().toString(),
    macAddress || 'no-mac'
  ].join('|');
  
  // Hash it for privacy and consistency
  licenseCache.hardwareId = crypto.createHash('sha256').update(fingerprint).digest('hex');
  return licenseCache.hardwareId;
}

// Get machine info for admin dashboard
function getMachineInfo() {
  return {
    machine_name: os.hostname(),
    os_info: `${os.platform()} ${os.release()} (${os.arch()})`
  };
}

// Check trial/license status from server
async function checkLicenseStatus(forceRefresh = false) {
  const now = Date.now();
  // Cache for 5 minutes unless force refresh
  if (!forceRefresh && licenseCache.status && (now - licenseCache.lastCheck) < 5 * 60 * 1000) {
    return licenseCache.status;
  }
  
  try {
    const hardwareId = generateHardwareId();
    const machineInfo = getMachineInfo();
    
    const response = await fetch(`${LICENSE_SERVER}/api/v1/whatsapp/trial?hardware_id=${encodeURIComponent(hardwareId)}&machine_name=${encodeURIComponent(machineInfo.machine_name)}&os_info=${encodeURIComponent(machineInfo.os_info)}`);
    
    if (!response.ok) {
      throw new Error('License server unreachable');
    }
    
    const data = await response.json();
    
    if (data.success) {
      licenseCache.status = {
        hasLicense: data.has_license,
        isLocked: data.is_locked,
        messagesSent: data.messages_sent,
        maxMessages: data.max_messages,
        remainingMessages: data.remaining_messages
      };
      licenseCache.lastCheck = now;
      return licenseCache.status;
    }
    
    throw new Error(data.error || 'Unknown error');
  } catch (error) {
    console.error('License check failed:', error);
    // If server is unreachable, allow limited offline usage
    if (!licenseCache.status) {
      licenseCache.status = {
        hasLicense: false,
        isLocked: false,
        messagesSent: 0,
        maxMessages: TRIAL_MAX_MESSAGES,
        remainingMessages: TRIAL_MAX_MESSAGES,
        offline: true
      };
    }
    return licenseCache.status;
  }
}

// Report a successful message send to the server
async function reportMessageSent() {
  try {
    const hardwareId = generateHardwareId();
    const machineInfo = getMachineInfo();
    
    const response = await fetch(`${LICENSE_SERVER}/api/v1/whatsapp/trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hardware_id: hardwareId,
        machine_name: machineInfo.machine_name,
        os_info: machineInfo.os_info
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        licenseCache.status = {
          hasLicense: data.has_license,
          isLocked: data.is_locked,
          messagesSent: data.messages_sent,
          maxMessages: data.max_messages,
          remainingMessages: data.remaining_messages
        };
        licenseCache.lastCheck = Date.now();
        return licenseCache.status;
      }
    }
  } catch (error) {
    console.error('Failed to report message:', error);
  }
  return licenseCache.status;
}

// Activate a license key
async function activateLicense(licenseKey) {
  try {
    const hardwareId = generateHardwareId();
    const machineInfo = getMachineInfo();
    
    const response = await fetch(`${LICENSE_SERVER}/api/v1/whatsapp/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
        hardware_id: hardwareId,
        ...machineInfo
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear cache to force refresh
      licenseCache.status = null;
      licenseCache.lastCheck = 0;
      return { success: true, message: 'License activated successfully!' };
    }
    
    return { success: false, message: data.message || data.error || 'Activation failed' };
  } catch (error) {
    return { success: false, message: 'Could not connect to license server' };
  }
}

// Persistent profile directory (keeps you logged in!)
const userDataDir = path.join(app.getPath('userData'), 'whatsapp-profile');

// Find Edge executable
function getEdgePath() {
  const possiblePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'WhatsApp Sender'
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (browser) await browser.close();
  if (process.platform !== 'darwin') app.quit();
});

// License IPC Handlers
ipcMain.handle('check-license', async () => {
  return await checkLicenseStatus(true);
});

ipcMain.handle('activate-license', async (event, licenseKey) => {
  return await activateLicense(licenseKey);
});

ipcMain.handle('get-hardware-id', () => {
  return generateHardwareId();
});

// Helper functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Calculate delay between messages using user-defined min/max
function calculateBetweenMessageDelay(minDelay, maxDelay) {
  return randomInt(minDelay, maxDelay);
}

function formatPhone(phone) {
  let formatted = phone.toString().replace(/[^\d+]/g, '');
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  // Handle Italian numbers: remove leading 0 after country code
  if (formatted.startsWith('+390')) {
    formatted = '+39' + formatted.substring(4);
  }
  return formatted;
}

// Check if likely a landline (Italian landlines start with 0, mobiles start with 3)
function isLikelyLandline(phone) {
  const cleaned = phone.replace(/[^\d]/g, '');
  // Italian numbers: if after 39, the next digit is 0, it's a landline
  if (cleaned.startsWith('390') || cleaned.startsWith('0')) {
    return true;
  }
  // Italian mobile numbers start with 39 3xx
  if (cleaned.startsWith('39') && !cleaned.startsWith('393')) {
    return true;
  }
  return false;
}

// IPC Handlers
ipcMain.handle('start-whatsapp', async () => {
  try {
    const edgePath = getEdgePath();
    
    const launchOptions = {
      headless: false,
      defaultViewport: null,
      userDataDir: userDataDir, // Persistent profile - stay logged in!
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled'
      ]
    };
    
    // Use Edge if available, otherwise use bundled Chromium
    if (edgePath) {
      launchOptions.executablePath = edgePath;
      mainWindow.webContents.send('log', '🌐 Using Microsoft Edge');
    } else {
      mainWindow.webContents.send('log', '🌐 Using Chromium (Edge not found)');
    }
    
    browser = await puppeteer.launch(launchOptions);
    
    page = await browser.newPage();
    await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('check-logged-in', async () => {
  try {
    if (!page) return { loggedIn: false };
    const sidePanel = await page.$('[data-testid="chat-list"]');
    if (!sidePanel) {
      const altCheck = await page.$('[data-icon="new-chat-outline"]');
      return { loggedIn: !!altCheck };
    }
    return { loggedIn: true };
  } catch (error) {
    return { loggedIn: false };
  }
});

ipcMain.handle('stop-sending', async () => {
  isRunning = false;
  isPaused = false;
});

ipcMain.handle('pause-sending', async () => {
  isPaused = !isPaused;
  return { isPaused };
});

ipcMain.handle('send-messages', async (event, { leads, messages, settings, testMode }) => {
  if (!page) {
    return { success: false, message: 'WhatsApp not connected' };
  }

  // Check license status before starting
  const licenseStatus = await checkLicenseStatus(true);
  if (!licenseStatus.hasLicense && licenseStatus.isLocked) {
    mainWindow.webContents.send('log', '\n🔒 Trial ended! Please activate a license to continue.');
    mainWindow.webContents.send('license-update', licenseStatus);
    return { success: false, message: 'Trial ended. Please activate a license.', licenseRequired: true };
  }

  // Support both old single message format and new multiple messages format
  const messageList = Array.isArray(messages) ? messages : [messages];

  isRunning = true;
  isPaused = false;
  const results = [];

  mainWindow.webContents.send('log', `\n🚀 Starting ${testMode ? 'TEST MODE' : 'sending'} - ${leads.length} leads`);
  mainWindow.webContents.send('log', `📬 ${messageList.length} message(s) per lead`);
  if (testMode) {
    mainWindow.webContents.send('log', `⚠️ TEST MODE: Messages will be typed but NOT sent`);
  }
  
  // Show remaining trial messages if not licensed
  if (!testMode && !licenseStatus.hasLicense) {
    mainWindow.webContents.send('log', `📊 Trial: ${licenseStatus.remainingMessages} messages remaining`);
  }

  for (let i = 0; i < leads.length; i++) {
    if (!isRunning) {
      mainWindow.webContents.send('log', '🛑 Stopped by user');
      break;
    }
    
    // Check license status before each lead (in case trial runs out mid-session)
    if (!testMode) {
      const currentStatus = await checkLicenseStatus();
      if (!currentStatus.hasLicense && currentStatus.isLocked) {
        mainWindow.webContents.send('log', '\n🔒 Trial limit reached! Please activate a license to continue.');
        mainWindow.webContents.send('license-update', currentStatus);
        isRunning = false;
        break;
      }
    }

    while (isPaused && isRunning) {
      await sleep(500);
    }

    const lead = leads[i];
    const phone = formatPhone(lead.phone);

    mainWindow.webContents.send('progress', { current: i + 1, total: leads.length });
    mainWindow.webContents.send('log', `\n[${i + 1}/${leads.length}] ${lead.name}`);
    mainWindow.webContents.send('log', `   📱 Original: ${lead.phone}`);
    mainWindow.webContents.send('log', `   📱 Formatted: ${phone}`);
    
    // Check if this looks like a landline
    if (isLikelyLandline(lead.phone)) {
      mainWindow.webContents.send('log', `   ⚠️ Looks like a LANDLINE - WhatsApp is for mobiles only!`);
    }

    try {
      // Navigate directly to chat URL (without the +)
      const phoneForUrl = phone.replace('+', '');
      const chatUrl = `https://web.whatsapp.com/send?phone=${phoneForUrl}`;
      mainWindow.webContents.send('log', `   🔗 URL: ${chatUrl}`);
      await page.goto(chatUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(3000);

      // Check if number is invalid (not on WhatsApp)
      const pageContent = await page.content();
      const invalidNumber = pageContent.includes('Phone number shared via url is invalid') ||
                           pageContent.includes('invalid phone') ||
                           await page.$('[data-testid="popup-contents"]');
      
      if (invalidNumber) {
        // Check specifically for the invalid popup
        const popup = await page.$('[data-testid="popup-contents"]');
        if (popup) {
          const popupText = await page.evaluate(el => el.textContent, popup);
          if (popupText.includes('invalid')) {
            mainWindow.webContents.send('log', `   ❌ Not on WhatsApp - SKIPPED`);
            const notFoundItem = { name: lead.name, phone, status: 'invalid', timestamp: new Date().toISOString() };
            results.push(notFoundItem);
            mainWindow.webContents.send('not-found', notFoundItem);
            
            // Click OK to dismiss popup
            const okBtn = await page.$('[data-testid="popup-controls-ok"]');
            if (okBtn) await okBtn.click();
            await sleep(500);
            continue;
          }
        }
      }

      // Wait for message input to appear
      await sleep(2000);
      
      // Find message input
      let messageInput = await page.$('[data-testid="conversation-compose-box-input"]');
      if (!messageInput) {
        messageInput = await page.$('div[contenteditable="true"][data-tab="10"]');
      }
      if (!messageInput) {
        messageInput = await page.$('footer [contenteditable="true"]');
      }

      if (!messageInput) {
        mainWindow.webContents.send('log', `   ❌ Could not find chat - number may not be on WhatsApp`);
        const notFoundItem = { name: lead.name, phone, status: 'not_found', timestamp: new Date().toISOString() };
        results.push(notFoundItem);
        mainWindow.webContents.send('not-found', notFoundItem);
        continue;
      }

      // Send all messages for this lead
      let allMessagesSent = true;
      
      for (let msgIndex = 0; msgIndex < messageList.length; msgIndex++) {
        if (!isRunning) break;
        
        while (isPaused && isRunning) {
          await sleep(500);
        }
        
        const currentMessage = messageList[msgIndex];
        const personalizedMessage = currentMessage.replace(/{name}/gi, lead.name);
        
        // Log which message we're sending
        if (messageList.length > 1) {
          mainWindow.webContents.send('log', `   📝 Typing message ${msgIndex + 1}/${messageList.length}...`);
        } else {
          mainWindow.webContents.send('log', `   📝 Typing message...`);
        }

        // Re-find message input (in case DOM changed)
        messageInput = await page.$('[data-testid="conversation-compose-box-input"]');
        if (!messageInput) {
          messageInput = await page.$('div[contenteditable="true"][data-tab="10"]');
        }
        if (!messageInput) {
          messageInput = await page.$('footer [contenteditable="true"]');
        }

        if (!messageInput) {
          mainWindow.webContents.send('log', `   ❌ Lost message input`);
          allMessagesSent = false;
          break;
        }

        await messageInput.click();
        await sleep(300);

        const baseTypingSpeed = Number.isFinite(settings.typingSpeed) ? settings.typingSpeed : 50;
        const minTypingSpeed = Number.isFinite(settings.minTypingSpeed) ? settings.minTypingSpeed : baseTypingSpeed;
        const maxTypingSpeed = Number.isFinite(settings.maxTypingSpeed) ? settings.maxTypingSpeed : baseTypingSpeed;
        const clampedMinTyping = Math.max(10, Math.min(minTypingSpeed, maxTypingSpeed));
        const clampedMaxTyping = Math.max(clampedMinTyping, Math.max(minTypingSpeed, maxTypingSpeed));

        // Type message character by character with variable speed groups
        let groupSize = randomInt(3, 5);
        let groupSpeed = randomInt(clampedMinTyping, clampedMaxTyping);
        let groupCount = 0;

        for (const char of personalizedMessage) {
          if (groupCount >= groupSize) {
            groupSize = randomInt(3, 5);
            groupSpeed = randomInt(clampedMinTyping, clampedMaxTyping);
            groupCount = 0;
          }

          if (char === '\n') {
            await page.keyboard.down('Shift');
            await page.keyboard.press('Enter');
            await page.keyboard.up('Shift');
          } else {
            await page.keyboard.type(char);
          }

          await sleep(groupSpeed + randomInt(0, 15));
          groupCount++;
        }

        await sleep(500);

        if (testMode) {
          if (messageList.length > 1) {
            mainWindow.webContents.send('log', `   ✅ Message ${msgIndex + 1} typed (TEST MODE)`);
          } else {
            mainWindow.webContents.send('log', `   ✅ Message typed (TEST MODE - not sent)`);
          }
          // Clear the typed message in test mode
          await page.keyboard.down('Control');
          await page.keyboard.press('a');
          await page.keyboard.up('Control');
          await page.keyboard.press('Backspace');
        } else {
          // Send the message
          await page.keyboard.press('Enter');
          await sleep(1500);
          if (messageList.length > 1) {
            mainWindow.webContents.send('log', `   ✅ Message ${msgIndex + 1}/${messageList.length} SENT!`);
          } else {
            mainWindow.webContents.send('log', `   ✅ Message SENT!`);
          }
          
          // Report successful send to license server (only count actual sends, not test mode)
          const updatedStatus = await reportMessageSent();
          if (updatedStatus) {
            mainWindow.webContents.send('license-update', updatedStatus);
            
            // Check if trial just ended
            if (!updatedStatus.hasLicense && updatedStatus.isLocked) {
              mainWindow.webContents.send('log', `\n🔒 Trial ended! ${updatedStatus.messagesSent}/${updatedStatus.maxMessages} messages used.`);
              isRunning = false;
              break;
            }
          }
        }

        // If there are more messages, wait with user-defined delay
        if (msgIndex < messageList.length - 1 && isRunning) {
          const minMsgDelay = settings.minMsgDelay || 1000;
          const maxMsgDelay = settings.maxMsgDelay || 3000;
          const betweenDelay = calculateBetweenMessageDelay(minMsgDelay, maxMsgDelay);
          
          mainWindow.webContents.send('log', `   ⏳ Waiting ${betweenDelay}ms before next message...`);
          
          // Wait with the calculated delay
          while (isPaused && isRunning) {
            await sleep(500);
          }
          if (isRunning) {
            await sleep(betweenDelay);
          }
        }
      }

      // Record result
      if (allMessagesSent) {
        if (testMode) {
          results.push({ name: lead.name, phone, status: 'typed', messagesCount: messageList.length, timestamp: new Date().toISOString() });
        } else {
          results.push({ name: lead.name, phone, status: 'sent', messagesCount: messageList.length, timestamp: new Date().toISOString() });
        }
      } else {
        results.push({ name: lead.name, phone, status: 'partial', timestamp: new Date().toISOString() });
      }

      // Delay before next lead
      if (i < leads.length - 1 && isRunning) {
        const delay = randomDelay(settings.minDelay, settings.maxDelay);
        const totalSeconds = Math.max(1, Math.round(delay / 1000));

        mainWindow.webContents.send('log', `   ⏳ Waiting before next lead...`);

        for (let remaining = totalSeconds; remaining > 0 && isRunning; ) {
          while (isPaused && isRunning) {
            await sleep(500);
          }
          if (!isRunning) break;

          mainWindow.webContents.send('countdown', { totalSeconds, remaining });
          await sleep(1000);
          remaining -= 1;
        }
      }

    } catch (error) {
      mainWindow.webContents.send('log', `   ❌ Error: ${error.message}`);
      results.push({ name: lead.name, phone, status: 'error', error: error.message, timestamp: new Date().toISOString() });
    }
  }

  isRunning = false;
  return { success: true, results };
});
