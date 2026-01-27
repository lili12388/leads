import { createClient } from '@libsql/client';

let _db: ReturnType<typeof createClient> | null = null;

function createDbClient() {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL not set');
  }

  _db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return _db;
}

export function getDb() {
  if (!_db) return createDbClient();
  return _db;
}

// Initialize database tables
export async function initDatabase() {
  const db = getDb();

  await db.batch([
    // License table
    `CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      license_key_hash TEXT UNIQUE NOT NULL,
      license_key_plaintext TEXT,
      plan TEXT DEFAULT 'lifetime' CHECK(plan IN ('monthly', 'yearly', 'lifetime')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'revoked')),
      max_activations INTEGER DEFAULT 2,
      expires_at TEXT,
      customer_email TEXT,
      customer_name TEXT,
      notes TEXT,
      suspicious_score INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    
    // Activations table
    `CREATE TABLE IF NOT EXISTS activations (
      id TEXT PRIMARY KEY,
      license_id TEXT NOT NULL,
      extension_id TEXT NOT NULL,
      fingerprint_hash TEXT NOT NULL,
      fingerprint_components TEXT,
      slot_index INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      last_validated_at TEXT,
      last_ip TEXT,
      client_browser TEXT,
      client_os TEXT,
      client_timezone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
    )`,
    
    // Audit log table
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL,
      license_id TEXT,
      activation_id TEXT,
      ip TEXT,
      user_agent TEXT,
      details_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    
    // Rate limit table
    `CREATE TABLE IF NOT EXISTS rate_limits (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0,
      window_start TEXT DEFAULT (datetime('now'))
    )`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_licenses_hash ON licenses(license_key_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_activations_license ON activations(license_id)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_license ON audit_logs(license_id)`,
    
    // WhatsApp Sender Trial table - tracks trial usage by hardware ID
    `CREATE TABLE IF NOT EXISTS whatsapp_trials (
      id TEXT PRIMARY KEY,
      hardware_id TEXT UNIQUE NOT NULL,
      messages_sent INTEGER DEFAULT 0,
      max_messages INTEGER DEFAULT 10,
      is_locked INTEGER DEFAULT 0,
      license_id TEXT,
      license_activated_at TEXT,
      first_seen_at TEXT DEFAULT (datetime('now')),
      last_seen_at TEXT DEFAULT (datetime('now')),
      last_ip TEXT,
      machine_name TEXT,
      os_info TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    
    // WhatsApp Sender Licenses table - separate from extension licenses
    `CREATE TABLE IF NOT EXISTS whatsapp_licenses (
      id TEXT PRIMARY KEY,
      license_key_hash TEXT UNIQUE NOT NULL,
      license_key_plaintext TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'revoked')),
      max_activations INTEGER DEFAULT 2,
      expires_at TEXT,
      customer_email TEXT,
      customer_name TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    
    // WhatsApp activations - tracks which hardware IDs activated which license
    `CREATE TABLE IF NOT EXISTS whatsapp_activations (
      id TEXT PRIMARY KEY,
      license_id TEXT NOT NULL,
      hardware_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      last_validated_at TEXT,
      last_ip TEXT,
      machine_name TEXT,
      os_info TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (license_id) REFERENCES whatsapp_licenses(id) ON DELETE CASCADE
    )`,
    
    // Index for WhatsApp tables
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_trials_hwid ON whatsapp_trials(hardware_id)`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_licenses_hash ON whatsapp_licenses(license_key_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_activations_license ON whatsapp_activations(license_id)`,
    
    // Download tracking table
    `CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      download_type TEXT NOT NULL CHECK(download_type IN ('chrome_extension', 'edge_extension', 'whatsapp_tool')),
      count INTEGER DEFAULT 0,
      last_download_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    
    // Page views tracking table  
    `CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY,
      page_path TEXT UNIQUE NOT NULL,
      view_count INTEGER DEFAULT 0,
      last_viewed_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    
    // Index for tracking tables
    `CREATE INDEX IF NOT EXISTS idx_downloads_type ON downloads(download_type)`,
    `CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path)`,
  ]);

  // Migration: Add license_key_plaintext column if it doesn't exist
  try {
    await db.execute(`ALTER TABLE licenses ADD COLUMN license_key_plaintext TEXT`);
  } catch (e) {
    // Column already exists, ignore error
  }
  
  // Initialize download counters if they don't exist
  try {
    await db.execute(`INSERT OR IGNORE INTO downloads (id, download_type, count) VALUES ('chrome', 'chrome_extension', 0)`);
    await db.execute(`INSERT OR IGNORE INTO downloads (id, download_type, count) VALUES ('edge', 'edge_extension', 0)`);
    await db.execute(`INSERT OR IGNORE INTO downloads (id, download_type, count) VALUES ('whatsapp', 'whatsapp_tool', 0)`);
  } catch (e) {
    // Ignore if already exists
  }
}

// Helper to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Expose legacy-friendly alias to reduce changes
export const db = {
  execute: (statement: any, params?: any) =>
    getDb().execute(statement as any, params as any),
  batch: (statements: any) => getDb().batch(statements as any),
};

export default db;
