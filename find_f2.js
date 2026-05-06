const fs = require('fs');
const bundle = fs.readFileSync('bundle.js', 'utf8');

const idx = bundle.indexOf('Ft=f.S;f.S=function');
// Get 5000 chars before to find where f is defined
const start = Math.max(0, idx - 5000);
const context = bundle.substring(start, idx + 100);

// Find last assignment to f
const fAssignments = [];
const regex = /\bf\s*=\s*[^=]/g;
let match;
const searchArea = bundle.substring(start, idx);
while ((match = regex.exec(searchArea)) !== null) {
  fAssignments.push({
    pos: match.index,
    text: searchArea.substring(match.index, match.index + 100)
  });
}

console.log('Last 3 f assignments before f.S:');
fAssignments.slice(-3).forEach(m => console.log(m.text + '\n---'));
