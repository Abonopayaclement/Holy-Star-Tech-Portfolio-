`const cp = require('child_process');

const psCmd = `powershell - NoProfile - Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('holy-star-tech-deploy.zip'); $zip.Entries | Select-Object -Property FullName, Length | Out-String -Width 200"`;
const output = cp.execSync(psCmd, { encoding: 'utf8' });
const lines = output.split('\r\n').map(l => l.trim()).filter(Boolean);

const rootFiles = lines.filter(l => !l.includes('/') && !l.includes('\\') && (l.includes('server.js') || l.includes('package.json') || l.includes('.env')));
const staticCss = lines.filter(l => l.includes('.next/static/css') || l.includes('.next\\static\\css'));
const publicFiles = lines.filter(l => l.includes('public/') || l.includes('public\\'));

console.log('--- ZIP VERIFICATION SUMMARY ---');
console.log('Root files present:', rootFiles);
console.log('Static CSS files:', staticCss);
console.log('Public sample files:', publicFiles.slice(0, 5));
console.log('Total entries in zip:', lines.length);
