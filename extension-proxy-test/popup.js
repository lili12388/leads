// Popup script for Google Maps Lead Extractor with License Protection
document.addEventListener('DOMContentLoaded', async () => {
  // ============================================
  // THEME TOGGLE FUNCTIONALITY
  // ============================================
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    // Default is dark mode (class already on body)
    // Load saved theme - only switch to light if explicitly saved as light
    chrome.storage.local.get(['gmePopupTheme'], (result) => {
      if (result.gmePopupTheme === 'light') {
        document.body.classList.remove('dark');
        themeBtn.textContent = '🌙';
      } else {
        // Dark is default
        themeBtn.textContent = '☀️';
      }
    });
    
    // Toggle theme
    themeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      themeBtn.textContent = isDark ? '☀️' : '🌙';
      chrome.storage.local.set({ gmePopupTheme: isDark ? 'dark' : 'light' });
    });
  }
  
  // ============================================
  // ELEMENTS
  // ============================================
  // Elements
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const btnExport = document.getElementById('btn-export');
  const btnClear = document.getElementById('btn-clear');
  const leadsCount = document.getElementById('leads-count');
  const noWebsiteCount = document.getElementById('no-website-count');
  const withPhoneCount = document.getElementById('with-phone-count');
  const scrollCountEl = document.getElementById('scroll-count');
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const mainContent = document.getElementById('main-content');
  const notOnMaps = document.getElementById('not-on-maps');
  
  // License elements
  const licenseScreen = document.getElementById('license-screen');
  const licenseKeyInput = document.getElementById('license-key');
  const btnActivateLicense = document.getElementById('btn-activate-license');
  const activateText = document.getElementById('activate-text');
  const licenseError = document.getElementById('license-error');
  const licenseBadge = document.getElementById('license-badge');
  const licenseType = document.getElementById('license-type');
  
  // Settings
  const scrollDelayInput = document.getElementById('scroll-delay');
  const maxLeadsInput = document.getElementById('max-leads');
  const autoScrollCheckbox = document.getElementById('auto-scroll');
  const onlyNoWebsiteCheckbox = document.getElementById('only-no-website');
  
  let currentTab = null;
  let isExtracting = false;
  let licenseClient = null;
  let validationInterval = null;
  
  // Initialize license client
  function initLicenseClient() {
    if (typeof LicenseClient !== 'undefined') {
      licenseClient = new LicenseClient();
      
      // Listen for license events (revocation, expiry)
      licenseClient.on('onInvalid', async (data) => {
        await chrome.storage.local.set({ licenseActivated: false });
        showLicenseScreen('License has been revoked or is invalid.');
      });
      
      licenseClient.on('onExpired', async () => {
        await chrome.storage.local.set({ licenseActivated: false });
        showLicenseScreen('Your license has expired. Please renew.');
      });
    }
  }
  
  // Periodic license validation - checks SERVER/DATABASE every 1 HOUR
  function startLicenseValidation() {
    if (validationInterval) clearInterval(validationInterval);
    
    validationInterval = setInterval(async () => {
      if (licenseClient) {
        try {
          const result = await licenseClient.validate(false); // FALSE = force SERVER check (not cache)
          if (!result.valid) {
            // Only lock out for explicit revocation
            const criticalErrors = ['LICENSE_REVOKED', 'ACTIVATION_INVALID', 'LICENSE_EXPIRED'];
            if (criticalErrors.includes(result.error)) {
              await chrome.storage.local.set({ licenseActivated: false });
              showLicenseScreen(result.message || 'License has been revoked.');
            }
            // Any other error - ignore, user stays logged in
          }
        } catch (e) {
          // Network error - ignore completely, user stays logged in
        }
      }
    }, 60 * 60 * 1000); // Every 1 HOUR (3600000 ms)
  }
  
  // Check license status - VALIDATES WITH SERVER on every popup open
  async function checkLicense() {
    if (!licenseClient) {
      initLicenseClient();
    }
    
    if (!licenseClient) {
      showLicenseScreen('License system error. Please reinstall the extension.');
      return false;
    }
    
    // Check for token first
    const stored = await chrome.storage.local.get(['licenseActivated', '__maps_ext_token__']);
    
    // No token at all - show license screen
    if (!stored.__maps_ext_token__) {
      showLicenseScreen();
      return false;
    }
    
    // Show checking state while validating with server
    showCheckingLicense();
    
    // ALWAYS validate with server on popup open (force server check, no cache)
    try {
      const result = await licenseClient.validate(false); // FALSE = force server check
      
      if (result.valid) {
        const info = await licenseClient.getLicenseInfo();
        await chrome.storage.local.set({ licenseActivated: true });
        showMainContent(info);
        // Start background validation as backup
        startLicenseValidation();
        return true;
      } else {
        // License is invalid/revoked/expired
        const criticalErrors = ['LICENSE_REVOKED', 'ACTIVATION_INVALID', 'LICENSE_EXPIRED'];
        
        if (criticalErrors.includes(result.error)) {
          // Clear license data
          await chrome.storage.local.set({ licenseActivated: false });
          await chrome.storage.local.remove(['__maps_ext_token__', '__maps_ext_cache__']);
          
          // Notify content script to remove panel
          try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'LICENSE_REVOKED' });
            }
          } catch(e) {}
          
          showLicenseScreen(result.message || 'Your license has been revoked.');
          return false;
        }
        
        // For other errors, check if previously activated (grace period)
        if (stored.licenseActivated === true) {
          const info = await licenseClient.getLicenseInfo();
          showMainContent(info);
          startLicenseValidation();
          return true;
        }
      }
    } catch (e) {
      // Network error - allow if previously activated
      if (stored.licenseActivated === true) {
        const info = await licenseClient.getLicenseInfo();
        showMainContent(info);
        startLicenseValidation();
        return true;
      }
    }
    
    // Fall back to showing license screen
    showLicenseScreen();
    return false;
  }
  
  // Show license activation screen
  function showLicenseScreen(errorMsg = null) {
    licenseScreen.classList.add('active');
    mainContent.style.display = 'none';
    notOnMaps.style.display = 'none';
    
    // Remove checking message if present
    const checkingMsg = document.getElementById('gme-checking-license');
    if (checkingMsg) checkingMsg.remove();
    
    if (errorMsg) {
      licenseError.textContent = errorMsg;
      licenseError.classList.add('show');
    }
  }
  
  // Show checking license state
  function showCheckingLicense() {
    licenseScreen.classList.remove('active');
    mainContent.style.display = 'none';
    notOnMaps.style.display = 'none';
    
    // Create or update checking message
    let checkingDiv = document.getElementById('gme-checking-license');
    if (!checkingDiv) {
      checkingDiv = document.createElement('div');
      checkingDiv.id = 'gme-checking-license';
      checkingDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px 20px; color: var(--popup-text-secondary, #64748b);';
      checkingDiv.innerHTML = `
        <div style="width: 18px; height: 18px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: gme-spin 0.8s linear infinite;"></div>
        <span style="font-size: 14px;">Please wait...</span>
        <style>@keyframes gme-spin { to { transform: rotate(360deg); } }</style>
      `;
      document.querySelector('.main-content-area').prepend(checkingDiv);
    }
  }
  
  // ============================================
  // GOOGLE SHEETS SYNC (in popup)
  // ============================================
  
  const SHEETS_API_URL = 'https://gle3-git-main-rimenehmaid-3753s-projects.vercel.app/api/sheets/append';
  const SHEETS_TEST_URL = 'https://gle3-git-main-rimenehmaid-3753s-projects.vercel.app/api/sheets/test';
  const SHEETS_API_KEY = 'demo-sheets-key-2025';
  
  let sheetsConfig = { sheetId: '', tabName: 'Leads' };
  let sheetsSyncEnabled = false;
  let sheetsSyncNoWebsiteOnly = false;
  let sheetsDemoMode = false;
  
  // Parse Sheet ID from URL or raw ID
  function parseSheetId(input) {
    if (!input) return '';
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    return input.trim();
  }
  
  // Load sheets config from storage
  async function loadSheetsConfig() {
    const result = await chrome.storage.local.get(['sheetsConfig', 'sheetsSyncEnabled', 'sheetsSyncNoWebsiteOnly', 'sheetsDemoMode']);
    if (result.sheetsConfig) {
      sheetsConfig = result.sheetsConfig;
    }
    sheetsSyncEnabled = result.sheetsSyncEnabled === true;
    sheetsSyncNoWebsiteOnly = result.sheetsSyncNoWebsiteOnly === true;
    sheetsDemoMode = result.sheetsDemoMode === true;
    
    // Update UI
    const inputEl = document.getElementById('sheets-url');
    const toggleEl = document.getElementById('sheets-toggle');
    const noWebsiteEl = document.getElementById('sheets-no-website-only');
    const demoModeEl = document.getElementById('sheets-demo-mode');
    if (inputEl && sheetsConfig.sheetId) {
      inputEl.value = sheetsConfig.sheetId;
    }
    if (toggleEl) {
      toggleEl.checked = sheetsSyncEnabled;
    }
    if (noWebsiteEl) {
      noWebsiteEl.checked = sheetsSyncNoWebsiteOnly;
    }
    if (demoModeEl) {
      demoModeEl.checked = sheetsDemoMode;
    }
    
    // If enabled, test connection
    if (sheetsSyncEnabled && sheetsConfig.sheetId) {
      testSheetsConnection();
    }
  }
  
  // Save sheets config to storage
  async function saveSheetsConfig() {
    await chrome.storage.local.set({ 
      sheetsConfig: sheetsConfig,
      sheetsSyncEnabled: sheetsSyncEnabled,
      sheetsSyncNoWebsiteOnly: sheetsSyncNoWebsiteOnly,
      sheetsDemoMode: sheetsDemoMode
    });
  }
  
  // Test connection to sheet
  async function testSheetsConnection() {
    const statusEl = document.getElementById('sheets-status');
    if (statusEl) statusEl.textContent = '⏳ Testing...';
    
    try {
      const response = await fetch(SHEETS_TEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SHEETS_API_KEY
        },
        body: JSON.stringify({
          sheetId: sheetsConfig.sheetId,
          tabName: sheetsConfig.tabName || 'Leads'
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        if (statusEl) statusEl.innerHTML = '✅ Connected to: <strong>' + data.sheetTitle + '</strong>';
        return true;
      } else {
        if (statusEl) statusEl.textContent = '❌ ' + data.error;
        return false;
      }
    } catch (error) {
      if (statusEl) statusEl.textContent = '❌ Network error';
      return false;
    }
  }
  
  // Toggle live sync
  async function toggleSheetsSync() {
    const toggle = document.getElementById('sheets-toggle');
    const inputEl = document.getElementById('sheets-url');
    
    sheetsSyncEnabled = toggle ? toggle.checked : false;
    
    if (sheetsSyncEnabled) {
      // Validate sheet ID first
      if (inputEl) {
        sheetsConfig.sheetId = parseSheetId(inputEl.value);
      }
      
      if (!sheetsConfig.sheetId) {
        alert('Please enter a Google Sheet URL or ID');
        if (toggle) toggle.checked = false;
        sheetsSyncEnabled = false;
        return;
      }
      
      // Test connection
      const connected = await testSheetsConnection();
      if (connected) {
        await saveSheetsConfig();
      } else {
        if (toggle) toggle.checked = false;
        sheetsSyncEnabled = false;
      }
    } else {
      await saveSheetsConfig();
      const statusEl = document.getElementById('sheets-status');
      if (statusEl) statusEl.textContent = 'Sync disabled';
    }
  }
  
  // Initialize sheets UI
  function initSheetsUI() {
    const testBtn = document.getElementById('sheets-test-btn');
    const toggleEl = document.getElementById('sheets-toggle');
    const inputEl = document.getElementById('sheets-url');
    const noWebsiteEl = document.getElementById('sheets-no-website-only');
    const demoModeEl = document.getElementById('sheets-demo-mode');
    const helpBtn = document.getElementById('sheets-help-btn');
    const helpOverlay = document.getElementById('sheets-help-overlay');
    const helpClose = document.getElementById('sheets-help-close');
    const serviceEmail = document.getElementById('sheets-service-email');
    
    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        if (inputEl) {
          sheetsConfig.sheetId = parseSheetId(inputEl.value);
        }
        if (!sheetsConfig.sheetId) {
          alert('Please enter a Google Sheet URL or ID');
          return;
        }
        await testSheetsConnection();
      });
    }
    
    if (toggleEl) {
      toggleEl.addEventListener('change', toggleSheetsSync);
    }
    
    if (noWebsiteEl) {
      noWebsiteEl.addEventListener('change', async () => {
        sheetsSyncNoWebsiteOnly = noWebsiteEl.checked;
        await saveSheetsConfig();
      });
    }
    
    if (demoModeEl) {
      demoModeEl.addEventListener('change', async () => {
        sheetsDemoMode = demoModeEl.checked;
        await saveSheetsConfig();
      });
    }
    
    // Help modal handlers
    if (helpBtn && helpOverlay) {
      helpBtn.addEventListener('click', () => {
        helpOverlay.classList.add('active');
      });
    }
    
    if (helpClose && helpOverlay) {
      helpClose.addEventListener('click', () => {
        helpOverlay.classList.remove('active');
      });
    }
    
    if (helpOverlay) {
      helpOverlay.addEventListener('click', (e) => {
        if (e.target === helpOverlay) {
          helpOverlay.classList.remove('active');
        }
      });
    }
    
    // Copy service email on click
    if (serviceEmail) {
      serviceEmail.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText('sheets-writer@ggl-maps-extractor.iam.gserviceaccount.com');
          serviceEmail.textContent = '✅ Copied to clipboard!';
          serviceEmail.style.cursor = 'default';
          serviceEmail.style.opacity = '0.7';
          // Remove the click functionality after copying
          serviceEmail.style.pointerEvents = 'none';
        } catch (err) {
          // Fallback selection
          const range = document.createRange();
          range.selectNode(serviceEmail);
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
        }
      });
    }
    
    // Load saved config
    loadSheetsConfig();
  }
  
  // ============================================
  // END GOOGLE SHEETS SYNC
  // ============================================
  
  // Show main content (licensed)
  function showMainContent(licenseInfo) {
    licenseScreen.classList.remove('active');
    notOnMaps.style.display = 'none';
    mainContent.style.display = 'block';
    
    // Remove checking message if present
    const checkingMsg = document.getElementById('gme-checking-license');
    if (checkingMsg) checkingMsg.remove();
    
    // Update license badge - always show Lifetime License
    licenseType.textContent = 'Lifetime License';
    licenseBadge.className = 'license-badge pro';
    
    // REMOVE action buttons and settings - user must use floating window for extraction
    const controls = document.querySelector('.controls');
    const settings = document.querySelector('.settings');
    const statusCard = document.querySelector('.status-card');
    
    if (controls) controls.remove();
    if (settings) settings.remove();
    if (statusCard) statusCard.remove();
    
    // Show simple license status message (insert before sheets section)
    let messageDiv = document.getElementById('gme-popup-message');
    const sheetsSection = document.getElementById('sheets-section');
    
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.id = 'gme-popup-message';
      messageDiv.style.cssText = 'padding: 12px 0 16px 0; border-bottom: 1px solid var(--popup-card-border, rgba(148, 163, 184, 0.2)); margin-bottom: 16px;';
      messageDiv.innerHTML = `
        <div style="font-size: 13px; font-weight: 600; color: var(--gme-success, #059669); margin-bottom: 4px;">✓ License Activated!</div>
        <div style="font-size: 12px; color: var(--popup-text-secondary, #64748b);">Your license is active and ready to use.</div>
      `;
      
      // Insert before sheets section if it exists
      if (sheetsSection) {
        mainContent.insertBefore(messageDiv, sheetsSection);
      } else {
        mainContent.appendChild(messageDiv);
      }
    }
    
    // Initialize Google Sheets UI
    initSheetsUI();
  }
  
  // Handle license activation
  async function activateLicense() {
    const key = licenseKeyInput.value.trim().toUpperCase();
    
    if (!key || key.length < 10) {
      showLicenseError('Please enter a valid license key');
      return;
    }
    
    // Disable button and show loading
    btnActivateLicense.disabled = true;
    activateText.textContent = '⏳ Activating...';
    licenseError.classList.remove('show');
    licenseKeyInput.classList.remove('error');
    
    // Show checking license state (only during first activation)
    showCheckingLicense();
    
    // Start timer for minimum display time (3700ms)
    const startTime = Date.now();
    const MIN_DISPLAY_TIME = 3700;
    
    try {
      if (!licenseClient) {
        initLicenseClient();
      }
      
      const result = await licenseClient.activate(key);
      
      // Wait for minimum display time to complete
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DISPLAY_TIME) {
        await new Promise(r => setTimeout(r, MIN_DISPLAY_TIME - elapsed));
      }
      
      if (result.success) {
        // Save activated state
        await chrome.storage.local.set({ licenseActivated: true });
        
        // Show main content
        showMainContent(result.license);
        
        // Notify content script to show panel immediately
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab && tab.url && tab.url.includes('google.com/maps')) {
            chrome.tabs.sendMessage(tab.id, { type: 'LICENSE_ACTIVATED' });
          }
        } catch (e) {}
        
        // Check if on maps
        await checkTab();
      } else {
        // Hide checking state, show license screen with error
        const checkingMsg = document.getElementById('gme-checking-license');
        if (checkingMsg) checkingMsg.remove();
        licenseScreen.classList.add('active');
        
        const errorMsg = result.message || result.error || 'Activation failed. Please check your license key.';
        showLicenseError(errorMsg);
        licenseKeyInput.classList.add('error');
      }
    } catch (e) {
      // Wait for minimum display time even on error
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_DISPLAY_TIME) {
        await new Promise(r => setTimeout(r, MIN_DISPLAY_TIME - elapsed));
      }
      
      // Hide checking state, show license screen with error
      const checkingMsg = document.getElementById('gme-checking-license');
      if (checkingMsg) checkingMsg.remove();
      licenseScreen.classList.add('active');
      
      showLicenseError('Connection error: ' + e.message);
      licenseKeyInput.classList.add('error');
    } finally {
      btnActivateLicense.disabled = false;
      activateText.textContent = '🔓 Activate License';
    }
  }
  
  // Show license error
  function showLicenseError(msg) {
    licenseError.textContent = msg;
    licenseError.classList.add('show');
  }
  
  // Format license key input
  function formatLicenseKey(input) {
    // Remove non-alphanumeric characters
    let value = input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Handle LIC prefix specially - format as LIC-XXXX-XXXX-XXXX-XXXX
    let formatted = '';
    for (let i = 0; i < value.length && i < 19; i++) {
      // Add dash after LIC (position 3) and then every 4 chars
      if (i === 3 || i === 7 || i === 11 || i === 15) {
        formatted += '-';
      }
      formatted += value[i];
    }
    
    return formatted;
  }
  
  // License key input formatting
  licenseKeyInput.addEventListener('input', (e) => {
    e.target.value = formatLicenseKey(e.target.value);
    licenseKeyInput.classList.remove('error');
    licenseError.classList.remove('show');
  });
  
  // Enter key to activate
  licenseKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      activateLicense();
    }
  });
  
  // Activate button click
  btnActivateLicense.addEventListener('click', activateLicense);
  
  // Check if on Google Maps
  async function checkTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    // Only check if main content is visible (licensed)
    if (!mainContent || mainContent.style.display === 'none') {
      return false;
    }
    
    if (!tab.url || !tab.url.includes('google.com/maps')) {
      mainContent.style.display = 'none';
      notOnMaps.style.display = 'block';
      return false;
    }
    
    mainContent.style.display = 'block';
    notOnMaps.style.display = 'none';
    return true;
  }
  
  // Update stats display
  function updateStatsDisplay(stats) {
    if (!stats) return;
    
    leadsCount.textContent = stats.total || 0;
    noWebsiteCount.textContent = stats.noWebsite || 0;
    withPhoneCount.textContent = stats.withPhone || 0;
    scrollCountEl.textContent = stats.scrolls || 0;
    isExtracting = stats.isExtracting || false;
    
    // Update buttons
    if (stats.isStoppingWithEnrichment) {
      // Waiting for enrichment to finish - show yellow "Please wait" state
      btnStart.style.display = 'block';
      btnStart.disabled = true;
      btnStop.style.display = 'none';
      statusDiv.className = 'status-indicator extracting';
      statusText.textContent = `⏳ Please wait... finishing ${stats.enrichmentRemaining} enrichment(s)`;
    } else if (isExtracting) {
      btnStart.style.display = 'none';
      btnStart.disabled = false;
      btnStop.style.display = 'block';
      statusDiv.className = 'status-indicator extracting';
      statusText.textContent = `Extracting... ${stats.total} leads`;
    } else {
      btnStart.style.display = 'block';
      btnStart.disabled = false;
      btnStop.style.display = 'none';
      if (stats.total > 0) {
        statusDiv.className = 'status-indicator paused';
        statusText.textContent = `⏸ Paused — ${stats.total} leads | Click Start to resume`;
      } else {
        statusDiv.className = 'status-indicator';
        statusText.textContent = 'Ready to extract';
      }
    }
  }
  
  // Request stats from content script
  async function requestStats() {
    if (!currentTab) return;
    
    try {
      chrome.tabs.sendMessage(currentTab.id, { type: 'GET_STATS' }, (response) => {
        if (response) {
          updateStatsDisplay(response);
        }
      });
    } catch (e) {
      // Silent error handling
    }
  }
  
  // Load settings
  async function loadSettings() {
    const s = await chrome.storage.local.get(['scrollDelay', 'maxLeads', 'autoScroll', 'onlyNoWebsite']);
    if (s.scrollDelay) scrollDelayInput.value = s.scrollDelay;
    if (s.maxLeads !== undefined) maxLeadsInput.value = s.maxLeads;
    if (s.autoScroll !== undefined) autoScrollCheckbox.checked = s.autoScroll;
    if (s.onlyNoWebsite !== undefined) onlyNoWebsiteCheckbox.checked = s.onlyNoWebsite;
  }
  
  // Save settings
  async function saveSettings() {
    await chrome.storage.local.set({
      scrollDelay: parseInt(scrollDelayInput.value) || 500,
      maxLeads: parseInt(maxLeadsInput.value) || 0,
      autoScroll: autoScrollCheckbox.checked,
      onlyNoWebsite: onlyNoWebsiteCheckbox.checked
    });
  }
  
  // Start extraction (with license revalidation)
  btnStart.addEventListener('click', async () => {
    if (!currentTab) return;
    
    // Revalidate license before extraction
    if (licenseClient) {
      const isValid = await licenseClient.validate();
      if (!isValid) {
        showLicenseScreen('Your license has expired or been revoked. Please reactivate.');
        return;
      }
    }
    
    await saveSettings();
    
    const settings = {
      scrollDelay: parseInt(scrollDelayInput.value) || 500,
      maxLeads: parseInt(maxLeadsInput.value) || 0,
      autoScroll: autoScrollCheckbox.checked
    };
    
    try {
      chrome.tabs.sendMessage(currentTab.id, {
        type: 'START_EXTRACTION',
        settings: settings
      });
    } catch (e) {
      // Silent error handling
    }
  });
  
  // Stop extraction
  btnStop.addEventListener('click', async () => {
    if (!currentTab) return;
    
    try {
      chrome.tabs.sendMessage(currentTab.id, { type: 'STOP_EXTRACTION' });
    } catch (e) {
      // Silent error handling
    }
  });
  
  // Export CSV (with license check)
  btnExport.addEventListener('click', async () => {
    if (!currentTab) return;
    
    // Check license before export
    if (licenseClient) {
      const isValid = await licenseClient.validate();
      if (!isValid) {
        showLicenseScreen('Your license has expired. Please reactivate to export data.');
        return;
      }
    }
    
    try {
      // Get leads from content script
      chrome.tabs.sendMessage(currentTab.id, { type: 'GET_LEADS' }, (response) => {
        if (!response || !response.leads || response.leads.length === 0) {
          alert('No leads to export!');
          return;
        }
        
        let leads = response.leads;
        
        // Filter if option checked
        if (onlyNoWebsiteCheckbox.checked) {
          leads = leads.filter(l => !l.has_website && !l.facebook && !l.instagram);
          if (leads.length === 0) {
            alert('No leads without website found!');
            return;
          }
        }
        
        exportToCSV(leads);
      });
    } catch (e) {
      // Silent error handling
    }
  });
  
  // Export function
  function exportToCSV(leads) {
    const headers = ['Name', 'Phone', 'Email', 'Website', 'Address', 'Instagram', 'Facebook', 'ReviewCount', 'AverageRating', 'Category'];
    
    const rows = leads.map(lead => {
      const fullAddress = lead.address ? (lead.city ? `${lead.address}, ${lead.city}` : lead.address) : '';
      return [
        lead.name || '',
        lead.phone || '',
        '', // Email - not available
        lead.website || '',
        fullAddress,
        lead.instagram || '',
        lead.facebook || '',
        lead.reviewCount || '',
        lead.averageRating || '',
        lead.category || ''
      ];
    });
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `google_maps_leads_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv`,
      saveAs: true
    });
  }
  
  // Clear leads
  btnClear.addEventListener('click', async () => {
    if (!currentTab) return;
    
    if (confirm('Clear all extracted leads?')) {
      try {
        chrome.tabs.sendMessage(currentTab.id, { type: 'CLEAR_LEADS' });
      } catch (e) {
        // Silent error handling
      }
    }
  });
  
  // Listen for stats updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STATS_UPDATE') {
      updateStatsDisplay(message.stats);
    } else if (message.action === 'activateLicense') {
      // Handle license activation from content script
      (async () => {
        try {
          if (!licenseClient) {
            initLicenseClient();
          }
          
          const result = await licenseClient.activate(message.key);
          
          if (result.success) {
            await chrome.storage.local.set({ licenseActivated: true });
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: result.message || result.error });
          }
        } catch (e) {
          sendResponse({ success: false, error: 'Connection error: ' + e.message });
        }
      })();
      return true; // Keep channel open for async response
    }
  });
  
  // Initialize
  initLicenseClient();
  
  // Check license first
  const isLicensed = await checkLicense();
  
  if (isLicensed) {
    // Start periodic license validation
    startLicenseValidation();
    
    // Licensed - check if on maps
    const onMaps = await checkTab();
    if (onMaps) {
      await loadSettings();
      requestStats();
      
      // Poll for stats periodically
      setInterval(requestStats, 2000);
    }
  }
});
