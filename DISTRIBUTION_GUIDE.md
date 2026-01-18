# Distribution Guide - Google Maps Lead Extractor

## What to Send to Clients

### Option 1: Extension Folder (Unpacked)
Send the entire **`extension/`** folder as a `.zip` file:

```
extension.zip
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── content.css
├── injected.js
├── license.js          ← OBFUSCATED (137KB)
└── icons/
```

**Installation Instructions for Clients:**
1. Unzip the folder
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` folder
6. Enter their license key when prompted

### Option 2: Packaged Extension (.crx) - RECOMMENDED
Package as a Chrome extension file for easier distribution:

1. Go to `chrome://extensions`
2. Enable Developer mode
3. Click "Pack extension"
4. Select the `extension` folder
5. You'll get `extension.crx` and `extension.pem`
6. **KEEP the .pem file private** (for updates)
7. Send only the `.crx` file to clients

**Installation for Clients:**
- Drag and drop the `.crx` file into `chrome://extensions`

---

## Security Status

### ✅ ALL FILES OBFUSCATED (Maximum Security)
- **license.js** (137KB) - License validation & API calls
- **content.js** (238KB) - Floating panel & extraction logic  
- **popup.js** (132KB) - Extension popup & settings
- **injected.js** (25KB) - XHR interception

All JavaScript is now heavily obfuscated with:
- String encryption (base64)
- Control flow flattening
- Dead code injection
- Self-defending code
- Identifier mangling

### ⚠️ Readable Files (Required by Chrome)
- **manifest.json** - Extension configuration (must be readable)
- **popup.html** - UI structure (no sensitive data)
- **content.css** - Styling (no logic)

**Security Level: MAXIMUM** 🔒
- Extremely difficult to reverse engineer
- All business logic protected
- Server-side validation as final defense

---

## License Management

### Creating Licenses for Customers
```powershell
# Create a license via API
$body = '{"plan":"lifetime","customer_email":"customer@email.com","max_activations":2}'
$headers = @{
    "Authorization"="Bearer 9648863336489b82ca173af4f17000afca1abc9a1c1de33e3fd7"
    "Content-Type"="application/json"
}
Invoke-RestMethod -Uri "https://gle-two.vercel.app/api/v1/admin/licenses/create" `
    -Method POST -Headers $headers -Body $body
```

### Recommended Settings
- **Monthly plan**: `max_activations: 1` (single device)
- **Yearly plan**: `max_activations: 2` (2 devices)
- **Lifetime plan**: `max_activations: 3` (3 devices)

---

## Admin Dashboard Access

**API Base URL:** `https://gle-two.vercel.app`

**Admin Secret:** `9648863336489b82ca173af4f17000afca1abc9a1c1de33e3fd7`

### Available Endpoints
- `POST /api/v1/admin/licenses/create` - Create new license
- `GET /api/v1/admin/licenses/{id}` - Get license details
- `POST /api/v1/admin/licenses/{id}/revoke` - Revoke license
- `GET /api/v1/admin/activations/{licenseId}` - View activations

---

## Updates & Maintenance

### To Update the Extension
1. Make changes to extension files
2. If you modified license client:
   ```bash
   cd license-system-vercel/client-protection
   npm run build -- --api-url https://gle-two.vercel.app
   cp dist/license-client.min.js ../../extension/license.js
   ```
3. Increment version in `manifest.json`
4. Repackage with the SAME `.pem` file
5. Send updated `.crx` to clients

### To Update License Server
```bash
cd license-system-vercel
vercel --prod
```

---

## Pricing Suggestions

- **Monthly:** $29/month (1 device)
- **Yearly:** $199/year (2 devices, save 43%)
- **Lifetime:** $499 one-time (3 devices, unlimited)

---

## Support & Troubleshooting

### Common Issues
1. **"Maximum activations reached"**
   - Customer tried to use on too many devices
   - Solution: Increase `max_activations` or revoke old activations

2. **"Connection error"**
   - API server down or internet issue
   - Check: `https://gle-two.vercel.app/api/route`

3. **"License expired"**
   - Monthly/yearly license expired
   - Customer needs to renew

---

## Files You Keep Private
- `license-system-vercel/` - Your license server code
- `extension-backup/` - Original readable source code (for development)
- `extension.pem` - Extension signing key
- `ADMIN_SECRET` - Never share this!
- Turso database credentials

## Files You Distribute
- `extension.crx` OR `extension.zip` (all .js files are obfuscated)
- Installation instructions
- License key (per customer)

---

## Development Workflow

### To Make Changes (Use Original Files)
1. Edit files in `extension-backup/` folder (readable versions)
2. Copy to `extension/` folder
3. Test your changes
4. When ready to distribute, run obfuscation:
   ```bash
   cd license-system-vercel/client-protection
   node obfuscate-all.cjs
   ```

### To Restore Original Files
```bash
# Copy from backup
cp extension-backup/*.js extension/
```

**Note:** Never edit the obfuscated files directly - they're unreadable!
