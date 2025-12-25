// Popup script for Google Maps Lead Extractor with License Protection
document.addEventListener('DOMContentLoaded', async () => {
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
  
  // Periodic license validation (every 5 minutes)
  function startLicenseValidation() {
    if (validationInterval) clearInterval(validationInterval);
    
    validationInterval = setInterval(async () => {
      if (licenseClient) {
        const result = await licenseClient.validate(false); // Force server check
        if (!result.valid) {
          await chrome.storage.local.set({ licenseActivated: false });
          showLicenseScreen('License validation failed. Please re-activate.');
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  // Check license status
  async function checkLicense() {
    if (!licenseClient) {
      initLicenseClient();
    }
    
    if (!licenseClient) {
      // License client not loaded - show error
      showLicenseScreen('License system error. Please reinstall the extension.');
      return false;
    }
    
    try {
      const isValid = await licenseClient.init();
      if (isValid) {
        const info = await licenseClient.getLicenseInfo();
        // Save valid license state
        await chrome.storage.local.set({ licenseActivated: true });
        showMainContent(info);
        // Start periodic validation to check for revocation
        startLicenseValidation();
        return true;
      } else {
        // Only show lock screen if no token at all
        const stored = await chrome.storage.local.get(['__maps_ext_token__']);
        if (!stored.__maps_ext_token__) {
          showLicenseScreen();
          return false;
        }
        // Has token but init failed - might be network issue, show main content
        const info = await licenseClient.getLicenseInfo();
        showMainContent(info);
        return true;
      }
    } catch (e) {
      console.error('License check error:', e);
      // Don't lock out on errors - might be network issue
      showLicenseScreen();
      return false;
    }
  }
  
  // Show license activation screen
  function showLicenseScreen(errorMsg = null) {
    licenseScreen.classList.add('active');
    mainContent.style.display = 'none';
    notOnMaps.style.display = 'none';
    
    if (errorMsg) {
      licenseError.textContent = errorMsg;
      licenseError.classList.add('show');
    }
  }
  
  // Show main content (licensed)
  function showMainContent(licenseInfo) {
    licenseScreen.classList.remove('active');
    notOnMaps.style.display = 'none';
    mainContent.style.display = 'block';
    
    // Update license badge
    if (licenseInfo) {
      const type = licenseInfo.type || 'standard';
      licenseType.textContent = type.charAt(0).toUpperCase() + type.slice(1) + ' License';
      
      if (type === 'lifetime') {
        licenseBadge.className = 'license-badge pro';
      } else {
        licenseBadge.className = 'license-badge';
      }
    }
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
    
    try {
      if (!licenseClient) {
        initLicenseClient();
      }
      
      const result = await licenseClient.activate(key);
      
      if (result.success) {
        // Save activated state
        await chrome.storage.local.set({ licenseActivated: true });
        
        // Show main content
        showMainContent(result.license);
        
        // Check if on maps
        await checkTab();
      } else {
        const errorMsg = result.message || result.error || 'Activation failed. Please check your license key.';
        showLicenseError(errorMsg);
        licenseKeyInput.classList.add('error');
      }
    } catch (e) {
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
    if (isExtracting) {
      btnStart.style.display = 'none';
      btnStop.style.display = 'block';
      statusDiv.className = 'status-indicator extracting';
      statusText.textContent = 'Extracting leads...';
    } else {
      btnStart.style.display = 'block';
      btnStop.style.display = 'none';
      statusDiv.className = 'status-indicator';
      statusText.textContent = stats.total > 0 
        ? `${stats.noWebsite} leads without website` 
        : 'Ready to extract';
    }
  }
  
  // Request stats from content script
  async function requestStats() {
    if (!currentTab) return;
    
    try {
      chrome.tabs.sendMessage(currentTab.id, { type: 'GET_STATS' });
    } catch (e) {
      console.log('Could not request stats:', e);
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
      console.log('Could not start extraction:', e);
    }
  });
  
  // Stop extraction
  btnStop.addEventListener('click', async () => {
    if (!currentTab) return;
    
    try {
      chrome.tabs.sendMessage(currentTab.id, { type: 'STOP_EXTRACTION' });
    } catch (e) {
      console.log('Could not stop extraction:', e);
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
      console.log('Could not export:', e);
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
        lead.review_count || '',
        lead.rating || '',
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
        console.log('Could not clear:', e);
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
