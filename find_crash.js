const fs = require('fs');

// Read the bundle
const bundle = fs.readFileSync('bundle.js', 'utf8');
const lines = bundle.split('\n');

// The crash is at line 1, column 138361
// Find context around that column
const line = lines[0];
console.log('Line 1 length:', line.length);

if (line.length > 138361) {
  const start = Math.max(0, 138361 - 500);
  const end = Math.min(line.length, 138361 + 500);
  const context = line.substring(start, end);
  console.log('\n=== CONTEXT AROUND CRASH ===\n');
  console.log(context);
} else {
  // Try other lines
  console.log('Checking all lines for column 138361...');
  let col = 0;
  for (let i = 0; i < lines.length; i++) {
    if (col + lines[i].length >= 138361) {
      const localCol = 138361 - col;
      const start = Math.max(0, localCol - 300);
      const end = Math.min(lines[i].length, localCol + 300);
      console.log('Found at line', i+1, 'local col', localCol);
      console.log(lines[i].substring(start, end));
      break;
    }
    col += lines[i].length + 1;
  }
}
