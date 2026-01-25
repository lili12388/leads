/**
 * MapsReach Trial System - Browser Fingerprinting & Quota Management
 * 
 * This module handles:
 * 1. Browser fingerprint generation (canvas, webgl, audio, etc.)
 * 2. Server communication for quota tracking
 * 3. Upgrade modal when quota exhausted
 */

const TrialSystem = (function() {
  'use strict';

  const API_BASE = 'https://mapsreach.com/api/trial';
  const FREE_LEAD_LIMIT = 50;
  
  // Cache fingerprint to avoid recalculating
  let cachedFingerprint = null;
  let cachedTrialStatus = null;
  
  // ============================================
  // FINGERPRINT GENERATION
  // ============================================
  
  /**
   * Generate a unique browser fingerprint using multiple signals
   */
  async function generateFingerprint() {
    if (cachedFingerprint) return cachedFingerprint;
    
    const components = [];
    
    // 1. Canvas fingerprint
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      
      // Draw various elements for uniqueness
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('MapsReach 🗺️', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('MapsReach 🗺️', 4, 17);
      
      components.push(canvas.toDataURL());
    } catch (e) {
      components.push('canvas-error');
    }
    
    // 2. WebGL fingerprint
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
          components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
        }
        components.push(gl.getParameter(gl.VERSION));
        components.push(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
      }
    } catch (e) {
      components.push('webgl-error');
    }
    
    // 3. Audio fingerprint
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      
      gainNode.gain.value = 0; // Mute
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      components.push(audioContext.sampleRate.toString());
      audioContext.close();
    } catch (e) {
      components.push('audio-error');
    }
    
    // 4. Screen properties
    components.push(screen.width + 'x' + screen.height);
    components.push(screen.colorDepth.toString());
    components.push(screen.pixelDepth?.toString() || '');
    components.push(window.devicePixelRatio?.toString() || '1');
    
    // 5. Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    components.push(new Date().getTimezoneOffset().toString());
    
    // 6. Language
    components.push(navigator.language);
    components.push((navigator.languages || []).join(','));
    
    // 7. Platform & hardware
    components.push(navigator.platform || '');
    components.push(navigator.hardwareConcurrency?.toString() || '');
    components.push(navigator.deviceMemory?.toString() || '');
    
    // 8. Browser plugins (limited in modern browsers but still useful)
    try {
      const plugins = Array.from(navigator.plugins || []).map(p => p.name).join(',');
      components.push(plugins);
    } catch (e) {
      components.push('plugins-error');
    }
    
    // 9. Touch support
    components.push(('ontouchstart' in window).toString());
    components.push((navigator.maxTouchPoints || 0).toString());
    
    // 10. WebGL extensions
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const extensions = gl.getSupportedExtensions() || [];
        components.push(extensions.join(','));
      }
    } catch (e) {
      components.push('webgl-ext-error');
    }
    
    // Create hash from all components
    const raw = components.join('|||');
    cachedFingerprint = await hashString(raw);
    
    return cachedFingerprint;
  }
  
  /**
   * Hash a string using SHA-256
   */
  async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // ============================================
  // SERVER COMMUNICATION
  // ============================================
  
  /**
   * Initialize trial - get or create trial status for this fingerprint
   */
  async function initTrial() {
    try {
      const fingerprint = await generateFingerprint();
      
      // First check local storage for cached status
      const cached = await getLocalTrialStatus();
      if (cached && cached.fingerprint === fingerprint) {
        // Use cached but verify with server in background
        cachedTrialStatus = cached;
        verifyWithServer(fingerprint); // Async, don't await
        return cached;
      }
      
      // Fetch from server
      const response = await fetch(`${API_BASE}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint })
      });
      
      if (!response.ok) throw new Error('Server error');
      
      const data = await response.json();
      
      // Cache locally
      const status = {
        fingerprint,
        leadsUsed: data.leadsUsed || 0,
        leadsRemaining: data.leadsRemaining || FREE_LEAD_LIMIT,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked: data.isLocked || false,
        lastSync: Date.now()
      };
      
      await saveLocalTrialStatus(status);
      cachedTrialStatus = status;
      
      return status;
    } catch (error) {
      console.error('[TrialSystem] Init error:', error);
      
      // Fallback to local storage if server fails
      const local = await getLocalTrialStatus();
      if (local) {
        cachedTrialStatus = local;
        return local;
      }
      
      // Brand new user with no server connection - give them benefit of doubt
      return {
        fingerprint: await generateFingerprint(),
        leadsUsed: 0,
        leadsRemaining: FREE_LEAD_LIMIT,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked: false,
        offline: true
      };
    }
  }
  
  /**
   * Background verify with server
   */
  async function verifyWithServer(fingerprint) {
    try {
      const response = await fetch(`${API_BASE}/init?fingerprint=${fingerprint}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          const status = {
            fingerprint,
            leadsUsed: data.leadsUsed,
            leadsRemaining: data.leadsRemaining,
            leadsTotal: FREE_LEAD_LIMIT,
            isLocked: data.isLocked,
            lastSync: Date.now()
          };
          await saveLocalTrialStatus(status);
          cachedTrialStatus = status;
        }
      }
    } catch (e) {
      // Silent fail for background check
    }
  }
  
  /**
   * Consume leads - call this when user extracts leads
   */
  async function consumeLeads(count) {
    try {
      const fingerprint = await generateFingerprint();
      
      // Optimistic local update first
      const local = await getLocalTrialStatus();
      if (local) {
        local.leadsUsed += count;
        local.leadsRemaining = Math.max(0, FREE_LEAD_LIMIT - local.leadsUsed);
        local.isLocked = local.leadsRemaining === 0;
        await saveLocalTrialStatus(local);
        cachedTrialStatus = local;
      }
      
      // Then sync with server
      const response = await fetch(`${API_BASE}/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, leadsCount: count })
      });
      
      if (!response.ok) {
        console.warn('[TrialSystem] Server consume failed, using local count');
        return cachedTrialStatus;
      }
      
      const data = await response.json();
      
      // Update with server truth
      const status = {
        fingerprint,
        leadsUsed: data.leadsUsed,
        leadsRemaining: data.leadsRemaining,
        leadsTotal: FREE_LEAD_LIMIT,
        isLocked: data.isLocked,
        lastSync: Date.now(),
        warning: data.warning
      };
      
      await saveLocalTrialStatus(status);
      cachedTrialStatus = status;
      
      return status;
    } catch (error) {
      console.error('[TrialSystem] Consume error:', error);
      return cachedTrialStatus;
    }
  }
  
  /**
   * Check if user can extract more leads
   */
  async function canExtract() {
    const status = cachedTrialStatus || await initTrial();
    return !status.isLocked && status.leadsRemaining > 0;
  }
  
  /**
   * Get current status
   */
  async function getStatus() {
    if (cachedTrialStatus && Date.now() - (cachedTrialStatus.lastSync || 0) < 60000) {
      return cachedTrialStatus;
    }
    return await initTrial();
  }
  
  // ============================================
  // LOCAL STORAGE
  // ============================================
  
  async function getLocalTrialStatus() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['mapsreach_trial'], (result) => {
        resolve(result.mapsreach_trial || null);
      });
    });
  }
  
  async function saveLocalTrialStatus(status) {
    return new Promise(resolve => {
      chrome.storage.sync.set({ mapsreach_trial: status }, resolve);
    });
  }
  
  // ============================================
  // UPGRADE MODAL
  // ============================================
  
  /**
   * Show export limit modal (when user tries to export more than 100)
   * @param {number} totalCollected - Total leads collected
   * @param {number} exportLimit - Max leads in free version
   * @param {function} onContinue - Callback to execute CSV download when user clicks continue
   */
  function showExportLimitModal(totalCollected, exportLimit, onContinue) {
    // Remove existing modal if any
    const existing = document.getElementById('mapsreach-upgrade-modal');
    if (existing) existing.remove();
    
    const lockedLeads = totalCollected - exportLimit;
    
    const modal = document.createElement('div');
    modal.id = 'mapsreach-upgrade-modal';
    modal.innerHTML = `
      <style>
        #mapsreach-upgrade-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .mapsreach-modal-content {
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border-radius: 24px;
          padding: 40px;
          max-width: 520px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .mapsreach-modal-logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mapsreach-modal-logo img {
          width: 80px;
          height: 80px;
          border-radius: 16px;
        }
        
        .mapsreach-modal-title {
          color: #f8fafc;
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 12px;
          line-height: 1.3;
        }
        
        .mapsreach-modal-subtitle {
          color: #94a3b8;
          font-size: 16px;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        
        .mapsreach-modal-subtitle strong {
          color: #f8fafc;
        }
        
        .mapsreach-export-stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .mapsreach-export-stat {
          padding: 16px 24px;
          border-radius: 16px;
          text-align: center;
        }
        
        .mapsreach-export-stat.exported {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .mapsreach-export-stat.locked {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .mapsreach-export-stat-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .mapsreach-export-stat.exported .mapsreach-export-stat-value {
          color: #22c55e;
        }
        
        .mapsreach-export-stat.locked .mapsreach-export-stat-value {
          color: #ef4444;
        }
        
        .mapsreach-export-stat-label {
          color: #94a3b8;
          font-size: 13px;
        }
        
        .mapsreach-unlock-banner {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .mapsreach-unlock-banner p {
          color: #93c5fd;
          font-size: 15px;
          font-weight: 500;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .mapsreach-modal-cta {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 16px 40px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
          margin-bottom: 12px;
        }
        
        .mapsreach-modal-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }
        
        .mapsreach-modal-secondary {
          background: transparent;
          color: #94a3b8;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mapsreach-modal-secondary:hover {
          background: rgba(148, 163, 184, 0.1);
          color: #cbd5e1;
        }
        
        .mapsreach-modal-price {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 16px;
        }
        
        .mapsreach-modal-price span {
          color: #22c55e;
          font-weight: 600;
        }
        
        .mapsreach-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mapsreach-modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
      </style>
      
      <div class="mapsreach-modal-content" style="position: relative;">
        <button class="mapsreach-modal-close" id="mapsreach-close-btn">×</button>
        
        <div class="mapsreach-modal-logo">
          <img src="${chrome.runtime.getURL('icons/logo.png')}" alt="MapsReach" style="width: 48px; height: 48px; border-radius: 8px;">
        </div>
        
        <h2 class="mapsreach-modal-title">🎉 Amazing! You Found ${totalCollected} Leads!</h2>
        
        <p class="mapsreach-modal-subtitle">
          Your <strong>free version</strong> includes a one-time export of <strong>${exportLimit} leads</strong>.<br>
          Upgrade now to unlock all ${totalCollected} leads + unlimited future exports!
        </p>
        
        <div class="mapsreach-export-stats">
          <div class="mapsreach-export-stat exported">
            <div class="mapsreach-export-stat-value">✓ ${exportLimit}</div>
            <div class="mapsreach-export-stat-label">Available Now</div>
          </div>
          <div class="mapsreach-export-stat locked">
            <div class="mapsreach-export-stat-value">🔒 ${lockedLeads}</div>
            <div class="mapsreach-export-stat-label">Needs Upgrade</div>
          </div>
        </div>
        
        <div class="mapsreach-unlock-banner">
          <p>✨ Unlock unlimited exports forever — one payment, lifetime access!</p>
        </div>
        
        <button class="mapsreach-modal-cta" onclick="window.open('https://mapsreach.com/pricing', '_blank')">
          Upgrade Now - Only $59
        </button>
        
        <button class="mapsreach-modal-secondary" id="mapsreach-continue-btn">
          Download ${exportLimit} leads only
        </button>
        
        <p class="mapsreach-modal-price">
          One-time payment • <span>Lifetime access</span> • No subscriptions ever
        </p>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle Continue button - download CSV and close
    const continueBtn = modal.querySelector('#mapsreach-continue-btn');
    continueBtn.addEventListener('click', () => {
      modal.remove();
      if (typeof onContinue === 'function') {
        onContinue();
      }
    });
    
    // Handle close button - just close, no download
    const closeBtn = modal.querySelector('#mapsreach-close-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Close on backdrop click - just close, no download
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  function showUpgradeModal() {
    // Remove existing modal if any
    const existing = document.getElementById('mapsreach-upgrade-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'mapsreach-upgrade-modal';
    modal.innerHTML = `
      <style>
        #mapsreach-upgrade-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .mapsreach-modal-content {
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border-radius: 24px;
          padding: 40px;
          max-width: 480px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .mapsreach-modal-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        
        .mapsreach-modal-title {
          color: #f8fafc;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        
        .mapsreach-modal-subtitle {
          color: #94a3b8;
          font-size: 16px;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        
        .mapsreach-modal-stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 28px;
          padding: 20px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        
        .mapsreach-stat {
          text-align: center;
        }
        
        .mapsreach-stat-value {
          color: #3b82f6;
          font-size: 32px;
          font-weight: 700;
        }
        
        .mapsreach-stat-label {
          color: #94a3b8;
          font-size: 13px;
          margin-top: 4px;
        }
        
        .mapsreach-modal-cta {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 16px 40px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }
        
        .mapsreach-modal-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }
        
        .mapsreach-modal-price {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 16px;
        }
        
        .mapsreach-modal-price span {
          color: #22c55e;
          font-weight: 600;
        }
        
        .mapsreach-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mapsreach-modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .mapsreach-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
          text-align: left;
        }
        
        .mapsreach-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #cbd5e1;
          font-size: 14px;
        }
        
        .mapsreach-feature-icon {
          color: #22c55e;
        }
      </style>
      
      <div class="mapsreach-modal-content" style="position: relative;">
        <button class="mapsreach-modal-close" onclick="document.getElementById('mapsreach-upgrade-modal').remove()">×</button>
        
        <div class="mapsreach-modal-icon">🎯</div>
        
        <h2 class="mapsreach-modal-title">You've Used All Free Leads!</h2>
        
        <p class="mapsreach-modal-subtitle">
          Great job extracting leads! Upgrade to unlimited extractions and supercharge your lead generation.
        </p>
        
        <div class="mapsreach-modal-stats">
          <div class="mapsreach-stat">
            <div class="mapsreach-stat-value">100</div>
            <div class="mapsreach-stat-label">Leads Extracted</div>
          </div>
          <div class="mapsreach-stat">
            <div class="mapsreach-stat-value">0</div>
            <div class="mapsreach-stat-label">Remaining</div>
          </div>
        </div>
        
        <div class="mapsreach-features">
          <div class="mapsreach-feature">
            <span class="mapsreach-feature-icon">✓</span>
            Unlimited Leads
          </div>
          <div class="mapsreach-feature">
            <span class="mapsreach-feature-icon">✓</span>
            Email Enrichment
          </div>
          <div class="mapsreach-feature">
            <span class="mapsreach-feature-icon">✓</span>
            Google Sheets Sync
          </div>
          <div class="mapsreach-feature">
            <span class="mapsreach-feature-icon">✓</span>
            Priority Support
          </div>
        </div>
        
        <button class="mapsreach-modal-cta" onclick="window.open('https://mapsreach.com/pricing', '_blank')">
          🚀 Unlock Unlimited Leads
        </button>
        
        <p class="mapsreach-modal-price">
          One-time payment of <span>$59</span> • Lifetime access
        </p>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  /**
   * Show quota warning (when approaching limit)
   */
  function showQuotaWarning(remaining) {
    const existing = document.getElementById('mapsreach-quota-warning');
    if (existing) existing.remove();
    
    const warning = document.createElement('div');
    warning.id = 'mapsreach-quota-warning';
    warning.innerHTML = `
      <style>
        #mapsreach-quota-warning {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 2147483646;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          animation: slideInRight 0.3s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .mapsreach-warning-icon {
          font-size: 24px;
        }
        
        .mapsreach-warning-text {
          color: #fbbf24;
          font-size: 14px;
          font-weight: 500;
        }
        
        .mapsreach-warning-close {
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
        }
      </style>
      
      <span class="mapsreach-warning-icon">⚠️</span>
      <span class="mapsreach-warning-text">Only ${remaining} free leads remaining!</span>
      <button class="mapsreach-warning-close" onclick="document.getElementById('mapsreach-quota-warning').remove()">×</button>
    `;
    
    document.body.appendChild(warning);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (document.getElementById('mapsreach-quota-warning')) {
        warning.remove();
      }
    }, 5000);
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  return {
    generateFingerprint,
    initTrial,
    consumeLeads,
    canExtract,
    getStatus,
    showUpgradeModal,
    showExportLimitModal,
    showQuotaWarning,
    FREE_LEAD_LIMIT
  };
  
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrialSystem;
}
