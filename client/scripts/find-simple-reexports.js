const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, fileList);
    else if (full.endsWith('.js')) fileList.push(full);
  }
  return fileList;
}

function isSimpleReexport(file) {
  const content = fs.readFileSync(file, 'utf8').trim();
  // allow an initial comment block
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // remove leading single-line comments
  while (lines.length && lines[0].startsWith('//')) lines.shift();
  // now should be a single line like: export { default } from './Foo.tsx';
  if (lines.length !== 1) return false;
  const l = lines[0];
  return /^export\s*\{\s*default\s*\}\s*from\s*['"][.\/]?[^'\"]+['"];?$/.test(l);
}

function main() {
  const src = path.join(__dirname, '..', 'src');
  const files = walk(src);
  const matches = [];
  for (const f of files) if (isSimpleReexport(f)) matches.push(f);
  console.log(matches.join('\n'));
}

main();
