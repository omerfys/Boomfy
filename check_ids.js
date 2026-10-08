const fs = require('fs');
const js = fs.readFileSync('_app/index-vvf5n08v.js', 'utf8');

const regex = /w\("([^"]+)"\)/g;
const ids = new Set();
let m;
while ((m = regex.exec(js)) !== null) {
  ids.add(m[1]);
}
console.log('Referenced IDs in JS:\n', Array.from(ids).sort());

// Check which of these are missing in index.html
const html = fs.readFileSync('index.html', 'utf8');
const missing = [];
for (const id of ids) {
  if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
    missing.push(id);
  }
}
console.log('\nMissing IDs in index.html:\n', missing);
