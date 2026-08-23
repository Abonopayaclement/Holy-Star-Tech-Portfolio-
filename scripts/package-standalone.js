const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const nextDir = path.join(rootDir, '.next');
const standaloneDir = path.join(nextDir, 'standalone');
const staticSrcDir = path.join(nextDir, 'static');
const staticDestDir = path.join(standaloneDir, '.next', 'static');
const publicSrcDir = path.join(rootDir, 'public');
const publicDestDir = path.join(standaloneDir, 'public');
const zipDestFile = path.join(rootDir, 'holy-star-tech-deploy.zip');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const children = fs.readdirSync(src);
    for (const child of children) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function countFiles(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return count;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

console.log('---------------------------------------------------------');
console.log(' Holy Star Tech - Next.js Standalone Deployment Packager');
console.log('---------------------------------------------------------');

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ Error: .next/standalone folder not found. Please run "npm run build" first.');
  process.exit(1);
}

// 1. Copy .next/static to .next/standalone/.next/static
console.log('📦 Step 1: Copying .next/static into .next/standalone/.next/static...');
copyRecursiveSync(staticSrcDir, staticDestDir);
const staticCount = countFiles(staticDestDir);
console.log(`✅ Successfully copied ${staticCount} static files (CSS, chunks, media).`);

// 2. Copy public to .next/standalone/public
console.log('📦 Step 2: Copying public/ into .next/standalone/public...');
copyRecursiveSync(publicSrcDir, publicDestDir);
const publicCount = countFiles(publicDestDir);
console.log(`✅ Successfully copied ${publicCount} public asset files.`);

// 3. Copy custom production server.js into .next/standalone/server.js
console.log('📦 Step 3: Copying robust production server.js into .next/standalone/server.js...');
const customServerSrc = path.join(rootDir, 'server.js');
const standaloneServerDest = path.join(standaloneDir, 'server.js');
fs.copyFileSync(customServerSrc, standaloneServerDest);
console.log('✅ Updated standalone server.js with production wrapper.');

// 4. Create tmp/restart.txt for Passenger restart detection
const tmpDir = path.join(standaloneDir, 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}
fs.writeFileSync(path.join(tmpDir, 'restart.txt'), String(Date.now()));
console.log('✅ Created tmp/restart.txt for Passenger.');

// 5. Check for .env file
const envSrc = path.join(rootDir, '.env');
const envDest = path.join(standaloneDir, '.env');
if (fs.existsSync(envSrc)) {
  console.log('📄 Step 5: Copying .env into .next/standalone/.env...');
  fs.copyFileSync(envSrc, envDest);
  console.log('✅ Copied .env file.');
}

// 4. Create ZIP package for cPanel upload
console.log('📦 Step 4: Creating deployment zip archive: holy-star-tech-deploy.zip...');
if (fs.existsSync(zipDestFile)) {
  fs.unlinkSync(zipDestFile);
}

try {
  const psCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${standaloneDir.replace(/\\/g, '\\\\')}', '${zipDestFile.replace(/\\/g, '\\\\')}', [System.IO.Compression.CompressionLevel]::Optimal, $false)"`;
  cp.execSync(psCmd, { stdio: 'inherit' });
  const zipSizeMb = (fs.statSync(zipDestFile).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Deployment zip successfully created: holy-star-tech-deploy.zip (${zipSizeMb} MB)`);
} catch (err) {
  console.error('❌ Failed to create zip with .NET ZipFile:', err.message);
}

console.log('\n=========================================================');
console.log('🎉 STANDALONE PRODUCTION BUILD READY FOR DEPLOYMENT!');
console.log('=========================================================');
console.log('Upload "holy-star-tech-deploy.zip" to cPanel File Manager and extract');
console.log('directly into your Application Root: repositories/Holy-Star-Tech-Portfolio-');
console.log('=========================================================\n');
