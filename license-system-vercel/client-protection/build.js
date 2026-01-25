#!/usr/bin/env node

/**
 * Build script for obfuscating the license client
 * 
 * Usage:
 *   node build.js                    # Production build
 *   node build.js --debug            # Debug build (no obfuscation)
 *   node build.js --api-url https://your-api.com  # Set API URL
 */

import { build } from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isDebug = args.includes('--debug');
const apiUrlIndex = args.indexOf('--api-url');
const apiUrl = apiUrlIndex !== -1 ? args[apiUrlIndex + 1] : 'https://your-license-api.vercel.app';

console.log('🔧 Building license client...');
console.log(`   Mode: ${isDebug ? 'Debug' : 'Production'}`);
console.log(`   API URL: ${apiUrl}`);

// Ensure output directory exists
const outputDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function buildClient() {
  try {
    // Step 1: Bundle with esbuild
    console.log('\n📦 Bundling with esbuild...');
    
    const result = await build({
      entryPoints: [path.join(__dirname, 'src', 'license-client.js')],
      bundle: true,
      format: 'iife',
      globalName: 'LicenseClientBundle',
      write: false,
      minify: !isDebug,
      target: ['es2020'],
      define: {
        '__API_BASE_URL__': `"${apiUrl}"`,
      },
    });
    
    let code = result.outputFiles[0].text;
    
    // Replace placeholder with actual API URL
    code = code.replace(/"__API_BASE_URL__"/g, `"${apiUrl}"`);
    
    // Step 2: Obfuscate (if not debug mode)
    if (!isDebug) {
      console.log('🔒 Obfuscating code...');
      
      const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: false, // Keep console for errors
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false, // Keep LicenseClient accessible
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64', 'rc4'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
      });
      
      code = obfuscationResult.getObfuscatedCode();
    }
    
    // Step 3: Write output files
    const outputPath = path.join(outputDir, isDebug ? 'license-client.debug.js' : 'license-client.min.js');
    fs.writeFileSync(outputPath, code);
    
    console.log(`\n✅ Build complete!`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Size: ${(code.length / 1024).toFixed(2)} KB`);
    
    // Also create a snippet for easy integration
    const snippet = `
<!-- License Client Integration -->
<script src="license-client.min.js"></script>
<script>
  // Initialize license client
  const licenseClient = new LicenseClient();
  
  // Set up event handlers
  licenseClient
    .on('onValid', (data) => {
      console.log('License valid:', data.plan);
      // Enable your features here
    })
    .on('onInvalid', (data) => {
      console.log('License invalid:', data.reason);
      // Show activation prompt
    })
    .on('onExpired', () => {
      console.log('License expired');
      // Show renewal prompt
    })
    .on('onError', (err) => {
      console.error('License error:', err.message);
    });
  
  // Check existing license on startup
  licenseClient.init().then(result => {
    if (!result.valid) {
      // Prompt user for license key
      showActivationDialog();
    }
  });
  
  // Activation function
  async function activateLicense(key) {
    const result = await licenseClient.activate(key);
    if (result.success) {
      alert('License activated successfully!');
    } else {
      alert('Activation failed: ' + result.message);
    }
  }
</script>
`.trim();
    
    fs.writeFileSync(path.join(outputDir, 'integration-example.html'), snippet);
    console.log(`   Example: ${path.join(outputDir, 'integration-example.html')}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildClient();
