/**
 * G-Maps Extractor - Content Script (Proxy + Fetch Version)
 * 
 * Based on extension-backup (readable source)
 * Uses new Proxy+Fetch interception method for data capture
 */

(function() {
  'use strict';
  
  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    messageType: 'gme_data_capture',
    debug: false,
    apiBase: 'https://gle3-git-main-rimenehmaid-3753s-projects.vercel.app',
    apiKey: 'demo-sheets-key-2025'
  };
  
  // API URLs
  const API_BASE_URL = CONFIG.apiBase;
  const SHEETS_API_URL = API_BASE_URL + '/api/sheets/append';
  const SHEETS_TEST_URL = API_BASE_URL + '/api/sheets/test';
  const ENRICH_API_URL = API_BASE_URL + '/api/enrich';
  const SHEETS_API_KEY = CONFIG.apiKey;
  
  // ============================================
  // STATE
  // ============================================
  let extractedLeads = new Map();
  let leads_lnglat = new Set();
  let leads_phones = new Set();
  let isAlwaysCapture = false;  // Button state - user clicked Start
  let isExtracting = false;
  let isCreatingPanel = false;  // Prevent duplicate panel creation
  let scrollCount = 0;
  let totalScrollCount = 0;
  let autoScrollInterval = null;
  let isLicenseValid = false;
  let isWaitingForSearchRefresh = false;
  let hasReceivedSearchData = false;
  let userClickedStart = false;  // Track if user has clicked Start button
  
  // Email enrichment state
  let enrichmentQueue = [];
  let enrichmentInProgress = 0;
  let enrichmentTotal = 0;
  let enrichmentCompleted = 0;
  let isStoppingWithEnrichment = false;
  const MAX_CONCURRENT_ENRICHMENTS = 3;
  const EMAIL_FETCH_TIMEOUT = 4000; // 4 second hard timeout per email
  
  // Google Sheets live sync state
  let sheetsQueue = [];
  let sheetsSyncEnabled = false;
  let sheetsSyncNoWebsiteOnly = false;
  let sheetsDemoMode = false;
  let sheetsSyncInterval = null;
  let demoModeActive = false;
  let demoRateLimited = false;
  let sheetsConfig = { sheetId: '', tabName: 'Sheet1' };
  let sheetsStats = {
    totalSent: 0,
    duplicatesSkipped: 0,
    lastSyncTime: null,
    lastError: null,
    isConnected: false
  };
  let sentLeadKeys = new Set();
  
  // ============================================
  // DEBUG LOGGING
  // ============================================
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[GME Content]', ...args);
    }
  }
  
  // ============================================
  // GOOGLE SHEETS LIVE SYNC
  // ============================================
  
  async function loadSheetsConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['sheetsConfig', 'sheetsSyncEnabled', 'sheetsSyncNoWebsiteOnly', 'sheetsDemoMode'], (result) => {
        if (result.sheetsConfig) {
          sheetsConfig = result.sheetsConfig;
        }
        sheetsSyncEnabled = result.sheetsSyncEnabled === true;
        sheetsSyncNoWebsiteOnly = result.sheetsSyncNoWebsiteOnly === true;
        sheetsDemoMode = result.sheetsDemoMode === true;
        resolve();
      });
    });
  }
  
  async function saveSheetsConfig() {
    await chrome.storage.local.set({ 
      sheetsConfig: sheetsConfig,
      sheetsSyncEnabled: sheetsSyncEnabled
    });
  }
  
  function parseSheetId(input) {
    if (!input) return '';
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];
    return input.trim();
  }
  
  function createLeadDedupKey(lead) {
    const website = (lead.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').split('/')[0];
    const invalidWebsites = ['not found', 'no website found', '', 'no website'];
    if (website && !invalidWebsites.includes(website)) return `web:${website}`;
    
    const phone = (lead.phone || '').replace(/\D/g, '');
    if (phone) return `phone:${phone}`;
    
    return `name:${(lead.name || '').toLowerCase()}|${(lead.address || '').toLowerCase()}`;
  }
  
  function queueLeadForSync(lead) {
    if (!sheetsSyncEnabled || !sheetsConfig.sheetId) return;
    
    if (sheetsSyncNoWebsiteOnly) {
      const website = (lead.website || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').trim();
      const invalidWebsites = ['not found', 'no website found', 'n/a', '', 'no website'];
      const hasValidWebsite = website && !invalidWebsites.includes(website);
      if (hasValidWebsite) return;
    }
    
    const key = createLeadDedupKey(lead);
    if (sentLeadKeys.has(key)) return;
    
    sheetsQueue.push({
      name: lead.name || '',
      phone: lead.phone || '',
      email: (lead.email && lead.email !== 'Fetching...') ? lead.email : '',
      website: lead.website || '',
      address: lead.address || '',
      instagram: lead.instagram || '',
      facebook: lead.facebook || '',
      category: lead.category || '',
      reviewCount: lead.review_count || '',
      averageRating: lead.rating || ''
    });
    
    sentLeadKeys.add(key);
    updateSheetsStatusUI();
  }
  
  async function sendBatchToSheets() {
    if (sheetsQueue.length === 0) return;
    
    // Always use fast streaming mode first
    if (!demoRateLimited) {
      startFastStreaming();
      return;
    }
    
    // Fallback: batch mode when rate limited
    const batch = sheetsQueue.splice(0, 10);
    
    try {
      const response = await fetch(SHEETS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SHEETS_API_KEY
        },
        body: JSON.stringify({
          sheetId: sheetsConfig.sheetId,
          tabName: sheetsConfig.tabName || 'Sheet1',
          leads: batch
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        sheetsStats.totalSent += data.appended;
        sheetsStats.duplicatesSkipped += data.skipped_duplicates || 0;
        sheetsStats.lastSyncTime = new Date();
        sheetsStats.lastError = null;
        sheetsStats.isConnected = true;
        
        // Reset rate limit flag after successful batch - try fast again
        demoRateLimited = false;
      } else {
        sheetsQueue.unshift(...batch);
        sheetsStats.lastError = data.error || 'Unknown error';
      }
    } catch (error) {
      sheetsQueue.unshift(...batch);
      sheetsStats.lastError = 'Network error: ' + error.message;
    }
    
    updateSheetsStatusUI();
  }
  
  // Fast streaming - send leads as fast as possible
  async function startFastStreaming() {
    if (demoModeActive) return;
    demoModeActive = true;
    
    while (sheetsQueue.length > 0 && !demoRateLimited) {
      const result = await sendSingleLead();
      
      if (result.rateLimited) {
        demoRateLimited = true;
        sheetsStats.lastError = '⚠️ Rate limit hit - slowing down';
        updateSheetsStatusUI();
        break;
      }
      
      if (!result.success && !result.empty) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        // Minimum delay between requests (50ms)
        await new Promise(r => setTimeout(r, 50));
      }
    }
    
    demoModeActive = false;
  }
  
  // Send a single lead (or small batch) for fast streaming
  async function sendSingleLead() {
    if (sheetsQueue.length === 0) return { success: true, empty: true };
    
    // Send 1-3 leads at a time for speed
    const batchSize = Math.min(sheetsQueue.length, 3);
    const batch = sheetsQueue.splice(0, batchSize);
    
    try {
      const response = await fetch(SHEETS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SHEETS_API_KEY
        },
        body: JSON.stringify({
          sheetId: sheetsConfig.sheetId,
          tabName: sheetsConfig.tabName || 'Sheet1',
          leads: batch
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        sheetsStats.totalSent += data.appended;
        sheetsStats.lastSyncTime = new Date();
        sheetsStats.lastError = null;
        sheetsStats.isConnected = true;
        updateSheetsStatusUI();
        return { success: true };
      } else {
        if (response.status === 429 || data.error?.includes('rate') || data.error?.includes('quota')) {
          sheetsQueue.unshift(...batch);
          return { success: false, rateLimited: true };
        }
        sheetsQueue.unshift(...batch);
        sheetsStats.lastError = data.error || 'Unknown error';
        updateSheetsStatusUI();
        return { success: false };
      }
    } catch (error) {
      sheetsQueue.unshift(...batch);
      sheetsStats.lastError = 'Network error';
      updateSheetsStatusUI();
      return { success: false };
    }
  }
  
  function startSheetsSync() {
    if (sheetsSyncInterval) return;
    // Fast interval - 300ms to check queue frequently
    sheetsSyncInterval = setInterval(sendBatchToSheets, 300);
  }
  
  function stopSheetsSync() {
    if (sheetsSyncInterval) {
      clearInterval(sheetsSyncInterval);
      sheetsSyncInterval = null;
    }
    demoModeActive = false;
  }
  
  async function testSheetsConnection() {
    const statusEl = document.getElementById('gme-sheets-status');
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
          tabName: sheetsConfig.tabName || 'Sheet1'
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        sheetsStats.isConnected = true;
        sheetsStats.lastError = null;
        if (statusEl) statusEl.innerHTML = '✅ Connected to: <strong>' + data.sheetTitle + '</strong>';
        return true;
      } else {
        sheetsStats.isConnected = false;
        sheetsStats.lastError = data.error;
        if (statusEl) statusEl.textContent = '❌ ' + data.error;
        return false;
      }
    } catch (error) {
      sheetsStats.isConnected = false;
      sheetsStats.lastError = error.message;
      if (statusEl) statusEl.textContent = '❌ Network error';
      return false;
    }
  }
  
  function updateSheetsStatusUI() {
    // Status shown in popup
  }
  
  // ============================================
  // LICENSE CHECK
  // ============================================
  
  async function checkLicenseStatus() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['licenseActivated'], (result) => {
        isLicenseValid = result.licenseActivated === true;
        resolve(isLicenseValid);
      });
    });
  }
  
  // Listen for license and sheets config changes from popup
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.licenseActivated) {
        isLicenseValid = changes.licenseActivated.newValue === true;
        if (isLicenseValid) {
          // License just activated - create panel if not exists
          createFloatingPanel();
          setupSearchListeners();
        } else {
          // License deactivated - remove panel
          const panel = document.getElementById('gme-floating-panel');
          if (panel) panel.remove();
        }
      }
      
      if (changes.sheetsSyncEnabled !== undefined) {
        sheetsSyncEnabled = changes.sheetsSyncEnabled.newValue === true;
        if (sheetsSyncEnabled) {
          loadSheetsConfig().then(() => {
            if (sheetsConfig.sheetId) {
              testSheetsConnection().then(connected => {
                if (connected) startSheetsSync();
              });
            }
          });
        } else {
          stopSheetsSync();
        }
      }
      
      if (changes.sheetsConfig) {
        sheetsConfig = changes.sheetsConfig.newValue || { sheetId: '', tabName: 'Sheet1' };
      }
      
      if (changes.sheetsSyncNoWebsiteOnly !== undefined) {
        sheetsSyncNoWebsiteOnly = changes.sheetsSyncNoWebsiteOnly.newValue === true;
      }
      
      if (changes.sheetsDemoMode !== undefined) {
        sheetsDemoMode = changes.sheetsDemoMode.newValue === true;
        demoRateLimited = false;
        if (sheetsSyncEnabled && sheetsConfig.sheetId) {
          stopSheetsSync();
          startSheetsSync();
        }
      }
    }
  });
  
  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================
  
  function showToast(message, duration = 3000, type = 'info') {
    const existingToast = document.getElementById('gme-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'gme-toast';
    toast.className = type;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  function showSearchAreaReminder() {
    const statusEl = document.getElementById('gme-status');
    const statusText = document.getElementById('gme-status-text');
    
    if (statusEl) {
      statusEl.className = 'gme-status waiting';
    }
    if (statusText) {
      statusText.innerHTML = '⚠️ Click <strong>"Search this area"</strong> to start';
    }
    
    showToast('🔄 Click "Search this area" button to avoid missing leads! ↘↘↘', 5000, 'warning');
  }
  
  function onSearchDataReceived() {
    // Always process - the caller already verified we should trigger this
    isWaitingForSearchRefresh = false;
    hasReceivedSearchData = true;
    
    // Reset the prominent area-done style
    resetStatusStyle();
    
    // Remove toast
    const toast = document.getElementById('gme-toast');
    if (toast) toast.remove();
    
    showToast('✅ Search refreshed! Now extracting leads...', 2000);
    
    // Update status text immediately
    updateStatus('extracting', '🔄 Extracting... ' + extractedLeads.size + ' leads');
    
    // Start auto-scrolling
    const autoScrollEnabled = document.getElementById('gme-auto-scroll');
    if (autoScrollEnabled && autoScrollEnabled.checked) {
      isExtracting = true;
      setTimeout(autoScroll, 500);
    } else {
      isExtracting = true;
      updateStatus('extracting', '🔄 Extracting... scroll manually for more');
    }
  }
  
  // ============================================
  // INJECT THE INTERCEPTOR SCRIPT (NEW METHOD)
  // ============================================
  
  function injectInterceptor() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
  }
  
  // Inject immediately
  injectInterceptor();
  
  // ============================================
  // CREATE FLOATING PANEL
  // ============================================
  
  async function createFloatingPanel() {
    // Prevent duplicate creation
    if (document.getElementById('gme-floating-panel')) return;
    if (isCreatingPanel) return;
    
    isCreatingPanel = true;
    
    try {
      // Check license status first
      const hasLicense = await checkLicenseStatus();
      
      // DON'T SHOW PANEL AT ALL if no license
      if (!hasLicense) {
        isCreatingPanel = false;
        return;
      }
      
      // Double-check panel doesn't exist (race condition)
      if (document.getElementById('gme-floating-panel')) {
        isCreatingPanel = false;
        return;
      }
    
    const panel = document.createElement('div');
    panel.id = 'gme-floating-panel';
    
    // Dark mode is default - only switch to light if explicitly saved
    panel.classList.add('dark-mode');  // Default to dark mode
    chrome.storage.local.get(['gmeTheme'], (result) => {
      if (result.gmeTheme === 'light') {
        panel.classList.remove('dark-mode');
      }
    });
    
    panel.innerHTML = `
      <div class="gme-header">
        <div class="gme-header-content">
          <div class="gme-logo">📍</div>
          <h3>Lead Extractor</h3>
        </div>
        <div class="gme-header-actions">
          <button class="gme-theme-toggle" id="gme-theme-toggle" title="Toggle Dark/Light Mode" aria-label="Toggle theme">
            <span class="toggle-slider"></span>
          </button>
          <span class="gme-mini-stats" id="gme-mini-stats">0</span>
          <button class="gme-minimize" title="Minimize" aria-label="Minimize panel">−</button>
        </div>
      </div>
      
      <div class="gme-stats">
        <div class="gme-stat">
          <div class="gme-stat-icon">📊</div>
          <div class="gme-stat-value" id="gme-total">0</div>
          <div class="gme-stat-label">Total</div>
        </div>
        <div class="gme-stat">
          <div class="gme-stat-icon">🚫</div>
          <div class="gme-stat-value green" id="gme-no-website">0</div>
          <div class="gme-stat-label">No Site</div>
        </div>
        <div class="gme-stat">
          <div class="gme-stat-icon">📞</div>
          <div class="gme-stat-value" id="gme-with-phone">0</div>
          <div class="gme-stat-label">Phone</div>
        </div>
        <div class="gme-stat">
          <div class="gme-stat-icon">✉️</div>
          <div class="gme-stat-value green" id="gme-with-email">0</div>
          <div class="gme-stat-label">Email</div>
        </div>
      </div>
      
      <div class="gme-status-panel">
        <div class="gme-status" id="gme-status">
          <span class="gme-status-dot"></span>
          <div class="gme-status-content">
            <span id="gme-status-text">Ready — Click Start to extract leads</span>
            <div class="gme-progress-bar"><div class="gme-progress-fill"></div></div>
          </div>
        </div>
        <div class="gme-enrich-status" id="gme-enrich-status">
          <span class="gme-spinner"></span>
          <span id="gme-enrich-text">Fetching emails...</span>
        </div>
      </div>
      
      <div class="gme-buttons">
        <div class="gme-btn-row">
          <button class="gme-btn gme-btn-primary gme-btn-full" id="gme-start-btn">
            <span>▶</span> Start Extraction
          </button>
        </div>
        
        <div class="gme-btn-row-secondary">
          <button class="gme-btn gme-btn-success" id="gme-export-btn">
            <span>📥</span> Export
          </button>
          <button class="gme-btn gme-btn-secondary" id="gme-clear-btn">
            <span>🗑</span> Clear
          </button>
        </div>
        
        <div class="gme-options-section expanded" id="gme-options-section">
          <button class="gme-options-toggle" id="gme-options-toggle" aria-expanded="true">
            <span>⚙️ Options</span>
            <span class="gme-options-icon">▼</span>
          </button>
          <div class="gme-options-content">
            <label class="gme-checkbox">
              <input type="checkbox" id="gme-only-no-website">
              <span>Export only leads WITHOUT website</span>
            </label>
            <label class="gme-checkbox">
              <input type="checkbox" id="gme-auto-scroll" checked>
              <span>Auto-scroll for more results</span>
            </label>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    makeDraggable(panel);
    
    // Theme toggle with animation
    const themeToggle = panel.querySelector('#gme-theme-toggle');
    themeToggle.addEventListener('click', () => {
      panel.classList.toggle('dark-mode');
      const isDark = panel.classList.contains('dark-mode');
      chrome.storage.local.set({ gmeTheme: isDark ? 'dark' : 'light' });
    });
    
    // Minimize toggle
    panel.querySelector('.gme-minimize').addEventListener('click', () => {
      panel.classList.toggle('minimized');
      const miniStats = document.getElementById('gme-mini-stats');
      if (panel.classList.contains('minimized') && miniStats) {
        miniStats.textContent = extractedLeads.size;
      }
    });
    
    // Options accordion toggle
    const optionsToggle = panel.querySelector('#gme-options-toggle');
    const optionsSection = panel.querySelector('#gme-options-section');
    optionsToggle.addEventListener('click', () => {
      const isExpanded = optionsSection.classList.toggle('expanded');
      optionsToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    panel.querySelector('#gme-start-btn').addEventListener('click', toggleExtraction);
    panel.querySelector('#gme-export-btn').addEventListener('click', exportCSV);
    panel.querySelector('#gme-clear-btn').addEventListener('click', clearData);
    
    loadSheetsConfig().then(() => {
      if (sheetsSyncEnabled && sheetsConfig.sheetId) {
        testSheetsConnection().then(connected => {
          if (connected) startSheetsSync();
        });
      }
    });
    } finally {
      isCreatingPanel = false;
    }
  }
  
  function makeDraggable(element) {
    const header = element.querySelector('.gme-header');
    let isDragging = false;
    let offsetX, offsetY;
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('gme-minimize')) return;
      isDragging = true;
      offsetX = e.clientX - element.getBoundingClientRect().left;
      offsetY = e.clientY - element.getBoundingClientRect().top;
      element.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      element.style.left = (e.clientX - offsetX) + 'px';
      element.style.top = (e.clientY - offsetY) + 'px';
      element.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      element.style.transition = '';
    });
  }
  
  // ============================================
  // EXTRACTION TOGGLE
  // ============================================
  
  function toggleExtraction() {
    const btn = document.getElementById('gme-start-btn');
    
    if (isAlwaysCapture) {
      // Turn off - STOP EVERYTHING
      isAlwaysCapture = false;
      isExtracting = false;
      isWaitingForSearchRefresh = false;
      userClickedStart = false;  // Reset
      
      // Check if enrichment is still running
      if (enrichmentInProgress > 0 || enrichmentQueue.length > 0) {
        // Show "Please wait" state
        isStoppingWithEnrichment = true;
        btn.innerHTML = '<span>⏳</span> Please Wait...';
        btn.disabled = true;
        updateStatus('waiting', '⏳ Finishing email enrichment...');
        updateEnrichmentProgress();
      } else {
        // No enrichment running, stop immediately
        btn.innerHTML = '<span>▶</span> Start Extraction';
        btn.classList.remove('active');
        updateStatus('stopped', '⏸ Paused — ' + extractedLeads.size + ' leads | Click Start to resume');
        // Hide enrichment status
        const enrichStatus = document.getElementById('gme-enrich-status');
        if (enrichStatus) enrichStatus.classList.remove('active');
      }
    } else {
      // Turn on persistent extraction
      isAlwaysCapture = true;
      isExtracting = false;  // Will be set true when we receive search data
      userClickedStart = true;  // User clicked Start
      btn.innerHTML = '<span>⏹</span> Stop Extraction';
      btn.classList.add('active');
      
      // ALWAYS require "Search this area" click on first start after page load
      // This ensures we capture ALL initial leads from a fresh search
      if (!hasReceivedSearchData) {
        // Haven't received any search data yet - wait for user to click Search this area
        isWaitingForSearchRefresh = true;
        showSearchAreaReminder();
      } else {
        // We have already received search data (user previously clicked Search this area)
        // Start extracting immediately
        isExtracting = true;
        updateStatus('extracting', '🔄 Extracting... ' + extractedLeads.size + ' leads');
        const feed = document.querySelector('[role="feed"]');
        if (feed) {
          const autoScrollEnabled = document.getElementById('gme-auto-scroll');
          if (autoScrollEnabled && autoScrollEnabled.checked) {
            autoScroll();
          }
        }
      }
    }
  }
  
  // ============================================
  // LISTEN FOR DATA FROM INJECTED SCRIPT (NEW METHOD)
  // ============================================
  
  window.addEventListener('message', function(event) {
    // Handle new Proxy+Fetch capture method
    if (event.data && event.data.type === CONFIG.messageType) {
      // Data comes in event.data.payload.data from injected.js
      const payload = event.data.payload;
      if (payload && payload.data) {
        // CRITICAL FIX: If we're waiting for search data and we receive ANY search-related data, trigger extraction
        // This ensures "Search this area" click always works, even if data parsing fails
        const wasWaiting = isWaitingForSearchRefresh;
        
        processInterceptedData(payload.data);
        
        // Backup: If we were waiting and still waiting after processing, force trigger
        if (wasWaiting && isWaitingForSearchRefresh) {
          onSearchDataReceived();
        }
      }
      return;
    }
    
    // Handle legacy XHR intercept format (backward compat)
    if (event.data && event.data.type === 'search' && event.data.data) {
      const wasWaiting = isWaitingForSearchRefresh;
      
      try {
        var rawData = JSON.parse(event.data.data.replace('/*""*/', ''));
        var results = JSON.parse(rawData.d.slice(5));
        var feed = results[64];
        
        if (feed && feed.length) {
          // Extract businesses
          tryExtractBusinesses(feed, 'legacy');
        }
        
        // ALWAYS trigger if we were waiting - even if parsing found nothing
        if (wasWaiting) {
          onSearchDataReceived();
        } else if (hasReceivedSearchData && isAlwaysCapture) {
          updateStats();
        }
      } catch(err) {
        log('Legacy parse error:', err);
        // Even on error, if we were waiting, trigger extraction
        if (wasWaiting && isWaitingForSearchRefresh) {
          onSearchDataReceived();
        }
      }
    }
  });
  
  // Process intercepted data from new Proxy+Fetch method
  function processInterceptedData(body) {
    try {
      // Handle both string and already-parsed data
      let rawData = typeof body === 'string' ? body : JSON.stringify(body);
      
      // Google Maps response format from console: {"c":0,"d":")]}'\n[[\"engineer\",...]]"}
      let parsed;
      let innerData;
      
      try {
        parsed = JSON.parse(rawData.replace('/*""*/', ''));
        innerData = parsed.d;
      } catch(e) {
        // Try direct parse - maybe it's raw data
        innerData = rawData;
      }
      
      if (!innerData || typeof innerData !== 'string') {
        return;
      }
      
      // Remove the prefix ")]}'" and newline
      if (innerData.startsWith(")]}'")) {
        innerData = innerData.substring(innerData.indexOf('\n') + 1);
      }
      
      let results;
      try {
        results = JSON.parse(innerData);
      } catch(e) {
        return;
      }
      
      // The response is an array, the first element contains search query and metadata
      // Business data is typically in specific array indices
      // From logs: [[\"engineer\", ...], ...metadata..., null, null, ..., businessArray]
      
      // Try to find business data - it's typically a nested array structure
      let businessesFound = 0;
      
      // Method 1: Look for the main business array (usually at index that has arrays with business structure)
      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        if (!item) continue;
        
        // Check if this is the main array containing business results
        if (Array.isArray(item)) {
          // Business arrays typically have items that are arrays with specific structure
          const extracted = tryExtractBusinesses(item, `results[${i}]`);
          if (extracted > 0) {
            businessesFound += extracted;
          }
        }
      }
      
      if (businessesFound > 0 || isWaitingForSearchRefresh) {
        // CRITICAL: If waiting for search refresh, ALWAYS trigger even if no new businesses
        // This handles the case where user clicks "Search this area" but all businesses were already captured
        if (isWaitingForSearchRefresh) {
          onSearchDataReceived();
        } else if (hasReceivedSearchData && isAlwaysCapture) {
          // Already capturing, just update stats
          updateStats();
        }
      } else {
        // Recursive search as fallback
        const foundInRecursive = searchForBusinesses(results);
        
        // Even if recursive search found nothing, if we're waiting, trigger extraction
        if (isWaitingForSearchRefresh) {
          onSearchDataReceived();
        }
      }
      
    } catch (err) {
      // Error processing intercepted data
    }
  }
  
  // Try to extract businesses from an array
  function tryExtractBusinesses(arr, path) {
    if (!Array.isArray(arr)) return 0;
    let count = 0;
    
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (!Array.isArray(item)) continue;
      
      // Check if this looks like a business entry (has nested array with name at index 11)
      // Business structure: [..., [nested data with name at index 11, ...], ...]
      for (let j = 0; j < item.length; j++) {
        const subItem = item[j];
        if (Array.isArray(subItem) && subItem.length > 11 && typeof subItem[11] === 'string' && subItem[11].length > 0) {
          // This looks like business data!
          const extracted = extractBusinessFromArray(subItem);
          if (extracted) {
            count++;
          }
        }
      }
      
      // Also check the item itself
      if (item.length > 11 && typeof item[11] === 'string' && item[11].length > 0) {
        const extracted = extractBusinessFromArray(item);
        if (extracted) {
          count++;
        }
      }
      
      // Check the last element of item (common pattern)
      const lastEl = item[item.length - 1];
      if (Array.isArray(lastEl) && lastEl.length > 11 && typeof lastEl[11] === 'string') {
        const extracted = extractBusinessFromArray(lastEl);
        if (extracted) {
          count++;
        }
      }
    }
    
    return count;
  }
  
  // Extract business data from an array with known structure
  function extractBusinessFromArray(e) {
    try {
      // GUARD: Only extract if user has clicked Start
      // This prevents auto-capturing on page load/refresh
      if (!userClickedStart && !isAlwaysCapture) {
        return false;
      }
      
      // Name (index 11)
      const name = e[11];
      if (!name || typeof name !== 'string') return false;
      
      // Website (index 7[0])
      let website = '';
      try { website = e[7]?.[0] || ''; } catch(err) {}
      
      // Phone (index 178[0][0])
      let phone = '';
      try { phone = e[178]?.[0]?.[0] || ''; } catch(err) {}
      
      // Review count (index 4[8])
      let reviewCount = '';
      try { reviewCount = e[4]?.[8] || ''; } catch(err) {}
      
      // Rating (index 4[7])
      let averageRating = '';
      try { averageRating = e[4]?.[7] || ''; } catch(err) {}
      
      // Category (index 13)
      let category = '';
      try {
        const cats = e[13];
        if (Array.isArray(cats)) {
          category = cats.join(', ');
        } else if (typeof cats === 'string') {
          category = cats;
        }
      } catch(err) {}
      
      // Address (index 18)
      let address = '';
      try { address = e[18] || ''; } catch(err) {}
      
      // Coordinates (index 9)
      let lat = '', lng = '';
      try {
        lat = e[9]?.[2] || '';
        lng = e[9]?.[3] || '';
      } catch(err) {}
      
      // Place ID (index 78)
      let placeId = '';
      try { placeId = e[78] || ''; } catch(err) {}
      
      // CID (index 25)
      let cid = '';
      try { cid = e[25]?.[3]?.[0] || e[25]?.[1] || ''; } catch(err) {}
      
      // Google Maps Link
      const gmapsLink = placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : 
                        (cid ? `https://www.google.com/maps?cid=${cid}` : '');
      
      // Create unique key
      const key = name + '_' + (phone || website || lat + lng || address);
      
      // Duplicate check
      if (extractedLeads.has(key)) return false;
      if (phone && leads_phones.has(phone)) return false;
      if (lat && lng) {
        const lnglatKey = `${lng},${lat}`;
        if (leads_lnglat.has(lnglatKey)) return false;
        leads_lnglat.add(lnglatKey);
      }
      if (phone) leads_phones.add(phone);
      
      // Check if has valid website and separate social media links
      let hasWebsite = false;
      let facebook = '';
      let instagram = '';
      let twitter = '';
      let linkedin = '';
      let youtube = '';
      let tiktok = '';
      let actualWebsite = '';
      
      if (website) {
        const lowerUrl = website.toLowerCase();
        
        // Facebook detection
        if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com') || lowerUrl.includes('fb.me')) {
          facebook = website;
        }
        // Instagram detection
        else if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
          instagram = website;
        }
        // Twitter/X detection
        else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
          twitter = website;
        }
        // LinkedIn detection
        else if (lowerUrl.includes('linkedin.com')) {
          linkedin = website;
        }
        // YouTube detection
        else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
          youtube = website;
        }
        // TikTok detection
        else if (lowerUrl.includes('tiktok.com')) {
          tiktok = website;
        }
        // Skip Google/Maps links - not real websites
        else if (lowerUrl.includes('google.com') || lowerUrl.includes('goo.gl') || lowerUrl.includes('maps.app.goo.gl')) {
          actualWebsite = '';
        }
        // Skip other common non-website links
        else if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com') || 
                 lowerUrl.includes('t.me') || lowerUrl.includes('telegram.') ||
                 lowerUrl.includes('pinterest.com') || lowerUrl.includes('yelp.com') ||
                 lowerUrl.includes('tripadvisor.com') || lowerUrl.includes('booking.com')) {
          // These are profile/listing links, not actual business websites
          actualWebsite = '';
        }
        // Real website!
        else {
          actualWebsite = website;
          hasWebsite = true;
        }
      }
      
      // Store lead
      const lead = {
        name,
        website: actualWebsite,
        phone,
        reviewCount: String(reviewCount || ''),
        averageRating: String(averageRating || ''),
        category,
        address,
        lat: String(lat || ''),
        lng: String(lng || ''),
        placeId,
        cid: String(cid || ''),
        gmapsLink,
        has_website: hasWebsite,
        email: '',
        facebook: facebook,
        instagram: instagram,
        twitter: twitter,
        linkedin: linkedin,
        youtube: youtube,
        tiktok: tiktok
      };
      
      extractedLeads.set(key, lead);
      
      // Add to enrichment queue if has website
      if (hasWebsite && actualWebsite) {
        enrichmentQueue.push({ lead, key });
        enrichmentTotal++;
        processEnrichmentQueue();
      }
      
      // Queue for sheets sync
      if (sheetsSyncEnabled) {
        queueLeadForSheets(lead);
      }
      
      // Update stats
      updateStats();
      
      return true;
    } catch (err) {
      return false;
    }
  }
  
  // Recursive search for business data
  function searchForBusinesses(obj, depth = 0) {
    if (depth > 15 || !obj) return;
    
    if (Array.isArray(obj)) {
      // Check if this looks like a business item (has name at index 11)
      if (obj.length > 11 && typeof obj[11] === 'string' && obj[11].length > 0) {
        extractBusinessFromArray(obj);
        return;
      }
      
      // Recursively search arrays
      for (const item of obj) {
        searchForBusinesses(item, depth + 1);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        searchForBusinesses(obj[key], depth + 1);
      }
    }
  }
  
  // ============================================
  // EMAIL ENRICHMENT (with 4s timeout)
  // ============================================
  
  async function processEnrichmentQueue() {
    while (enrichmentQueue.length > 0 && enrichmentInProgress < MAX_CONCURRENT_ENRICHMENTS) {
      const item = enrichmentQueue.shift();
      enrichmentInProgress++;
      
      enrichLeadWithEmail(item.lead, item.key)
        .finally(() => {
          enrichmentInProgress--;
          enrichmentCompleted++;
          updateEnrichmentProgress();
          processEnrichmentQueue();
        });
    }
  }
  
  async function enrichLeadWithEmail(lead, key) {
    try {
      const websiteUrl = lead.website.startsWith('http') ? lead.website : 'https://' + lead.website;
      
      // Create abort controller for 4 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), EMAIL_FETCH_TIMEOUT);
      
      try {
        const response = await fetch(ENRICH_API_URL + '?url=' + encodeURIComponent(websiteUrl), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.emails && data.emails.length > 0) {
            lead.email = data.emails.join(', ');
          } else {
            lead.email = '';
          }
          
          // Add social media
          if (!lead.facebook && data.social?.facebook) {
            lead.facebook = 'facebook.com/' + data.social.facebook;
          }
          if (!lead.instagram && data.social?.instagram) {
            lead.instagram = 'instagram.com/' + data.social.instagram;
          }
          if (data.social?.linkedin) {
            lead.linkedin = 'linkedin.com/in/' + data.social.linkedin;
          }
          if (data.social?.twitter) {
            lead.twitter = 'x.com/' + data.social.twitter;
          }
          if (data.social?.youtube) {
            lead.youtube = 'youtube.com/' + data.social.youtube;
          }
          if (data.social?.tiktok) {
            lead.tiktok = 'tiktok.com/@' + data.social.tiktok;
          }
          
          extractedLeads.set(key, lead);
          queueLeadForSync(lead);
          updateStats();
        } else {
          lead.email = '';
          extractedLeads.set(key, lead);
          queueLeadForSync(lead);
          updateStats();
        }
      } catch (err) {
        clearTimeout(timeoutId);
        lead.email = '';
        extractedLeads.set(key, lead);
        queueLeadForSync(lead);
        updateStats();
      }
      
    } catch (err) {
      lead.email = '';
      extractedLeads.set(key, lead);
      queueLeadForSync(lead);
      updateStats();
    }
  }
  
  function updateEnrichmentProgress() {
    const enrichStatus = document.getElementById('gme-enrich-status');
    const enrichText = document.getElementById('gme-enrich-text');
    const exportBtn = document.getElementById('gme-export-btn');
    
    if (exportBtn) {
      if (enrichmentInProgress > 0 || enrichmentQueue.length > 0) {
        exportBtn.disabled = true;
        exportBtn.classList.add('loading');
      } else {
        exportBtn.disabled = false;
        exportBtn.classList.remove('loading');
      }
    }
    
    if (enrichStatus) {
      if (enrichmentInProgress > 0 || enrichmentQueue.length > 0) {
        if (isStoppingWithEnrichment) {
          const remaining = enrichmentQueue.length + enrichmentInProgress;
          if (enrichText) enrichText.textContent = 'Please wait... finishing ' + remaining + ' enrichment(s)';
        } else if (isExtracting || isAlwaysCapture) {
          if (enrichText) enrichText.textContent = '📜 Scrolls: ' + totalScrollCount;
        }
        enrichStatus.classList.add('active');
      } else if (isStoppingWithEnrichment) {
        // Enrichment finished while stopping - call finishStopping
        isStoppingWithEnrichment = false;
        if (enrichText) enrichText.textContent = '✅ Done - Scrolls: ' + totalScrollCount;
        finishStopping();
        enrichStatus.classList.remove('active');
      } else if ((enrichmentCompleted > 0 || totalScrollCount > 0) && (isExtracting || isAlwaysCapture)) {
        if (enrichText) enrichText.textContent = '📜 Scrolls: ' + totalScrollCount;
        enrichStatus.classList.add('active');
      } else {
        enrichStatus.classList.remove('active');
      }
    }
  }
  
  function finishStopping() {
    const btn = document.getElementById('gme-start-btn');
    const exportBtn = document.getElementById('gme-export-btn');
    const enrichStatus = document.getElementById('gme-enrich-status');
    
    if (btn) {
      btn.innerHTML = '<span>▶</span> Start Extraction';
      btn.classList.remove('active');
      btn.disabled = false;
    }
    
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.classList.remove('loading');
    }
    
    // Hide enrichment status
    if (enrichStatus) {
      enrichStatus.classList.remove('active');
    }
    
    updateStatus('stopped', '⏸ Paused — ' + extractedLeads.size + ' leads | Click Start to resume');
  }
  
  // ============================================
  // AUTO-SCROLL
  // ============================================
  
  function startExtraction() {
    if (isExtracting) return;
    scrollCount = 0;
    
    const feed = document.querySelector('[role="feed"]');
    if (feed && !hasReceivedSearchData) {
      isExtracting = true;
      isWaitingForSearchRefresh = true;
      showSearchAreaReminder();
      return;
    }
    
    isExtracting = true;
    continueExtraction();
  }
  
  function continueExtraction() {
    const autoScrollEnabled = document.getElementById('gme-auto-scroll');
    const shouldAutoScroll = autoScrollEnabled && autoScrollEnabled.checked;
    
    if (shouldAutoScroll) {
      updateStatus('extracting', '🔄 Extracting with auto-scroll...');
      updateStats();
      setTimeout(autoScroll, 500);
    } else {
      updateStatus('extracting', '🔄 Extracting... scroll manually for more');
      updateStats();
    }
  }
  
  async function autoScroll() {
    if (!isExtracting && !isAlwaysCapture) return;
    if (!isExtracting) return;
    
    const autoScrollEnabled = document.getElementById('gme-auto-scroll');
    if (!autoScrollEnabled || !autoScrollEnabled.checked) {
      updateStatus('extracting', '🔄 Auto-scroll disabled, scroll manually');
      return;
    }
    
    const feed = document.querySelector('[role="feed"]');
    if (!feed) {
      if (isAlwaysCapture) {
        // In always-on mode, keep waiting for a feed
        setTimeout(autoScroll, 2000);
      }
      return;
    }
    
    const prevHeight = feed.scrollHeight;
    
    // Aggressive deep scroll - scroll to absolute bottom multiple times
    feed.scrollTo({ top: feed.scrollHeight + 10000, behavior: 'instant' });
    await sleep(100);
    feed.scrollTo({ top: feed.scrollHeight + 10000, behavior: 'instant' });
    await sleep(100);
    feed.scrollTo({ top: feed.scrollHeight + 10000, behavior: 'instant' });
    
    scrollCount++;
    totalScrollCount++;
    
    await sleep(800);
    
    // Check for "You've reached the end" message
    if (document.getElementsByClassName('HlvSq').length > 0) {
      isExtracting = false;
      scrollCount = 0;
      if (isAlwaysCapture) {
        // Stay in always-on mode but wait for next area
        showAreaDoneAlert(extractedLeads.size);
        isWaitingForSearchRefresh = true;
      } else {
        stopExtraction();
      }
      return;
    }
    
    // Check if stuck (height didn't change after 30 scrolls)
    if (feed.scrollHeight === prevHeight) {
      const items = feed.querySelectorAll('[role="article"]');
      if (items.length > 0) {
        // Scroll to last item aggressively
        const lastItem = items[items.length - 1];
        lastItem.scrollIntoView({ behavior: 'instant', block: 'end' });
        await sleep(200);
        feed.scrollTo({ top: feed.scrollHeight + 10000, behavior: 'instant' });
        await sleep(300);
      }
      
      if (scrollCount > 30) {
        isExtracting = false;
        scrollCount = 0;
        if (isAlwaysCapture) {
          showAreaDoneAlert(extractedLeads.size);
          isWaitingForSearchRefresh = true;
        } else {
          stopExtraction();
        }
        return;
      }
    }
    
    // Update display with current lead count
    updateStatus('extracting', '🔄 Extracting... ' + extractedLeads.size + ' leads');
    updateStats();
    updateEnrichmentProgress();
    
    const stillEnabled = document.getElementById('gme-auto-scroll');
    if (isExtracting && stillEnabled && stillEnabled.checked) {
      setTimeout(autoScroll, 600);  // Faster interval
    }
  }
  
  function stopExtraction() {
    isExtracting = false;
    isWaitingForSearchRefresh = false;
    isAlwaysCapture = false;
    
    const toast = document.getElementById('gme-toast');
    if (toast) toast.remove();
    
    const btn = document.getElementById('gme-start-btn');
    if (btn) {
      btn.textContent = '▶ Start';
      btn.classList.remove('active');
    }
    
    updateStatus('ready', '✅ Done! ' + extractedLeads.size + ' leads extracted');
    updateStats();
  }
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ============================================
  // UI UPDATES
  // ============================================
  
  function updateStats() {
    const leads = Array.from(extractedLeads.values());
    
    const total = leads.length;
    const withPhone = leads.filter(l => l.phone).length;
    const withEmail = leads.filter(l => l.email && l.email !== 'Fetching...').length;
    const noWebsite = leads.filter(l => !l.has_website).length;
    
    const totalEl = document.getElementById('gme-total');
    const noWebsiteEl = document.getElementById('gme-no-website');
    const withPhoneEl = document.getElementById('gme-with-phone');
    const withEmailEl = document.getElementById('gme-with-email');
    const miniStats = document.getElementById('gme-mini-stats');
    
    if (totalEl) totalEl.textContent = total;
    if (noWebsiteEl) noWebsiteEl.textContent = noWebsite;
    if (withPhoneEl) withPhoneEl.textContent = withPhone;
    if (withEmailEl) withEmailEl.textContent = withEmail;
    if (miniStats) miniStats.textContent = total;
    
    // Also update status text with current lead count if extracting
    // Don't update if we're stopping with enrichment (waiting state)
    if ((isExtracting || isAlwaysCapture) && !isStoppingWithEnrichment) {
      const statusText = document.getElementById('gme-status-text');
      if (statusText && !isWaitingForSearchRefresh) {
        statusText.textContent = '🔄 Extracting... ' + total + ' leads';
      }
    }
  }
  
  function updateStatus(state, text) {
    const statusEl = document.getElementById('gme-status');
    const textEl = document.getElementById('gme-status-text');
    
    if (statusEl) {
      statusEl.className = 'gme-status ' + state;
    }
    if (textEl) {
      textEl.textContent = text;
      textEl.style.color = '';
      textEl.style.fontWeight = '';
      textEl.style.fontSize = '';
      textEl.style.animation = '';
    }
  }
  
  function showAreaDoneAlert(leadCount) {
    const statusEl = document.getElementById('gme-status');
    const textEl = document.getElementById('gme-status-text');
    
    if (statusEl) {
      statusEl.className = 'gme-status area-done';
    }
    if (textEl) {
      textEl.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 13px; font-weight: 700; color: white; margin-bottom: 4px;">
            🎉 AREA COMPLETE!
          </div>
          <div style="font-size: 22px; font-weight: 800; color: #fef08a; margin-bottom: 6px;">
            ${leadCount} leads
          </div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.95); background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 6px;">
            👆 Move map & click <strong>"Search this area"</strong>
          </div>
        </div>
      `;
    }
    
    // Also show a toast
    showToast('🎉 Area complete! Move map to continue extracting', 4000, 'success');
  }
  
  function resetStatusStyle() {
    const statusEl = document.getElementById('gme-status');
    if (statusEl) {
      statusEl.style.background = '';
      statusEl.style.padding = '';
      statusEl.style.borderRadius = '';
      statusEl.style.boxShadow = '';
      statusEl.style.animation = '';
    }
  }

  // ============================================
  // EXPORT & CLEAR
  // ============================================
  
  function exportCSV() {
    if (enrichmentInProgress > 0 || enrichmentQueue.length > 0) {
      showToast('Please wait for email fetching to complete', 3000, 'warning');
      return;
    }
    
    let leads = Array.from(extractedLeads.values());
    
    const onlyNoWebsite = document.getElementById('gme-only-no-website');
    if (onlyNoWebsite && onlyNoWebsite.checked) {
      leads = leads.filter(l => !l.has_website);
    }
    
    if (leads.length === 0) {
      showToast('No leads to export' + (onlyNoWebsite && onlyNoWebsite.checked ? ' (filtered)' : ''), 3000, 'warning');
      return;
    }
    
    const headers = ['Name', 'Phone', 'Email', 'Website', 'Address', 'Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'YouTube', 'TikTok', 'ReviewCount', 'AverageRating', 'Category', 'GoogleMapsLink'];
    
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => {
        let email = lead.email || '';
        if (email === 'Fetching...') email = '';
        
        return [
          `"${(lead.name || '').replace(/"/g, '""')}"`,
          `"${(lead.phone || '').replace(/"/g, '""')}"`,
          `"${email.replace(/"/g, '""')}"`,
          `"${(lead.website || '').replace(/"/g, '""')}"`,
          `"${(lead.address || '').replace(/"/g, '""')}"`,
          `"${(lead.instagram || '').replace(/"/g, '""')}"`,
          `"${(lead.facebook || '').replace(/"/g, '""')}"`,
          `"${(lead.twitter || '').replace(/"/g, '""')}"`,
          `"${(lead.linkedin || '').replace(/"/g, '""')}"`,
          `"${(lead.youtube || '').replace(/"/g, '""')}"`,
          `"${(lead.tiktok || '').replace(/"/g, '""')}"`,
          `"${lead.review_count || ''}"`,
          `"${lead.rating || ''}"`,
          `"${(lead.category || '').replace(/"/g, '""')}"`,
          `"${(lead.googleMapsLink || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `google_maps_leads_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('✅ Exported ' + leads.length + ' leads to CSV', 3000, 'success');
  }
  
  function clearData() {
    if (extractedLeads.size > 0 && !confirm('Clear all ' + extractedLeads.size + ' leads?')) {
      return;
    }
    
    const clearedCount = extractedLeads.size;
    extractedLeads.clear();
    leads_lnglat.clear();
    scrollCount = 0;
    updateStats();
    updateStatus('ready', 'Ready — Click Start to extract leads');
    
    if (clearedCount > 0) {
      showToast('🗑️ Cleared ' + clearedCount + ' leads', 2000);
    }
  }
  
  // ============================================
  // COMMUNICATION WITH POPUP
  // ============================================
  
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_STATS') {
      const leads = Array.from(extractedLeads.values());
      sendResponse({
        total: leads.length,
        withPhone: leads.filter(l => l.phone).length,
        noWebsite: leads.filter(l => !l.has_website).length,
        withEmail: leads.filter(l => l.email && l.email !== 'Fetching...').length,
        scrolls: scrollCount,
        isExtracting: isExtracting,
        isStoppingWithEnrichment: isStoppingWithEnrichment,
        enrichmentRemaining: enrichmentQueue.length + enrichmentInProgress
      });
    } else if (msg.type === 'LICENSE_ACTIVATED') {
      // License was just activated from popup
      // Note: storage.onChanged will also fire, so just update the flag
      // The storage listener will handle panel creation
      isLicenseValid = true;
      sendResponse({ success: true });
    } else if (msg.type === 'EXPORT') {
      exportCSV();
      sendResponse({ success: true });
    } else if (msg.type === 'CLEAR_LEADS' || msg.type === 'CLEAR') {
      extractedLeads.clear();
      leads_lnglat.clear();
      scrollCount = 0;
      updateStats();
      sendResponse({ success: true });
    } else if (msg.type === 'GET_LEADS') {
      sendResponse({ leads: Array.from(extractedLeads.values()) });
    }
    return true;
  });
  
  // ============================================
  // SETUP SEARCH LISTENERS
  // ============================================
  
  function setupSearchListeners() {
    // Called after license activation
  }
  
  // ============================================
  // INITIALIZE
  // ============================================
  
  async function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    const licenseStatus = await checkLicenseStatus();
    
    // Only create panel if licensed
    createFloatingPanel();
    
    if (isLicenseValid) {
      setupSearchListeners();
    }
    
    const observer = new MutationObserver(async () => {
      if (!document.getElementById('gme-floating-panel')) {
        createFloatingPanel();
        if (isLicenseValid) {
          setupSearchListeners();
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  init();
  
})();
