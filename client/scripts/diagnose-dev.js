const http = require('http');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const url = process.env.URL || 'http://localhost:3000';

function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function check() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', (err) => {
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(check, 200);
      });
    })();
  });
}

(async () => {
  console.log('Waiting for dev server at', url);
  try {
    await waitForServer(url, 20000);
  } catch (e) {
    console.error('Dev server did not start in time:', e.message);
    process.exit(2);
  }

  console.log('Server up, launching headless Chromium to capture console and screenshot...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push({ type: 'console', text });
    console.log('PAGE LOG:', text);
  });
  page.on('pageerror', (err) => {
    logs.push({ type: 'error', text: String(err) });
    console.error('PAGE ERROR:', err);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.error('Error loading page:', e.message);
  }

  // Wait a bit for client-side runtime errors
  await new Promise((r) => setTimeout(r, 700));

  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const file = path.join(outDir, 'diagnose.png');
  await page.screenshot({ path: file, fullPage: true });
  console.log('Screenshot saved to', file);

  await browser.close();

  // summarize logs
  const errors = logs.filter(l => l.type === 'error');
  if (errors.length) {
    console.error('\nDetected runtime page errors:');
    errors.forEach((e) => console.error('-', e.text));
    process.exit(3);
  }

  console.log('No runtime page errors detected (check screenshot at', file, ')');
  process.exit(0);
})();
