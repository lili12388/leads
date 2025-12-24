# License System for Browser Extensions

A complete licensing system for browser extensions with server-side validation, device binding, and anti-piracy protection.

## Features

- 🔐 **Secure License Keys** - SHA-256 hashed at rest, never stored in plaintext
- 🖥️ **Device Binding** - Extension ID + fingerprint binding to prevent sharing
- ⏰ **Grace Period** - 24-hour offline operation during network issues
- 🔄 **Token Refresh** - Automatic token renewal before expiry
- 📊 **Admin Dashboard** - CLI tool for license management
- 🛡️ **Anti-Tampering** - Code obfuscation with javascript-obfuscator
- 📈 **Suspicious Activity Tracking** - Auto-revocation for abuse

## Quick Start

### 1. Deploy to Vercel

```bash
# Clone and install
cd license-system-vercel
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local
# Edit .env.local with your values

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Deploy to Vercel
vercel
```

### 2. Configure Environment

Create a `.env` file with:

```env
# Database (Supabase Postgres recommended)
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# JWT Secret (generate a random 64-char string)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Admin Secret (for CLI and admin API)
ADMIN_SECRET="your-admin-secret-key"

# Rate Limiting (optional - uses DB fallback if not set)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Grace period in seconds (default 24 hours)
GRACE_PERIOD_SECONDS=86400

# Auto-revoke threshold for suspicious activity
MAX_SUSPICIOUS_SCORE=10
```

### 3. Set Up Admin CLI

```bash
cd admin-cli
npm install

# Set environment
export API_BASE_URL=https://your-api.vercel.app
export ADMIN_SECRET=your-admin-secret

# Create a license
node index.js create --plan monthly --email customer@example.com
```

### 4. Build Client Protection

```bash
cd client-protection
npm install

# Build obfuscated client
npm run build -- --api-url https://your-api.vercel.app
```

## API Reference

### Public Endpoints

#### POST `/api/v1/license/activate`

Activate a license key on a device.

**Request:**
```json
{
  "license_key": "LIC-XXXX-XXXX-XXXX-XXXX",
  "extension_id": "chrome-extension-id",
  "fingerprint_hash": "device-fingerprint-hash",
  "client": {
    "browser": "Chrome",
    "os": "Windows",
    "timezone": "America/New_York",
    "language": "en-US"
  }
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": 1704067200,
  "grace_seconds": 86400,
  "plan": "monthly",
  "max_activations": 2,
  "current_activations": 1,
  "slot_index": 0
}
```

**Error Codes:**
- `LICENSE_NOT_FOUND` (404)
- `LICENSE_REVOKED` (403)
- `LICENSE_EXPIRED` (403)
- `LICENSE_MAX_ACTIVATIONS_REACHED` (403)
- `RATE_LIMITED` (429)

#### POST `/api/v1/license/validate`

Validate an existing token.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "extension_id": "chrome-extension-id",
  "fingerprint_hash": "device-fingerprint-hash"
}
```

**Response (200):**
```json
{
  "valid": true,
  "plan": "monthly",
  "expires_at": 1704067200,
  "grace_active": false,
  "grace_seconds_remaining": 0,
  "refreshed_token": "eyJhbGciOiJIUzI1NiIs..." // Optional
}
```

**Error Codes:**
- `TOKEN_INVALID` (401)
- `DEVICE_MISMATCH` (403)
- `LICENSE_REVOKED` (403)
- `LICENSE_EXPIRED` (403)

### Admin Endpoints

All admin endpoints require `Authorization: Bearer <ADMIN_SECRET>` header.

#### POST `/api/v1/admin/licenses/create`

Create a new license.

**Request:**
```json
{
  "plan": "monthly",
  "max_activations": 2,
  "expires_at": "2024-12-31T23:59:59Z",
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "notes": "Purchased via website"
}
```

**Response:**
```json
{
  "success": true,
  "license_key": "LIC-XXXX-XXXX-XXXX-XXXX",
  "license_id": "uuid",
  "plan": "monthly",
  "max_activations": 2,
  "expires_at": "2024-12-31T23:59:59.000Z",
  "status": "active"
}
```

#### GET `/api/v1/admin/licenses/create`

List all licenses (paginated).

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50, max: 100)
- `status` - Filter by status (active, revoked, expired)
- `plan` - Filter by plan
- `search` - Search by email or name

#### POST `/api/v1/admin/licenses/revoke`

Revoke a license.

**Request:**
```json
{
  "license_id": "uuid",
  "reason": "Chargeback"
}
```

#### POST `/api/v1/admin/licenses/reset-activations`

Reset all activations for a license.

**Request:**
```json
{
  "license_id": "uuid",
  "reason": "Customer support request"
}
```

#### GET `/api/v1/admin/licenses/[id]/status`

Get detailed status of a license.

#### GET `/api/v1/admin/licenses/[id]/audit`

Get audit log for a license.

#### GET `/api/v1/admin/stats`

Get system statistics.

## Admin CLI Usage

```bash
# Create license
license-admin create --plan yearly --email user@example.com

# List licenses
license-admin list --status active --plan monthly

# Get license status
license-admin status <license-id>

# Revoke license
license-admin revoke <license-id> --reason "Refund requested"

# Reset activations
license-admin reset <license-id>

# View audit log
license-admin audit <license-id>

# System stats
license-admin stats
```

## Extension Integration

### 1. Add License Client

Copy the obfuscated `license-client.min.js` to your extension folder.

### 2. Add to Manifest

```json
{
  "permissions": ["storage"],
  "content_scripts": [
    {
      "js": ["license-client.min.js", "your-content.js"]
    }
  ]
}
```

### 3. Implement in Your Extension

```javascript
// Initialize license client
const license = new LicenseClient();

// Check license on startup
async function checkLicense() {
  const result = await license.init();
  
  if (!result.valid) {
    // Show activation UI
    showLicensePrompt();
    return false;
  }
  
  // License valid - enable features
  return true;
}

// Activate with key
async function activateLicense(key) {
  const result = await license.activate(key);
  
  if (result.success) {
    // Hide activation UI, enable features
    hideLicensePrompt();
    enableFeatures();
  } else {
    // Show error
    showError(result.message);
  }
}

// Event handlers
license
  .on('onValid', () => enableFeatures())
  .on('onInvalid', () => showLicensePrompt())
  .on('onExpired', () => showRenewalPrompt())
  .on('onError', (err) => console.error(err));
```

## Database Schema

```prisma
model License {
  id              String       @id @default(cuid())
  licenseKeyHash  String       @unique
  plan            String       @default("monthly")
  status          LicenseStatus @default(active)
  maxActivations  Int          @default(2)
  expiresAt       DateTime?
  customerEmail   String?
  customerName    String?
  notes           String?
  suspiciousScore Int          @default(0)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  activations     Activation[]
  auditLogs       AuditLog[]
}

model Activation {
  id              String    @id @default(cuid())
  licenseId       String
  extensionId     String
  fingerprintHash String
  slotIndex       Int
  isActive        Boolean   @default(true)
  lastValidatedAt DateTime?
  lastIp          String?
  clientBrowser   String?
  clientOs        String?
  clientTimezone  String?
  createdAt       DateTime  @default(now())
  
  license         License   @relation(...)
}
```

## Security Considerations

1. **Never expose ADMIN_SECRET** - Only use in server-side code and CLI
2. **Use HTTPS everywhere** - API calls must be encrypted
3. **Rate limiting** - Protects against brute-force attacks
4. **Fingerprint is soft** - Not for security, just anti-sharing deterrent
5. **Extension ID is primary** - Main binding mechanism
6. **Grace period** - Allows offline use, prevents false positives

## Troubleshooting

### "License not found" error
- Check license key format (LIC-XXXX-XXXX-XXXX-XXXX)
- Ensure database connection is working
- Check if license was revoked

### "Device mismatch" error
- User reinstalled extension (gets new ID)
- Use admin CLI to reset activations

### "Max activations reached" error
- User has used all slots
- Use admin CLI to deactivate old devices

### Rate limiting issues
- Default: 5 activations/min, 30 validations/min
- Configure Upstash Redis for production scale

## License

MIT - Use freely for your projects.
