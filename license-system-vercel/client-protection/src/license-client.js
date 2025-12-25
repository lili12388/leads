/**
 * License Client Protection Module
 * 
 * This module handles license validation on the client side.
 * It will be obfuscated before distribution.
 */

// Configuration - these will be replaced at build time
const CONFIG = {
  API_BASE_URL: 'https://gle3-git-main-rimenehmaid-3753s-projects.vercel.app',
  GRACE_PERIOD_MS: 86400000, // 24 hours
  VALIDATION_INTERVAL_MS: 3600000, // 1 hour
  STORAGE_KEY_TOKEN: '__maps_ext_token__',
  STORAGE_KEY_CACHE: '__maps_ext_cache__',
};

/**
 * Generate privacy-friendly device fingerprint
 * Uses only non-identifying browser characteristics
 */
function generateFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency || 'unknown',
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    navigator.platform,
  ];
  
  return hashString(components.join('|'));
}

/**
 * Simple string hash function (djb2)
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Get extension ID (works in Chrome/Edge)
 */
function getExtensionId() {
  try {
    // Chrome runtime ID
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      return chrome.runtime.id;
    }
    // Fallback to URL-based ID extraction
    const url = chrome?.runtime?.getURL?.('') || '';
    const match = url.match(/^chrome-extension:\/\/([^/]+)/);
    if (match) return match[1];
    
    // Final fallback - use a stable identifier from storage
    return localStorage.getItem('__ext_installation_id__') || generateInstallationId();
  } catch (e) {
    return generateInstallationId();
  }
}

/**
 * Generate a stable installation ID
 */
function generateInstallationId() {
  let id = localStorage.getItem('__ext_installation_id__');
  if (!id) {
    id = 'ext_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('__ext_installation_id__', id);
  }
  return id;
}

/**
 * Get cached license data
 */
async function getCachedLicense() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const res = await chrome.storage.local.get([CONFIG.STORAGE_KEY_CACHE]);
      return res[CONFIG.STORAGE_KEY_CACHE] || null;
    }
    const cached = localStorage.getItem(CONFIG.STORAGE_KEY_CACHE);
    if (!cached) return null;
    const data = JSON.parse(cached);
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Cache license data
 */
async function cacheLicense(data) {
  try {
    const cacheData = {
      ...data,
      cachedAt: Date.now(),
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [CONFIG.STORAGE_KEY_CACHE]: cacheData });
    } else {
      localStorage.setItem(CONFIG.STORAGE_KEY_CACHE, JSON.stringify(cacheData));
    }
  } catch (e) {
    console.error('Failed to cache license:', e);
  }
}

/**
 * Get stored token
 */
async function getStoredToken() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const res = await chrome.storage.local.get([CONFIG.STORAGE_KEY_TOKEN]);
      return res[CONFIG.STORAGE_KEY_TOKEN] || null;
    }
    return localStorage.getItem(CONFIG.STORAGE_KEY_TOKEN);
  } catch (e) {
    return null;
  }
}

/**
 * Store token
 */
async function storeToken(token) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [CONFIG.STORAGE_KEY_TOKEN]: token });
    } else {
      localStorage.setItem(CONFIG.STORAGE_KEY_TOKEN, token);
    }
  } catch (e) {
    console.error('Failed to store token:', e);
  }
}

/**
 * Clear all license data
 */
async function clearLicenseData() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.remove([CONFIG.STORAGE_KEY_TOKEN, CONFIG.STORAGE_KEY_CACHE]);
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEY_TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEY_CACHE);
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Client info for activation
 */
function getClientInfo() {
  return {
    browser: getBrowserName(),
    os: getOSName(),
    app_version: '1.0.0',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language.split('-')[0],
  };
}

function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Chrome/')) return 'chrome';
  if (ua.includes('Firefox/')) return 'firefox';
  if (ua.includes('Safari/')) return 'safari';
  if (ua.includes('OPR/')) return 'opera';
  return 'other';
}

function getOSName() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'windows';
  if (ua.includes('Mac OS')) return 'mac';
  if (ua.includes('Linux')) return 'linux';
  if (ua.includes('Android')) return 'android';
  if (ua.includes('iOS')) return 'ios';
  return 'other';
}

/**
 * Main License Client Class
 */
class LicenseClient {
  constructor() {
    this._extensionId = getExtensionId();
    this._fingerprint = generateFingerprint();
    this._validationTimer = null;
    this._isValid = false;
    this._plan = null;
    this._callbacks = {
      onValid: [],
      onInvalid: [],
      onExpired: [],
      onError: [],
    };
  }
  
  /**
   * Register callback
   */
  on(event, callback) {
    if (this._callbacks[event]) {
      this._callbacks[event].push(callback);
    }
    return this;
  }
  
  /**
   * Emit event
   */
  _emit(event, data) {
    const callbacks = this._callbacks[event] || [];
    callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error('Callback error:', e);
      }
    });
  }
  
  /**
   * Check if license is currently valid (from cache)
   */
  get isValid() {
    return this._isValid;
  }
  
  /**
   * Get current plan
   */
  get plan() {
    return this._plan;
  }
  
  /**
   * Activate license with key
   */
  async activate(licenseKey) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/license/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: licenseKey,
          extension_id: this._extensionId,
          fingerprint_hash: this._fingerprint,
          client: getClientInfo(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorCode = data.code || data.error;
        this._emit('onError', { code: errorCode, message: data.message });
        return { success: false, error: errorCode, message: data.message };
      }
      
      // Store token and cache data
        await storeToken(data.token);
        await cacheLicense({
        plan: data.plan,
        expiresAt: data.expires_at,
        graceSeconds: data.grace_seconds,
        maxActivations: data.max_activations,
        currentActivations: data.current_activations,
      });
      
      this._isValid = true;
      this._plan = data.plan;
      
      // Start validation loop
      this._startValidationLoop();
      
      this._emit('onValid', { plan: data.plan });
      
      return { 
        success: true, 
        plan: data.plan,
        license: {
          type: data.plan,
          plan: data.plan,
          expiresAt: data.expires_at,
          maxActivations: data.max_activations,
        }
      };
      
    } catch (error) {
      this._emit('onError', { code: 'NETWORK_ERROR', message: error.message });
      return { success: false, error: 'NETWORK_ERROR', message: error.message };
    }
  }
  
  /**
   * Validate current token
   */
  async validate(useCache = false) {
    const token = await getStoredToken();

    if (!token) {
      // No token - try cached data (within grace period)
      const cached = await getCachedLicense();
      if (cached && this._isWithinGracePeriod(cached)) {
        this._isValid = true;
        this._plan = cached.plan;
        this._emit('onValid', { plan: cached.plan, fromCache: true });
        return { valid: true, fromCache: true };
      }

      this._isValid = false;
      // Don't clear data here - user might have just opened popup
      return { valid: false, reason: 'No token' };
    }
    
    // Check cache first if allowed
    if (useCache) {
        const cached = await getCachedLicense();
      if (cached) {
        const cacheAge = Date.now() - (cached.cachedAt || 0);
        if (cacheAge < CONFIG.VALIDATION_INTERVAL_MS) {
          this._isValid = true;
          this._plan = cached.plan;
          return { valid: true, fromCache: true };
        }
      }
    }
    
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          extension_id: this._extensionId,
          fingerprint_hash: this._fingerprint,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorCode = data.code || data.error;
        // Only clear storage for revocation/activation errors (not fingerprint mismatches during init)
        const clearStorageCodes = new Set([
          'LICENSE_REVOKED',
          'ACTIVATION_INVALID',
        ]);

        if (clearStorageCodes.has(errorCode)) {
          // Critical failure - clear everything
          this._isValid = false;
          this._plan = null;
          await clearLicenseData();
          this._emit('onInvalid', { code: errorCode, message: data.message });
          return { valid: false, error: errorCode, message: data.message };
        }

        // For other errors, check grace period before failing
        const cached = await getCachedLicense();
        if (cached && this._isWithinGracePeriod(cached)) {
          this._isValid = true;
          this._plan = cached.plan;
          this._emit('onValid', { plan: cached.plan, gracePeriod: true });
          return { valid: true, gracePeriod: true };
        }
        
        this._isValid = false;
        this._plan = null;

        if (errorCode === 'LICENSE_EXPIRED') {
          this._emit('onExpired', {});
        } else {
          this._emit('onInvalid', { code: errorCode, message: data.message });
        }

        return { valid: false, error: errorCode, message: data.message };
      }
      
      // Update cache
      cacheLicense({
        plan: data.plan,
        expiresAt: data.expires_at,
        graceSeconds: data.grace_seconds || CONFIG.GRACE_PERIOD_MS / 1000,
      });
      
      // Update token if refreshed
      if (data.refreshed_token) {
          await storeToken(data.refreshed_token);
      }
      
      this._isValid = true;
      this._plan = data.plan;
      
      this._emit('onValid', { plan: data.plan });
      
      return { valid: true, plan: data.plan };
      
    } catch (error) {
      // Network error - check grace period
      const cached = await getCachedLicense();
      if (cached && this._isWithinGracePeriod(cached)) {
        this._isValid = true;
        this._plan = cached.plan;
        this._emit('onValid', { plan: cached.plan, gracePeriod: true, offline: true });
        return { valid: true, gracePeriod: true, offline: true };
      }
      
      this._emit('onError', { code: 'NETWORK_ERROR', message: error.message });
      return { valid: false, error: 'NETWORK_ERROR', message: error.message };
    }
  }
  
  /**
   * Check if within grace period
   */
  _isWithinGracePeriod(cached) {
    if (!cached || !cached.expiresAt) return false;
    
    const expiresAt = cached.expiresAt * 1000; // Convert to ms
    const graceMs = (cached.graceSeconds || 86400) * 1000;
    const now = Date.now();
    
    return now < expiresAt + graceMs;
  }
  
  /**
   * Start background validation loop
   */
  _startValidationLoop() {
    if (this._validationTimer) {
      clearInterval(this._validationTimer);
    }
    
    this._validationTimer = setInterval(() => {
      this.validate(false).catch(e => {
        console.error('Background validation failed:', e);
      });
    }, CONFIG.VALIDATION_INTERVAL_MS);
  }
  
  /**
   * Stop validation loop
   */
  stopValidation() {
    if (this._validationTimer) {
      clearInterval(this._validationTimer);
      this._validationTimer = null;
    }
  }
  
  /**
   * Get license info
   */
  async getLicenseInfo() {
    const cached = await getCachedLicense();
    return {
      isValid: this._isValid,
      plan: this._plan,
      type: this._plan,
      expiresAt: cached?.expiresAt,
      maxActivations: cached?.maxActivations,
    };
  }
  
  /**
   * Initialize - check existing license
   */
  async init() {
    // Use cache first on init so popup restores validated state immediately
    const result = await this.validate(true);
    
    if (result.valid) {
      this._startValidationLoop();
    }
    
    return result.valid;
  }
  
  /**
   * Logout / clear license
   */
  logout() {
    this.stopValidation();
    clearLicenseData();
    this._isValid = false;
    this._plan = null;
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.LicenseClient = LicenseClient;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LicenseClient };
}

export { LicenseClient };
