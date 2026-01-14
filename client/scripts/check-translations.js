const fs = require('fs');
const path = require('path');

// Recursively collect source files
function walk(dir, extRegex, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, extRegex, fileList);
    else if (extRegex.test(full)) fileList.push(full);
  }
  return fileList;
}

function extractKeysFromSource(file) {
  const content = fs.readFileSync(file, 'utf8');
  const re = /t\(\s*['"]([^'"]+)['"]/g;
  const keys = new Set();
  let m;
  while ((m = re.exec(content))) keys.add(m[1]);
  return keys;
}

function flatten(obj, prefix = '') {
  const res = [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      res.push(...flatten(v, key));
    } else {
      res.push(key);
    }
  }
  return res;
}

function main() {
  const src = path.join(__dirname, '..', 'src');
  const files = walk(src, /\.(js|jsx|ts|tsx)$/);

  const usedKeys = new Set();
  for (const f of files) {
    const keys = extractKeysFromSource(f);
    keys.forEach(k => {
      // filter out strings that are not translation keys (e.g. URLs)
      if (k && k.includes('.')) usedKeys.add(k);
    });
  }

  const localesDir = path.join(src, 'locales');
  const locales = fs.readdirSync(localesDir).filter(d => fs.statSync(path.join(localesDir, d)).isDirectory());

  const report = {};
  for (const loc of locales) {
    const file = path.join(localesDir, loc, 'translation.json');
    if (!fs.existsSync(file)) continue;
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const keys = new Set(flatten(json));
    report[loc] = {
      missing: [],
      total: keys.size,
    };
    for (const k of usedKeys) {
      if (!keys.has(k)) report[loc].missing.push(k);
    }
  }

  console.log('Translation coverage report:');
  for (const loc of Object.keys(report)) {
    const r = report[loc];
    console.log(`- ${loc}: ${r.missing.length} missing keys`);
    if (r.missing.length) console.log('  Missing keys:', r.missing.slice(0, 20));
  }
  // exit with non-zero if any missing
  const totalMissing = Object.values(report).reduce((s, r) => s + r.missing.length, 0);
  process.exit(totalMissing > 0 ? 2 : 0);
}

main();
