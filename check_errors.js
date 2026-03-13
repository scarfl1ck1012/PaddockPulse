const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint.json', 'utf16le').replace(/^\uFEFF/, '')); // vite output is in utf16le normally when piped in PS
// Wait if it was written by eslint maybe it's utf8? Let's try both
try {
    const data8 = JSON.parse(fs.readFileSync('eslint.json', 'utf8'));
    data8.forEach(file => { if(file.errorCount > 0) { console.log(file.filePath); file.messages.forEach(m => console.log(`  ${m.line}:${m.column} ${m.message}`)) } });
} catch(e) {
    const data16 = JSON.parse(fs.readFileSync('eslint.json', 'utf16le').replace(/^\uFEFF/, ''));
    data16.forEach(file => { if(file.errorCount > 0) { console.log(file.filePath); file.messages.forEach(m => console.log(`  ${m.line}:${m.column} ${m.message}`)) } });
}
