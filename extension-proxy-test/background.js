/**
 * MapsReach - Background Service Worker
 * 
 * Handles:
 * - Extension installation
 * - Communication between content scripts and popup
 * - Storage management
 */

// ============================================
// INSTALLATION
// ============================================
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // First time install
    chrome.storage.local.set({
      totalLeadsExtracted: 0,
      installDate: Date.now()
    });
  }
});

// ============================================
// MESSAGE HANDLING
// ============================================
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getStats') {
    chrome.storage.local.get(['totalLeadsExtracted'], function(data) {
      sendResponse({ total: data.totalLeadsExtracted || 0 });
    });
    return true;  // Keep channel open for async response
  }
  
  if (request.action === 'updateStats') {
    chrome.storage.local.get(['totalLeadsExtracted'], function(data) {
      const newTotal = (data.totalLeadsExtracted || 0) + (request.count || 0);
      chrome.storage.local.set({ totalLeadsExtracted: newTotal });
      sendResponse({ total: newTotal });
    });
    return true;
  }
});
