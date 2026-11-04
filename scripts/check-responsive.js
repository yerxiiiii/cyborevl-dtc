import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import puppeteer from 'puppeteer';

// Serve the actual Pages artifact, including its repository subpath.
const root = resolve('public');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname.replace(/^\/cyborevl-dtc\//, '/');
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(`${root}/`)) { response.writeHead(403).end(); return; }
  try {
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = process.env.SITE_URL || `http://127.0.0.1:${server.address().port}/cyborevl-dtc/`;
const browser = await puppeteer.launch({ headless: true, args: process.env.CI ? ['--no-sandbox'] : [] });
const viewports = [
  [320, 568], [360, 800], [390, 844], [430, 932], [667, 375], [844, 390],
  [580, 800], [581, 800], [640, 360], [768, 1024], [820, 1180], [900, 600], [901, 600],
  [1024, 768], [1180, 820], [1280, 720], [1366, 768], [1440, 650],
  [1536, 864], [1920, 1080], [2560, 1440],
];
const errors = [];
try {
  const page = await browser.newPage();
  if (process.env.BLOCK_WEB_FONTS) {
    await page.setRequestInterception(true);
    page.on('request', request => /fonts\.(googleapis|gstatic)\.com/.test(request.url()) ? request.abort() : request.continue());
  }
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  for (const [width, height] of viewports) {
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    for (const language of ['en', 'zh']) {
      if (await page.evaluate(() => document.documentElement.dataset.language) !== language) {
        await page.click('[data-language-toggle]');
      }
      for (const scene of ['product', 'commute']) {
        await page.evaluate(scene => setHeroScene(scene), scene);
        const failures = await page.evaluate(() => {
          const issues = [];
          const rect = selector => document.querySelector(selector).getBoundingClientRect();
          const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
          if (rect('.hero-copy').top < rect('.site-header').bottom + 24) issues.push('Header overlaps hero copy');
          if (rect('.hero-copy').bottom > rect('.hero-meta').top) issues.push('Hero copy overlaps captions');
          if (document.documentElement.scrollWidth > innerWidth) issues.push('Horizontal page overflow');
          const logo = rect('.site-header .wordmark');
          const actions = rect('.header-actions');
          if (overlap(logo, actions)) issues.push('Header controls overlap logo');
          if (actions.right > innerWidth || actions.left < 0) issues.push('Header controls outside viewport');
          const nav = rect('.site-nav');
          if (nav.width && (overlap(nav, actions) || overlap(nav, logo))) issues.push('Navigation overlaps header controls');
          document.querySelectorAll('.hero-meta span').forEach(span => {
            if (overlap(span.getBoundingClientRect(), rect('.hero-progress'))) issues.push('Caption overlaps slide progress');
          });
          document.querySelectorAll('.why-card-content').forEach((card, i) => {
            const children = ['strong', 'small', '.why-card-body', 'em'].map(s => card.querySelector(s).getBoundingClientRect());
            children.forEach((r, j) => {
              if (j && r.top < children[j - 1].bottom - 1) issues.push(`Card ${i}: overlapping copy`);
              if (r.bottom > card.getBoundingClientRect().bottom + 1) issues.push(`Card ${i}: clipped copy`);
            });
          });
          // Check rendered text, including overflow hidden by a parent container.
          document.querySelectorAll('h1,h2,h3,p,strong,small,label,.spotlight-label,.specs-list b,.experience-detail-foot').forEach(element => {
            if (!element.getBoundingClientRect().height || element.closest('.scene-reserved')) return;
            const range = document.createRange();
            range.selectNodeContents(element);
            for (const r of range.getClientRects()) {
              if (r.width && (r.left < -1 || r.right > innerWidth + 1)) issues.push(`Text outside viewport: ${element.textContent.slice(0,50)}`);
            }
          });
          const product = document.body.classList.contains('hero-product-active');
          const color = getComputedStyle(document.querySelector('.hero-overlay h1')).color;
          if (color !== (product ? 'rgb(32, 32, 32)' : 'rgb(240, 240, 240)')) issues.push('Wrong hero text color');
          return issues;
        });
        assert.deepEqual(failures, [], `${width}×${height} ${language} ${scene}: ${failures.join('; ')}`);
      }
    }
    console.log(`PASS ${width}×${height}: EN / 中文, both slides`);
  }
  // Verify the real timer and user interactions, in addition to layout states.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hero-scene-layer.is-commute-scene', { timeout: 6000 });
  await page.waitForSelector('.hero-scene-layer.is-product-scene', { timeout: 6000 });
  await page.click('[data-experience="return"]');
  assert.equal(await page.$eval('[data-experience="return"]', el => el.getAttribute('aria-selected')), 'true');
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log('PASS automatic carousel, slide colors, language toggle and experience tabs');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
