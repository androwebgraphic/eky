const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function waitForServer(url, timeout = 10000) {
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
  const portStart = parseInt(process.env.PORT || '5000', 10);
  const net = require('net');

  async function isPortFree(p) {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => tester.close(() => resolve(true)))
        .listen(p);
    });
  }

  let port = portStart;
  while (!(await isPortFree(port)) && port < portStart + 100) port++;
  if (port >= portStart + 100) {
    console.error('No free port found');
    process.exit(1);
  }
  const serverCmd = 'npx';
  // prefer `serve -s build` for SPA history fallback; fall back to http-server if not available
  const serverArgs = ['--yes', 'serve', '-s', 'build', '-l', String(port)];

  console.log('Starting static server on port', port, '...');
  const server = spawn(serverCmd, serverArgs, { stdio: 'inherit' });
  server.on('error', (err) => {
    console.error('Server process error', err);
  });

  try {
    await waitForServer(`http://localhost:${port}`);
  } catch (err) {
    console.error('Server did not start in time', err);
    server.kill();
    process.exit(1);
  }

  console.log('Server up, launching Puppeteer...');
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  const locales = ['en', 'hr', 'de', 'hu'];
  const routes = [
    { path: '/', name: 'home' },
    { path: '/psi', name: 'dogs' },
    { path: '/dodajpsa', name: 'adddog' },
    { path: '/logiranje', name: 'login' },
    { path: '/registracija', name: 'register' },
    { path: '/podijeli', name: 'share' },
    { path: '/profile', name: 'profile' },
  ];

  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  for (const locale of locales) {
    const localeDir = path.join(outDir, locale);
    if (!fs.existsSync(localeDir)) fs.mkdirSync(localeDir);

    for (const route of routes) {
      const page = await browser.newPage();
      // set language before loading page
        // ensure localStorage key is set before scripts run by injecting on new document
        await page.evaluateOnNewDocument((lng) => {
          try {
            window.localStorage.setItem('i18nextLng', lng);
          } catch (e) {
            // ignore
          }
        }, locale);
        const url = `http://localhost:${port}${route.path}`;
        console.log(`Capturing ${url} as ${locale}/${route.name}.png`);
        await page.goto(url, { waitUntil: 'networkidle2' });
      // small wait to ensure translations render; fallback to setTimeout if API missing
      if (page.waitForTimeout) await page.waitForTimeout(400);
      else await new Promise((r) => setTimeout(r, 400));
      const filePath = path.join(localeDir, `${route.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      await page.close();
    }
  }

  await browser.close();
  server.kill();
  console.log('Screenshots saved to', outDir);
})();
