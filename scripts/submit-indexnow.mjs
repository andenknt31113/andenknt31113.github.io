#!/usr/bin/env node
/**
 * Submit all URLs in sitemap.xml to IndexNow (Bing / ChatGPT Search / DuckDuckGo / Yandex).
 * Usage: node scripts/submit-indexnow.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HOST = 'ofcoptimizer.com';
const KEY = 'ofcoptimizer-indexnow-20261125';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());

if (urlList.length === 0) {
  console.error('No URLs found in sitemap.xml');
  process.exit(1);
}

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

console.log(`Submitting ${urlList.length} URLs to IndexNow (${HOST})...`);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});
const body = await res.text();
console.log(`IndexNow response: HTTP ${res.status}`, body || '(empty)');
if (!res.ok) process.exit(1);
