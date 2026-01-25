/**
 * MapsReach Extension - Obfuscation Build Script
 * 
 * This script obfuscates all JavaScript files to protect the extraction logic
 * while keeping the extension functional.
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Source and output directories
const SRC_DIR = path.join(__dirname, '..', 'old-backup');
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Files to obfuscate
const JS_FILES = [
  'content.js',
  'injected.js',
  'popup.js',
  'background.js',
  'license.js',
  'trial-system.js'
];

// Files to copy without modification
const COPY_FILES = [
  'manifest.json',
  'popup.html',
  'content.css'
];

// Directories to copy
const COPY_DIRS = [
  'icons'
];

// High-security obfuscation settings
const OBFUSCATION_OPTIONS = {
  // Control flow flattening - makes code logic harder to follow
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  
  // Dead code injection - adds fake code paths
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  
  // String encoding - hides string literals
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.75,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersType: 'function',
  
  // Identifier renaming - replaces variable/function names
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false, // Keep false for Chrome extension compatibility
  
  // Split strings into chunks
  splitStrings: true,
  splitStringsChunkLength: 5,
  
  // Unicode escape sequences
  unicodeEscapeSequence: true,
  
  // Self defending - breaks if code is formatted/beautified
  selfDefending: true,
  
  // Disable console output
  disableConsoleOutput: true,
  
  // Transform object keys
  transformObjectKeys: true,
  
  // Numbers to expressions
  numbersToExpressions: true,
  
  // Debug protection (makes debugging harder)
  debugProtection: false, // Keep false - can cause issues in extensions
  
  // Domain lock - optional, can lock to specific domains
  // domainLock: ['www.google.com', 'maps.google.com'],
  
  // Source map (keep false for production)
  sourceMap: false,
  
  // Target - browser
  target: 'browser',
  
  // Preserve some functionality
  reservedNames: ['^chrome$', '^browser$', '^window$', '^document$'],
  reservedStrings: ['chrome', 'storage', 'runtime', 'sendMessage'],
};

// Lighter obfuscation for background.js (service worker has limitations)
const BACKGROUND_OPTIONS = {
  ...OBFUSCATION_OPTIONS,
  selfDefending: false,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: false,
  disableConsoleOutput: false, // Keep console for debugging service worker issues
};

// Create dist directory
function createDistDir() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  console.log('✓ Created dist directory');
}

// Copy file
function copyFile(filename) {
  const src = path.join(SRC_DIR, filename);
  const dest = path.join(DIST_DIR, filename);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied: ${filename}`);
  } else {
    console.log(`⚠ File not found: ${filename}`);
  }
}

// Copy directory recursively
function copyDir(dirname) {
  const src = path.join(SRC_DIR, dirname);
  const dest = path.join(DIST_DIR, dirname);
  
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`✓ Copied directory: ${dirname}`);
  } else {
    console.log(`⚠ Directory not found: ${dirname}`);
  }
}

// Obfuscate a JavaScript file
function obfuscateFile(filename) {
  const src = path.join(SRC_DIR, filename);
  const dest = path.join(DIST_DIR, filename);
  
  if (!fs.existsSync(src)) {
    console.log(`⚠ File not found: ${filename}`);
    return;
  }
  
  const code = fs.readFileSync(src, 'utf8');
  const originalSize = code.length;
  
  // Use lighter options for background.js
  const options = filename === 'background.js' ? BACKGROUND_OPTIONS : OBFUSCATION_OPTIONS;
  
  try {
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode();
    const obfuscatedSize = obfuscatedCode.length;
    
    fs.writeFileSync(dest, obfuscatedCode);
    
    const ratio = ((obfuscatedSize / originalSize) * 100).toFixed(1);
    console.log(`✓ Obfuscated: ${filename} (${(originalSize/1024).toFixed(1)}KB → ${(obfuscatedSize/1024).toFixed(1)}KB, ${ratio}%)`);
  } catch (error) {
    console.error(`✗ Error obfuscating ${filename}:`, error.message);
    // Copy original file as fallback
    fs.copyFileSync(src, dest);
    console.log(`  → Copied original as fallback`);
  }
}

// Update manifest for production
function updateManifest() {
  const manifestPath = path.join(DIST_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Update name for production
  manifest.name = 'MapsReach - Google Maps Lead Extractor';
  manifest.description = 'Extract business leads from Google Maps with one click. Export to CSV or Google Sheets instantly.';
  
  // Remove "(Proxy Test)" from name
  // manifest.version stays the same
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Updated manifest.json for production');
}

// Main build process
async function build() {
  console.log('\n🔒 MapsReach Extension - Obfuscation Build\n');
  console.log('='.repeat(50));
  
  // Step 1: Create dist directory
  createDistDir();
  
  // Step 2: Copy static files
  console.log('\n📄 Copying static files...');
  COPY_FILES.forEach(copyFile);
  
  // Step 3: Copy directories
  console.log('\n📁 Copying directories...');
  COPY_DIRS.forEach(copyDir);
  
  // Step 4: Obfuscate JavaScript files
  console.log('\n🔐 Obfuscating JavaScript files...');
  JS_FILES.forEach(obfuscateFile);
  
  // Step 5: Update manifest
  console.log('\n📝 Updating manifest...');
  updateManifest();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Build complete! Output in: dist/');
  console.log('\n📦 Next steps:');
  console.log('   1. Test the extension from dist/ folder');
  console.log('   2. Create a ZIP file of dist/ for submission');
  console.log('   3. Submit to Chrome Web Store & Edge Add-ons\n');
}

build().catch(console.error);
