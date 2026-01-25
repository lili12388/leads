import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// ===========================================
// HASHING
// ===========================================

/**
 * Hash a string using SHA256
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Hash a license key for storage (never store plaintext!)
 */
export function hashLicenseKey(licenseKey: string): string {
  // Normalize: uppercase, trim
  const normalized = licenseKey.toUpperCase().trim();
  return sha256(normalized);
}

/**
 * Verify a license key against its hash
 */
export function verifyLicenseKey(licenseKey: string, hash: string): boolean {
  return hashLicenseKey(licenseKey) === hash;
}

// ===========================================
// LICENSE KEY GENERATION
// ===========================================

/**
 * Generate a new license key in format: LIC-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const segments: string[] = [];
  for (let i = 0; i < 4; i++) {
    const segment = randomBytes(2).toString('hex').toUpperCase();
    segments.push(segment);
  }
  return `LIC-${segments.join('-')}`;
}

// ===========================================
// JWT TOKENS
// ===========================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
const TOKEN_VERSION = 1;

export interface TokenPayload {
  // License info
  lid: string;      // licenseId
  aid: string;      // activationId
  plan: string;     // plan type
  
  // Timing
  exp: number;      // expiry timestamp
  iat: number;      // issued at timestamp
  grace: number;    // grace period in seconds
  
  // Security
  jti: string;      // unique token ID
  ver: number;      // token version
  
  // Binding
  eid: string;      // extensionId (for validation)
  fph: string;      // fingerprint hash (first 16 chars for validation)
}

export interface TokenData {
  licenseId: string;
  activationId: string;
  plan: string;
  expiresAt: Date;
  issuedAt: Date;
  graceSeconds: number;
  jti: string;
  extensionId: string;
  fingerprintHash: string;
}

/**
 * Sign a new token for an activation
 */
export function signToken(data: {
  licenseId: string;
  activationId: string;
  plan: string;
  extensionId: string;
  fingerprintHash: string;
  expiresAt?: Date;
  graceSeconds?: number;
}): { token: string; expiresAt: Date; jti: string } {
  const now = Math.floor(Date.now() / 1000);
  const graceSeconds = data.graceSeconds ?? parseInt(process.env.GRACE_SECONDS || '86400');
  const tokenExpiry = parseInt(process.env.TOKEN_EXPIRY_SECONDS || '86400');
  const expiresAt = data.expiresAt ?? new Date((now + tokenExpiry) * 1000);
  const jti = uuidv4();
  
  const payload: TokenPayload = {
    lid: data.licenseId,
    aid: data.activationId,
    plan: data.plan,
    exp: Math.floor(expiresAt.getTime() / 1000),
    iat: now,
    grace: graceSeconds,
    jti: jti,
    ver: TOKEN_VERSION,
    eid: data.extensionId,
    fph: data.fingerprintHash.substring(0, 16), // Store partial for quick validation
  };
  
  const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  
  return { token, expiresAt, jti };
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    
    // Check version
    if (payload.ver !== TOKEN_VERSION) {
      return { valid: false, error: 'TOKEN_VERSION_MISMATCH' };
    }
    
    return { valid: true, payload };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'TOKEN_EXPIRED' };
    }
    if (err.name === 'JsonWebTokenError') {
      return { valid: false, error: 'TOKEN_INVALID' };
    }
    return { valid: false, error: 'TOKEN_VERIFICATION_FAILED' };
  }
}

/**
 * Decode token without verification (for inspection)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token is within grace period (for offline use)
 */
export function isWithinGracePeriod(payload: TokenPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  const graceEnd = payload.iat + payload.grace;
  return now <= graceEnd;
}

// ===========================================
// FINGERPRINT FUZZY MATCHING
// ===========================================

export interface FingerprintComponents {
  // Core (weight 3) - must match
  cores?: number;
  memory?: number;
  platform?: string;
  gpu?: string;
  
  // Stable (weight 2) - should mostly match
  screen?: string;
  colorDepth?: number;
  touchPoints?: number;
  canvas?: string;
  audio?: string;
  
  // Soft (weight 1) - can change
  timezone?: string;
  language?: string;
  pixelRatio?: number;
}

/**
 * Calculate similarity score between two fingerprints
 * Returns a score from 0 to 100
 * 
 * Core components (cores, memory, platform, gpu) = 60% of score
 * Stable components (screen, canvas, audio) = 30% of score
 * Soft components (timezone, language, pixelRatio) = 10% of score
 */
export function calculateFingerprintSimilarity(
  stored: FingerprintComponents,
  current: FingerprintComponents
): { score: number; mismatches: string[] } {
  const mismatches: string[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;
  
  // Core components (weight 3 each = 12 total out of ~20)
  const coreComponents: (keyof FingerprintComponents)[] = ['cores', 'memory', 'platform', 'gpu'];
  for (const key of coreComponents) {
    totalWeight += 3;
    if (stored[key] !== undefined && current[key] !== undefined) {
      if (String(stored[key]) === String(current[key])) {
        matchedWeight += 3;
      } else {
        mismatches.push(`${key}: ${stored[key]} → ${current[key]}`);
      }
    } else if (stored[key] === undefined) {
      // If stored doesn't have it, give benefit of doubt
      matchedWeight += 3;
    }
  }
  
  // Stable components (weight 2 each = 10 total)
  const stableComponents: (keyof FingerprintComponents)[] = ['screen', 'colorDepth', 'touchPoints', 'canvas', 'audio'];
  for (const key of stableComponents) {
    totalWeight += 2;
    if (stored[key] !== undefined && current[key] !== undefined) {
      if (String(stored[key]) === String(current[key])) {
        matchedWeight += 2;
      } else {
        // For audio, allow small variations (different decimal places)
        if (key === 'audio') {
          const storedAudio = parseFloat(String(stored[key])) || 0;
          const currentAudio = parseFloat(String(current[key])) || 0;
          if (Math.abs(storedAudio - currentAudio) < 1) {
            matchedWeight += 2; // Close enough
          } else {
            mismatches.push(`${key}: ${stored[key]} → ${current[key]}`);
          }
        } else {
          mismatches.push(`${key}: ${stored[key]} → ${current[key]}`);
        }
      }
    } else if (stored[key] === undefined) {
      matchedWeight += 2;
    }
  }
  
  // Soft components (weight 1 each = 3 total)
  const softComponents: (keyof FingerprintComponents)[] = ['timezone', 'language', 'pixelRatio'];
  for (const key of softComponents) {
    totalWeight += 1;
    if (stored[key] !== undefined && current[key] !== undefined) {
      if (String(stored[key]) === String(current[key])) {
        matchedWeight += 1;
      } else {
        // Don't add soft mismatches to the list - they're expected to change
      }
    } else {
      matchedWeight += 1;
    }
  }
  
  const score = Math.round((matchedWeight / totalWeight) * 100);
  return { score, mismatches };
}

/**
 * Check if fingerprint is similar enough (threshold: 70% by default)
 * This allows users to change display settings, timezone, etc.
 * while still blocking different hardware
 */
export function isFingerprintSimilar(
  stored: FingerprintComponents,
  current: FingerprintComponents,
  threshold: number = 70
): { similar: boolean; score: number; mismatches: string[] } {
  const { score, mismatches } = calculateFingerprintSimilarity(stored, current);
  return {
    similar: score >= threshold,
    score,
    mismatches,
  };
}
