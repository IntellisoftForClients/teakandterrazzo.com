/**
 * Download Cormorant Garamond + DM Sans as local woff2 and write brand-fonts.css
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '../public/assets/fonts');
const cssPath = path.join(fontsDir, 'brand-fonts.css');

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// css v1 API returns static per-weight files (not variable font)
const CSS_URLS = [
  'https://fonts.googleapis.com/css?family=Cormorant+Garamond:500,600,700,500italic,600italic&display=swap',
  'https://fonts.googleapis.com/css?family=DM+Sans:400,500,600,700,400italic&display=swap',
];

function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchText(res.headers.location, headers).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
      .on('error', reject);
  });
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchBuffer(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

function sniffExt(buf) {
  const sig = buf.slice(0, 4).toString('ascii');
  if (sig === 'wOF2') return 'woff2';
  if (sig === 'wOFF') return 'woff';
  return 'woff2';
}

async function main() {
  fs.mkdirSync(fontsDir, { recursive: true });

  for (const file of fs.readdirSync(fontsDir)) {
    if (/\.woff2?$/i.test(file)) fs.unlinkSync(path.join(fontsDir, file));
  }

  const cssParts = [];
  for (const url of CSS_URLS) {
    cssParts.push(await fetchText(url, { 'User-Agent': CHROME_UA }));
  }
  const css = cssParts.join('\n');

  const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
  const urls = [];
  let m;
  while ((m = urlRe.exec(css))) {
    const clean = m[1].replace(/['"]/g, '');
    if (!urls.includes(clean)) urls.push(clean);
  }
  if (!urls.length) throw new Error('No font URLs found');

  const map = new Map();
  let cormorant = 0;
  let dm = 0;
  for (const url of urls) {
    const isCormorant = /cormorant/i.test(url);
    const n = isCormorant ? ++cormorant : ++dm;
    const buf = await fetchBuffer(url);
    const ext = sniffExt(buf);
    const file = `${isCormorant ? 'CormorantGaramond' : 'DMSans'}-${n}.${ext}`;
    fs.writeFileSync(path.join(fontsDir, file), buf);
    map.set(url, { local: `/assets/fonts/${file}`, ext });
    console.log('saved', file, buf.length, ext);
  }

  let out = css;
  for (const [remote, { local, ext }] of map) {
    // Replace remote url and normalize format()
    const escaped = remote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`url\\(['"]?${escaped}['"]?\\)\\s*format\\(['"][^'"]+['"]\\)`, 'g'), `url('${local}') format('${ext}')`);
    out = out.split(remote).join(local);
  }
  out = out.replace(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g, (full, u) => {
    const clean = u.replace(/['"]/g, '');
    const hit = map.get(clean);
    return hit ? `url('${hit.local}')` : full;
  });

  fs.writeFileSync(cssPath, out);
  console.log('Wrote', cssPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
