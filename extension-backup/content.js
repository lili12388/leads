// Content script - Google Maps Lead Extractor
// Floating panel with Auto-Capture mode
(function() {
  "use strict";
  
  let extractedLeads = new Map();
  let leads_lnglat = new Set();  // For placeID deduplication
  let leads_phones = new Set();   // For phone deduplication
  let isAlwaysCapture = false;    // Always-on capture mode
  let isExtracting = false;
  let scrollCount = 0;
  let autoScrollInterval = null;
  let isLicenseValid = false;     // License status
  let isWaitingForSearchRefresh = false; // Track if we're waiting for user to click "Search this area"
  let hasReceivedSearchData = false; // Track if we've received fresh search data since clicking Start/Always On
  
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
  
  // Listen for license status changes from popup
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.licenseActivated) {
      isLicenseValid = changes.licenseActivated.newValue === true;
      // Remove and recreate panel with new state
      const panel = document.getElementById('gme-floating-panel');
      if (panel) panel.remove();
      createFloatingPanel();
      if (isLicenseValid) {
        setupSearchListeners();
      }
    }
  });
  
  // ============================================
  // SHOW "SEARCH THIS AREA" REMINDER
  // ============================================
  
  function showSearchAreaReminder() {
    // Show a prominent reminder in the panel
    const statusText = document.getElementById('gme-status-text');
    const statusDot = document.querySelector('.gme-status-dot');
    
    if (statusText) {
      statusText.innerHTML = '⚠️ Please click <strong>"Search this area"</strong> button to start';
      statusText.style.color = '#d97706';
    }
    if (statusDot) {
      statusDot.style.background = '#f59e0b';
    }
    
    // Also show a toast notification
    showToast('🔄 Click "Search this area" button to avoid missing leads!', 5000);
  }
  
  function showToast(message, duration = 3000) {
    // Remove existing toast if any
    const existingToast = document.getElementById('gme-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'gme-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: white;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 100000;
      box-shadow: 0 8px 32px rgba(30, 64, 175, 0.4);
      animation: gme-toast-in 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    toast.textContent = message;
    
    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gme-toast-in {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes gme-toast-out {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // Remove after duration
    setTimeout(() => {
      toast.style.animation = 'gme-toast-out 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  function onSearchDataReceived() {
    // Called when we receive fresh search data from XHR interceptor
    if (isWaitingForSearchRefresh) {
      isWaitingForSearchRefresh = false;
      hasReceivedSearchData = true;
      
      // Remove the reminder toast
      const toast = document.getElementById('gme-toast');
      if (toast) toast.remove();
      
      // Show success message
      showToast('✅ Search refreshed! Now extracting leads...', 2000);
      
      // Start the actual extraction/scrolling
      if (isAlwaysCapture) {
        updateStatus('extracting', '🔄 Always-on: Capturing leads...');
        const feed = document.querySelector('[role="feed"]');
        const autoScrollEnabled = document.getElementById('gme-auto-scroll');
        if (feed && autoScrollEnabled && autoScrollEnabled.checked) {
          isExtracting = true;
          setTimeout(autoScroll, 500);
        }
      } else if (isExtracting) {
        continueExtraction();
      }
    }
  }
  
  // ============================================
  // INJECT THE XHR INTERCEPTOR SCRIPT
  // ============================================
  
  function injectScript() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("injected.js");
    script.onload = function() { this.remove(); };
    (document.head || document.documentElement).appendChild(script);
  }
  
  // Inject immediately
  injectScript();
  
  // ============================================
  // CREATE FLOATING PANEL
  // ============================================
  
  async function createFloatingPanel() {
    if (document.getElementById('gme-floating-panel')) return;
    
    // Check license status first
    const hasLicense = await checkLicenseStatus();
    
    // Don't show panel at all if no license
    if (!hasLicense) {
      return;
    }
    
    const panel = document.createElement('div');
    panel.id = 'gme-floating-panel';
    
    // Only show normal extraction UI (license is valid)
    panel.innerHTML = `
      <div class="gme-header">
        <h3>📍 Lead Extractor</h3>
        <button class="gme-minimize" title="Minimize">−</button>
      </div>
      <div class="gme-stats">
        <div class="gme-stat">
          <div class="gme-stat-value" id="gme-total">0</div>
          <div class="gme-stat-label">Total Leads</div>
        </div>
        <div class="gme-stat">
          <div class="gme-stat-value green" id="gme-no-website">0</div>
          <div class="gme-stat-label">No Website</div>
        </div>
          <div class="gme-stat">
            <div class="gme-stat-value" id="gme-with-phone">0</div>
            <div class="gme-stat-label">With Phone</div>
          </div>
          <div class="gme-stat">
            <div class="gme-stat-value orange" id="gme-scrolls">0</div>
            <div class="gme-stat-label">Scrolls</div>
          </div>
        </div>
        </div>
        <div class="gme-status" id="gme-status">
          <span class="gme-status-dot"></span>
          <span id="gme-status-text">Ready - Click Start to extract</span>
        </div>
        <div class="gme-buttons">
          <div class="gme-btn-row">
            <button class="gme-btn gme-btn-primary" id="gme-start-btn">▶ Start</button>
            <button class="gme-btn gme-btn-auto" id="gme-always-btn">🔄 Always On</button>
          </div>
          <button class="gme-btn gme-btn-success" id="gme-export-btn">📥 Export CSV</button>
          <button class="gme-btn gme-btn-sheets" id="gme-sheets-btn">📊 Export to Google Sheets</button>
          <button class="gme-btn gme-btn-secondary" id="gme-clear-btn">🗑 Clear</button>
          <div class="gme-options">
            <label class="gme-checkbox">
              <input type="checkbox" id="gme-auto-scroll" checked>
              <span>Auto-scroll for more results</span>
            </label>
            <label class="gme-checkbox">
              <input type="checkbox" id="gme-only-no-website">
              <span>Export only leads WITHOUT website</span>
            </label>
          </div>
        </div>
      `;
    
    document.body.appendChild(panel);
    
    // Make panel draggable
    makeDraggable(panel);
    
    // Event listeners
    panel.querySelector('.gme-minimize').addEventListener('click', () => {
      panel.classList.toggle('minimized');
    });
    
    // Normal extraction listeners
    panel.querySelector('#gme-start-btn').addEventListener('click', toggleManualExtraction);
    panel.querySelector('#gme-always-btn').addEventListener('click', toggleAlwaysCapture);
    panel.querySelector('#gme-export-btn').addEventListener('click', exportCSV);
    panel.querySelector('#gme-sheets-btn').addEventListener('click', exportToGoogleSheets);
    panel.querySelector('#gme-clear-btn').addEventListener('click', clearData);
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
  // ALWAYS-ON CAPTURE MODE
  // ============================================
  
  function toggleAlwaysCapture() {
    const btn = document.getElementById('gme-always-btn');
    const startBtn = document.getElementById('gme-start-btn');
    
    if (isAlwaysCapture) {
      // Turn off always capture - STOP EVERYTHING
      isAlwaysCapture = false;
      isExtracting = false;  // Stop any ongoing scrolling
      isWaitingForSearchRefresh = false;
      btn.textContent = '🔄 Always On';
      btn.classList.remove('active');
      startBtn.disabled = false;
      updateStatus('ready', '✅ Stopped. ' + extractedLeads.size + ' leads captured');
      console.log("🔄 Always-on capture disabled - stopped all scrolling");
    } else {
      // Turn on always capture
      isAlwaysCapture = true;
      isExtracting = false;  // Will be set true when we receive search data
      btn.textContent = '⏹ Stop';
      btn.classList.add('active');
      startBtn.disabled = true;
      
      // Check if there's already a feed visible (user already searched)
      const feed = document.querySelector('[role="feed"]');
      if (feed && !hasReceivedSearchData) {
        // Feed exists but we haven't captured it yet - ask user to refresh search
        isWaitingForSearchRefresh = true;
        showSearchAreaReminder();
        console.log("🔍 Waiting for user to click 'Search this area' button...");
      } else {
        // No feed yet, just wait for search
        updateStatus('extracting', '🔄 Always-on: Waiting for search...');
        console.log("🔄 Always-on capture enabled - waiting for search data");
      }
    }
  }

  function toggleManualExtraction() {
    const btn = document.getElementById('gme-start-btn');
    
    if (isExtracting) {
      stopExtraction();
      btn.textContent = '▶ Start';
    } else {
      startExtraction();
      btn.textContent = '⏹ Stop';
    }
  }

  // ============================================
  // LISTEN FOR SEARCH DATA FROM INJECTED SCRIPT
  // ============================================
  
  window.addEventListener("message", function(event) {
    if (event.data && event.data.type === "search" && event.data.data) {
      // If we're waiting for user to click "Search this area", handle that first
      if (isWaitingForSearchRefresh) {
        onSearchDataReceived();
        // Let processing continue below
      }
      
      // Always capture if Always-On mode is enabled, or if manually extracting
      if (!isAlwaysCapture && !isExtracting) {
        return;  // Not capturing
      }
      
      try {
        // Parse the response exactly like the paid extension does
        var rawData = JSON.parse(event.data.data.replace('/*""*/', ""));
        var results = JSON.parse(rawData.d.slice(5));
        var feed = results[64];
        
        if (!feed || !feed.length) {
          console.log("📭 No feed data in response");
          return;
        }
        
        // Mark that we've received fresh search data
        hasReceivedSearchData = true;
        
        var newCount = 0;
        
        for (var i = 0; i < feed.length; i++) {
          try {
            var item = feed[i];
            var e = item[item.length - 1];
            
            // Name (index 11)
            var name = e[11] || "";
            if (!name) continue;
            
            // Website (index 7[0])
            var website = "";
            try { website = e[7][0] || ""; } catch(err) {}
            
            // Phone (index 178[0][0])
            var phone = "";
            try { phone = e[178][0][0] || ""; } catch(err) {}
            
            // Review count (index 4[8])
            var reviewCount = "";
            try { reviewCount = e[4][8] || ""; } catch(err) {}
            
            // Rating (index 4[7])
            var averageRating = "";
            try { averageRating = e[4][7] || ""; } catch(err) {}
            
            // Category (index 13)
            var category = "";
            try { category = (e[13] || []).join("; "); } catch(err) {}
            
            // Place ID (index 78)
            var placeID = "";
            try { placeID = e[78] || ""; } catch(err) {}
            
            // Address (index 2)
            var address = "";
            try { address = (e[2] || []).join(", "); } catch(err) {}
            
            // Coordinates (index 9)
            var latitude = "";
            var longitude = "";
            try { 
              latitude = e[9][2]; 
              longitude = e[9][3]; 
            } catch(err) {}
            
            // Skip duplicates by placeID
            if (placeID && leads_lnglat.has(placeID)) continue;
            if (placeID) leads_lnglat.add(placeID);
            
            // Process website - check if it's real
            var hasWebsite = false;
            var facebook = "";
            var instagram = "";
            
            if (website) {
              var lowerUrl = website.toLowerCase();
              if (lowerUrl.includes("facebook.com")) {
                facebook = website;
                website = "";
              } else if (lowerUrl.includes("instagram.com")) {
                instagram = website;
                website = "";
              } else if (lowerUrl.includes("google.com") || lowerUrl.includes("goo.gl")) {
                website = "";
              } else {
                hasWebsite = true;
              }
            }
            
            var lead = {
              name: name,
              phone: phone,
              website: website || "NO WEBSITE FOUND",
              address: address,
              category: category,
              review_count: reviewCount,
              rating: averageRating,
              facebook: facebook,
              instagram: instagram,
              has_website: hasWebsite,
              latitude: latitude,
              longitude: longitude
            };
            
            var key = placeID || name.toLowerCase();
            if (!extractedLeads.has(key)) {
              extractedLeads.set(key, lead);
              newCount++;
              
              var phoneIcon = phone ? " 📞" : "";
              var webIcon = hasWebsite ? " 🌐" : "";
              console.log("✅ " + name + phoneIcon + webIcon);
            }
            
          } catch(itemErr) {
            console.warn("Error processing item:", itemErr);
          }
        }
        
        if (newCount > 0) {
          console.log("📊 Added " + newCount + " leads. Total: " + extractedLeads.size);
          updateStats();
          
          if (isAlwaysCapture) {
            updateStatus('extracting', '🔄 Always-on: ' + extractedLeads.size + ' leads (no duplicates)');
            
            // Start auto-scrolling if enabled and not already scrolling
            const autoScrollEnabled = document.getElementById('gme-auto-scroll');
            if (autoScrollEnabled && autoScrollEnabled.checked && !isExtracting) {
              isExtracting = true;
              setTimeout(autoScroll, 1500);
            }
          }
        }
        
      } catch(err) {
        console.warn("Parse error:", err);
      }
    }
  });
  
  // ============================================
  // MANUAL EXTRACTION WITH AUTO-SCROLL
  // ============================================
  
  function startExtraction() {
    if (isExtracting) return;
    scrollCount = 0;
    
    // Check if there's already a feed visible (user already searched)
    const feed = document.querySelector('[role="feed"]');
    if (feed && !hasReceivedSearchData) {
      // Feed exists but we haven't captured it yet - ask user to refresh search
      isExtracting = true; // Mark as extracting so button shows "Stop"
      isWaitingForSearchRefresh = true;
      showSearchAreaReminder();
      console.log("🔍 Waiting for user to click 'Search this area' button...");
      return;
    }
    
    // No existing feed or we already have fresh data - start normally
    isExtracting = true;
    continueExtraction();
  }
  
  function continueExtraction() {
    // Check if auto-scroll is enabled
    const autoScrollEnabled = document.getElementById('gme-auto-scroll');
    const shouldAutoScroll = autoScrollEnabled && autoScrollEnabled.checked;
    
    if (shouldAutoScroll) {
      console.log("🚀 Starting extraction with auto-scroll...");
      updateStatus('extracting', '🔄 Extracting with auto-scroll...');
      updateStats();
      // Start auto-scrolling after a short delay
      setTimeout(autoScroll, 500);
    } else {
      console.log("🚀 Starting extraction (manual scroll mode)...");
      updateStatus('extracting', '🔄 Extracting... scroll manually for more');
      updateStats();
    }
  }
  
  async function autoScroll() {
    // Stop if not extracting AND not in always-on mode
    if (!isExtracting && !isAlwaysCapture) return;
    
    // Also stop if isExtracting was turned off (by clicking Stop)
    if (!isExtracting) return;
    
    // Check if auto-scroll is still enabled
    const autoScrollEnabled = document.getElementById('gme-auto-scroll');
    if (!autoScrollEnabled || !autoScrollEnabled.checked) {
      updateStatus('extracting', '🔄 Auto-scroll disabled, scroll manually');
      return;
    }
    
    var feed = document.querySelector('[role="feed"]');
    if (!feed) {
      console.log("⚠️ Feed not found, waiting...");
      if (isAlwaysCapture) {
        // In always-on mode, keep waiting for a feed
        setTimeout(autoScroll, 2000);
      }
      return;
    }
    
    var prevHeight = feed.scrollHeight;
    
    // Smooth scroll to bottom
    feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
    scrollCount++;
    
    // Wait for content to load (1500ms)
    await sleep(1500);
    
    // Check if reached end
    if (document.getElementsByClassName("HlvSq").length > 0) {
      console.log("📍 No more results in this area");
      isExtracting = false;
      scrollCount = 0;
      if (isAlwaysCapture) {
        updateStatus('extracting', '🔄 Always-on: ' + extractedLeads.size + ' leads - search another area!');
      } else {
        stopExtraction();
      }
      return;
    }
    
    // Check if stuck (height didn't change after 30 scrolls)
    if (feed.scrollHeight === prevHeight) {
      // Try clicking a result to trigger more loading
      var items = feed.querySelectorAll('[role="article"]');
      if (items.length > 0) {
        var lastItem = items[items.length - 1];
        lastItem.scrollIntoView({ behavior: 'smooth', block: 'end' });
        await sleep(500);
        feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
        await sleep(1000);
      }
      
      if (scrollCount > 30) {
        console.log("📍 Feed not loading more, waiting for new search...");
        isExtracting = false;  // Stop scrolling but don't fully stop if Always On
        scrollCount = 0;
        if (isAlwaysCapture) {
          updateStatus('extracting', '🔄 Always-on: ' + extractedLeads.size + ' leads - search another area!');
        } else {
          stopExtraction();
        }
        return;
      }
    }
    
    updateStats();
    
    // Continue scrolling ONLY if isExtracting is true (not just isAlwaysCapture)
    // isExtracting gets set to false when list is done, and true again when new data comes in
    const stillEnabled = document.getElementById('gme-auto-scroll');
    if (isExtracting && stillEnabled && stillEnabled.checked) {
      setTimeout(autoScroll, 1500);
    }
  }
  
  function stopExtraction() {
    isExtracting = false;
    isWaitingForSearchRefresh = false;
    console.log("⏹️ Extraction stopped. Total: " + extractedLeads.size);
    
    // Remove any toast
    const toast = document.getElementById('gme-toast');
    if (toast) toast.remove();
    
    const btn = document.getElementById('gme-start-btn');
    if (btn) btn.textContent = '▶ Start';
    
    if (!isAlwaysCapture) {
      updateStatus('ready', '✅ Done! ' + extractedLeads.size + ' leads extracted');
    }
    updateStats();
  }
  
  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }
  
  // ============================================
  // UI UPDATES
  // ============================================
  
  function updateStats() {
    var leads = Array.from(extractedLeads.values());
    
    var total = leads.length;
    var withPhone = leads.filter(l => l.phone).length;
    var noWebsite = leads.filter(l => !l.has_website).length;
    
    const totalEl = document.getElementById('gme-total');
    const noWebsiteEl = document.getElementById('gme-no-website');
    const withPhoneEl = document.getElementById('gme-with-phone');
    const scrollsEl = document.getElementById('gme-scrolls');
    
    if (totalEl) totalEl.textContent = total;
    if (noWebsiteEl) noWebsiteEl.textContent = noWebsite;
    if (withPhoneEl) withPhoneEl.textContent = withPhone;
    if (scrollsEl) scrollsEl.textContent = scrollCount;
  }
  
  function updateStatus(state, text) {
    const statusEl = document.getElementById('gme-status');
    const textEl = document.getElementById('gme-status-text');
    
    if (statusEl) {
      statusEl.className = 'gme-status ' + state;
    }
    if (textEl) {
      textEl.textContent = text;
    }
  }
  
  // ============================================
  // EXPORT & CLEAR
  // ============================================
  
  function exportCSV() {
    let leads = Array.from(extractedLeads.values());
    
    // Check if we should export only leads without website
    const onlyNoWebsite = document.getElementById('gme-only-no-website');
    if (onlyNoWebsite && onlyNoWebsite.checked) {
      leads = leads.filter(l => !l.has_website);
    }
    
    if (leads.length === 0) {
      alert('No leads to export!' + (onlyNoWebsite && onlyNoWebsite.checked ? ' (filtered to no-website only)' : ''));
      return;
    }
    
    const headers = ['Name', 'Phone', 'Email', 'Website', 'Address', 'Instagram', 'Facebook', 'ReviewCount', 'AverageRating', 'Category'];
    
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `""`,  // Email placeholder
        `"${(lead.website || '').replace(/"/g, '""')}"`,
        `"${(lead.address || '').replace(/"/g, '""')}"`,
        `"${(lead.instagram || '').replace(/"/g, '""')}"`,
        `"${(lead.facebook || '').replace(/"/g, '""')}"`,
        `"${lead.review_count || ''}"`,
        `"${lead.rating || ''}"`,
        `"${(lead.category || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `google_maps_leads_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log("📥 Exported " + leads.length + " leads to CSV");
  }
  
  function exportToGoogleSheets() {
    let leads = Array.from(extractedLeads.values());
    
    // Check if we should export only leads without website
    const onlyNoWebsite = document.getElementById('gme-only-no-website');
    if (onlyNoWebsite && onlyNoWebsite.checked) {
      leads = leads.filter(l => !l.has_website);
    }
    
    if (leads.length === 0) {
      alert('No leads to export!' + (onlyNoWebsite && onlyNoWebsite.checked ? ' (filtered to no-website only)' : ''));
      return;
    }
    
    // Update button to show loading
    const sheetsBtn = document.getElementById('gme-sheets-btn');
    const originalText = sheetsBtn.textContent;
    sheetsBtn.textContent = '⏳ Exporting...';
    sheetsBtn.disabled = true;
    
    // Prepare data for Google Sheets
    const sheetData = leads.map(lead => ({
      name: lead.name || '',
      phone: lead.phone || '',
      email: '',  // Email placeholder
      website: lead.website || '',
      address: lead.address || '',
      instagram: lead.instagram || '',
      facebook: lead.facebook || '',
      reviewCount: lead.review_count || '',
      averageRating: lead.rating || '',
      category: lead.category || ''
    }));
    
    // Send to background script
    chrome.runtime.sendMessage(
      { action: 'exportToGoogleSheets', data: sheetData },
      (response) => {
        sheetsBtn.textContent = originalText;
        sheetsBtn.disabled = false;
        
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError);
          alert('Failed to export: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.success) {
          console.log("📊 Exported " + leads.length + " leads to Google Sheets");
          // Open the spreadsheet in a new tab
          if (response.spreadsheetUrl) {
            window.open(response.spreadsheetUrl, '_blank');
          }
        } else {
          const errorMsg = response ? response.error : 'Unknown error';
          console.error('Export failed:', errorMsg);
          alert('Failed to export to Google Sheets: ' + errorMsg);
        }
      }
    );
  }
  
  function clearData() {
    if (extractedLeads.size > 0 && !confirm('Clear all ' + extractedLeads.size + ' leads?')) {
      return;
    }
    
    extractedLeads.clear();
    leads_lnglat.clear();
    scrollCount = 0;
    updateStats();
    updateStatus('ready', 'Data cleared - ready to extract');
    console.log("🗑 Data cleared");
  }
  
  // ============================================
  // COMMUNICATION WITH POPUP (backward compat)
  // ============================================
  
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_STATS') {
      const leads = Array.from(extractedLeads.values());
      sendResponse({
        total: leads.length,
        withPhone: leads.filter(l => l.phone).length,
        noWebsite: leads.filter(l => !l.has_website).length,
        scrolls: scrollCount,
        isExtracting: isExtracting
      });
    } else if (msg.type === 'EXPORT') {
      exportCSV();
      sendResponse({ success: true });
    } else if (msg.type === 'CLEAR') {
      extractedLeads.clear();
      leads_lnglat.clear();
      scrollCount = 0;
      updateStats();
      sendResponse({ success: true });
    }
    return true;
  });
  
  // ============================================
  // SETUP SEARCH LISTENERS (for Always-On mode)
  // ============================================
  
  function setupSearchListeners() {
    // This function is called after license is activated
    // It ensures that new searches trigger auto-extraction in Always-On mode
    console.log('🔍 Search listeners ready for Always-On mode');
  }
  
  // ============================================
  // INITIALIZE
  // ============================================
  
  async function init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Check license status
    await checkLicenseStatus();
    
    // Always create floating panel (locked or unlocked based on license)
    createFloatingPanel();
    
    // Setup search button listeners only if licensed
    if (isLicenseValid) {
      setupSearchListeners();
    }
    
    // Re-setup listeners when page content changes (SPA navigation)
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
  
  // Start
  init();
  
})();
