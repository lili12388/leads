/**
 * G-Maps Extractor - Proxy + Fetch Interception
 * 
 * This is a CLEAN implementation using:
 * - Proxy-based XHR interception (not prototype patching)
 * - Fetch API interception
 * 
 * This captures ALL network requests that contain business data.
 */

(function() {
  'use strict';
  
  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    messageType: 'gme_data_capture',
    patterns: [
      'search?tbm=map',    // Main search results (maps tab)
      '/search?',          // General search with params
      'batchexecute',      // Batch API calls
      '$rpc',              // RPC calls (used by Search this area)
      'place/',            // Place details
      'preview/place',     // Place preview
    ],
    excludePatterns: [
      'log204',            // Analytics - ignore these
      'preview/log',       // Preview logs - ignore
      'gen204',            // Tracking pixel
      'photometa',         // Photo metadata
    ],
    debug: true  // Set to false in production
  };
  
  // ============================================
  // DEBUG LOGGING
  // ============================================
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[GME Injected]', ...args);
    }
  }
  
  // ============================================
  // UTILITY: Check if URL matches our patterns
  // ============================================
  function shouldCapture(url) {
    if (!url) return false;
    const urlStr = url.toString().toLowerCase();
    
    // First check exclusions
    for (const exclude of CONFIG.excludePatterns) {
      if (urlStr.includes(exclude.toLowerCase())) {
        return false;
      }
    }
    
    // Then check inclusions
    for (const pattern of CONFIG.patterns) {
      if (urlStr.includes(pattern.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }
  
  // ============================================
  // UTILITY: Send data to content script
  // ============================================
  function sendToContentScript(url, data, method, source) {
    try {
      window.postMessage({
        type: CONFIG.messageType,
        payload: {
          url: url,
          data: data,
          method: method,
          source: source,  // 'xhr' or 'fetch'
          timestamp: Date.now()
        }
      }, '*');
      
      log(`Captured ${source.toUpperCase()}:`, url.substring(0, 80) + '...');
    } catch (e) {
      log('Error sending to content script:', e);
    }
  }
  
  // ============================================
  // METHOD 1: PROXY-BASED XHR INTERCEPTION
  // ============================================
  const NativeXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new NativeXHR();
    
    // Private state for this instance
    let capturedUrl = null;
    let capturedMethod = null;
    
    // Wrap 'open' method to capture URL
    const nativeOpen = xhr.open.bind(xhr);
    xhr.open = function(method, url, async, user, password) {
      capturedUrl = url;
      capturedMethod = method;
      log('XHR Open:', method, url?.substring?.(0, 60) || url);
      return nativeOpen(method, url, async !== false, user, password);
    };
    
    // Listen for ALL state changes to catch streaming responses
    xhr.addEventListener('readystatechange', function() {
      const urlStr = capturedUrl?.toString() || '';
      
      // Debug search requests at every state
      if (urlStr.includes('search?tbm=map') || urlStr.includes('batchexecute')) {
        log(`XHR State Change: readyState=${xhr.readyState} status=${xhr.status} url=${urlStr.substring(0, 50)}...`);
        
        // If we have response data, log it
        if (xhr.readyState === 4) {
          try {
            const data = xhr.responseText;
            log(`XHR Response received! Length: ${data?.length || 0}`);
            
            if (data && data.length > 100) {
              // Print first 500 chars to console for debugging
              console.log('[GME DEBUG] Full response preview (first 1000 chars):');
              console.log(data.substring(0, 1000));
              
              // Send to content script
              if (shouldCapture(capturedUrl)) {
                sendToContentScript(capturedUrl, data, capturedMethod, 'xhr');
              }
            }
          } catch (e) {
            log('Error reading response:', e);
          }
        }
      }
    });
    
    // Also keep loadend for other requests
    xhr.addEventListener('loadend', function() {
      const urlStr = capturedUrl?.toString() || '';
      const willCapture = shouldCapture(capturedUrl);
      
      // Skip search URLs here since we handle them in readystatechange
      if (urlStr.includes('search?tbm=map')) return;
      
      // Debug: Log whether this URL will be captured
      if (urlStr.includes('batchexecute')) {
        log(`XHR Complete: ${urlStr.substring(0, 60)}... | status=${xhr.status} | capture=${willCapture} | length=${xhr.responseText?.length || 0}`);
      }
      
      if (willCapture && xhr.readyState === 4 && xhr.status === 200) {
        try {
          const responseData = xhr.responseText;
          if (responseData && responseData.length > 0) {
            sendToContentScript(capturedUrl, responseData, capturedMethod, 'xhr');
          }
        } catch (e) {
          log('XHR capture error:', e);
        }
      }
    });
    
    return xhr;
  };
  
  // Copy static properties from native XHR
  window.XMLHttpRequest.UNSENT = 0;
  window.XMLHttpRequest.OPENED = 1;
  window.XMLHttpRequest.HEADERS_RECEIVED = 2;
  window.XMLHttpRequest.LOADING = 3;
  window.XMLHttpRequest.DONE = 4;
  window.XMLHttpRequest.prototype = NativeXHR.prototype;
  
  log('XHR interception installed');
  
  // ============================================
  // METHOD 2: FETCH API INTERCEPTION
  // ============================================
  const nativeFetch = window.fetch.bind(window);
  
  window.fetch = async function(input, init) {
    // Determine URL from input
    let url;
    if (input instanceof Request) {
      url = input.url;
    } else {
      url = input.toString();
    }
    
    const method = init?.method || 'GET';
    
    log('Fetch:', method, url?.substring?.(0, 60) || url);
    
    try {
      // Call original fetch
      const response = await nativeFetch(input, init);
      
      // Debug: Log search/batchexecute requests
      const urlStr = url?.toString() || '';
      if (urlStr.includes('search') || urlStr.includes('batchexecute')) {
        log(`Fetch Complete: ${urlStr.substring(0, 60)}... | status=${response.status}`);
      }
      
      // Check if we should capture this response
      if (shouldCapture(url) && response.ok) {
        try {
          // Clone response because body can only be read once
          const clone = response.clone();
          const data = await clone.text();
          
          log(`Fetch Response: ${data?.length || 0} bytes`);
          
          if (data && data.length > 100) {
            // Print preview for debugging
            if (urlStr.includes('search') || urlStr.includes('batchexecute')) {
              console.log('[GME DEBUG FETCH] Full response preview (first 1000 chars):');
              console.log(data.substring(0, 1000));
            }
            
            sendToContentScript(url, data, method, 'fetch');
          }
        } catch (e) {
          log('Fetch capture error:', e);
        }
      }
      
      // Return original response to the page
      return response;
      
    } catch (error) {
      // Re-throw original error
      throw error;
    }
  };
  
  log('Fetch interception installed');
  
  // ============================================
  // INITIALIZATION SIGNAL
  // ============================================
  window.postMessage({
    type: CONFIG.messageType,
    payload: {
      status: 'initialized',
      version: '2.0.0',
      methods: ['xhr-proxy', 'fetch'],
      timestamp: Date.now()
    }
  }, '*');
  
  log('Initialization complete - Proxy + Fetch method active');
  
})();
