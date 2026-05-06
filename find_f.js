const fs = require('fs');
const bundle = fs.readFileSync('bundle.js', 'utf8');

// Find where f is defined near f.S
const idx = bundle.indexOf('Ft=f.S;f.S=function');
if (idx > 0) {
  // Get more context - 2000 chars before
  const start = Math.max(0, idx - 2000);
  const context = bundle.substring(start, idx + 500);
  console.log('=== CONTEXT AROUND f.S ===');
  console.log(context);
}
