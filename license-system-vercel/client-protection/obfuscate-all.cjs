const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const extensionDir = path.join(__dirname, '../../extension');
const backupDir = path.join(__dirname, '../../extension-backup');

// Files to obfuscate
const filesToObfuscate = [
  'content.js',
  'popup.js',
  'injected.js'
];

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersChainedCalls: false,
  stringArrayWrappersParametersMaxCount: 2,
  stringArrayWrappersType: 'variable',
  stringArrayThreshold: 0.5,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
};

console.log('🔒 Obfuscating all extension JavaScript files...\n');

// Create backup
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('📦 Creating backup at:', backupDir);
  filesToObfuscate.forEach(file => {
    const source = path.join(extensionDir, file);
    const dest = path.join(backupDir, file);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, dest);
      console.log(`   ✓ Backed up ${file}`);
    }
  });
  console.log();
}

// Obfuscate each file
filesToObfuscate.forEach(filename => {
  const filePath = path.join(extensionDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filename} not found, skipping...`);
    return;
  }
  
  console.log(`🔐 Obfuscating ${filename}...`);
  
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions).getObfuscatedCode();
  
  fs.writeFileSync(filePath, obfuscatedCode);
  
  const originalSize = (sourceCode.length / 1024).toFixed(2);
  const obfuscatedSize = (obfuscatedCode.length / 1024).toFixed(2);
  
  console.log(`   Original: ${originalSize} KB`);
  console.log(`   Obfuscated: ${obfuscatedSize} KB`);
  console.log(`   ✅ Done\n`);
});

console.log('✨ All files obfuscated successfully!');
console.log('📁 Original files backed up to:', backupDir);
console.log('\n⚠️  To restore originals: copy files from extension-backup/ back to extension/');
