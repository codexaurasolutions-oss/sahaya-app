const fs = require('fs');
const path = require('path');

const packages = [
  'react',
  'react-native', 
  'react-dom',
  'react-reconciler',
  'scheduler',
  'react-redux',
  'redux',
];

packages.forEach(pkg => {
  try {
    const pkgPath = path.join('node_modules', pkg, 'package.json');
    const info = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`${pkg}: ${info.version}`);
  } catch(e) {
    console.log(`${pkg}: NOT FOUND`);
  }
});
