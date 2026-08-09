const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\abono\\.gemini\\antigravity-ide\\brain\\94753cd5-cbda-488d-bed1-e0125ba7986d\\media__1786038593326.jpg';
const dest1 = path.join(__dirname, 'public', 'logo.png');
const dest2 = path.join(__dirname, 'public', 'favicon.ico');
fs.copyFileSync(src, dest1);
fs.copyFileSync(src, dest2);
console.log('Logo copied successfully to public/logo.png and public/favicon.ico!');
