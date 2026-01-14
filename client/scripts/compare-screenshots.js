const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const root = path.join(__dirname, '..');
const baselineDir = path.join(root, 'screenshots', 'baseline');
const currentDir = path.join(root, 'screenshots');
const diffDir = path.join(root, 'screenshots', 'diffs');

if (!fs.existsSync(baselineDir)) {
  console.error('Baseline screenshots not found at', baselineDir);
  console.error('To create a baseline: run `npm run build` then `node scripts/screenshot-locales.js` and commit `client/screenshots` as `client/screenshots/baseline`.');
  process.exit(1);
}

if (!fs.existsSync(diffDir)) fs.mkdirSync(diffDir, { recursive: true });

const locales = fs.readdirSync(baselineDir).filter((d) => fs.lstatSync(path.join(baselineDir, d)).isDirectory());
let failed = [];

for (const locale of locales) {
  const baseLocaleDir = path.join(baselineDir, locale);
  const curLocaleDir = path.join(currentDir, locale);
  const outLocaleDir = path.join(diffDir, locale);
  if (!fs.existsSync(outLocaleDir)) fs.mkdirSync(outLocaleDir, { recursive: true });

  const files = fs.readdirSync(baseLocaleDir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const basePath = path.join(baseLocaleDir, file);
    const curPath = path.join(curLocaleDir, file);
    if (!fs.existsSync(curPath)) {
      failed.push({ locale, file, reason: 'missing_current' });
      continue;
    }

    const img1 = PNG.sync.read(fs.readFileSync(basePath));
    const img2 = PNG.sync.read(fs.readFileSync(curPath));
    if (img1.width !== img2.width || img1.height !== img2.height) {
      failed.push({ locale, file, reason: 'size_mismatch' });
      continue;
    }

    const { width, height } = img1;
    const diff = new PNG({ width, height });
    const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
    const percent = diffPixels / (width * height);
    const diffPath = path.join(outLocaleDir, file);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    // consider it a failure if more than 0.5% pixels differ
    if (percent > 0.005) {
      failed.push({ locale, file, reason: 'pixel_diff', percent: (percent * 100).toFixed(3) });
    }
  }
}

if (failed.length) {
  console.error('\nVisual regression detected:');
  failed.forEach((f) => {
    console.error(` - ${f.locale}/${f.file}: ${f.reason}` + (f.percent ? ` (${f.percent}% diff)` : ''));
  });
  console.error('\nDiff images have been written to', diffDir);
  process.exit(2);
}

console.log('No visual regressions found.');
process.exit(0);
