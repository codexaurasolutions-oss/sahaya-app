const fs = require('fs');
const bundle = fs.readFileSync('bundle.js', 'utf8');

// Find all occurrences of .S property access pattern from localized-strings
const patterns = [
  /this\._S\b/g,
  /\.S\s*=/g, 
  /getInterfaceLanguage/g,
  /ReactLocalization/g,
  /localized-strings/g,
  /react-native-localization/g,
  /react-localization/g,
];

patterns.forEach(pattern => {
  const matches = bundle.match(pattern);
  if (matches) {
    console.log(`Pattern ${pattern}: ${matches.length} matches`);
    // Find first occurrence with context
    const idx = bundle.search(pattern);
    if (idx > 0) {
      console.log('Context:', bundle.substring(Math.max(0, idx-100), idx+200));
      console.log('---');
    }
  } else {
    console.log(`Pattern ${pattern}: NO MATCHES`);
  }
});
