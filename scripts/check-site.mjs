#!/usr/bin/env node
/**
 * Static & optional live health / SEO verifier for https://ofcoptimizer.com/ (app-ads-site).
 *
 * Usage:
 *   node scripts/check-site.mjs           # Fast 100% offline static checks (exit 1 on errors)
 *   node scripts/check-site.mjs --live    # Also verify HTTP 200 on live https://ofcoptimizer.com/ URLs
 *   node scripts/check-site.mjs --strict  # Fail (exit 1) on advisory warnings too
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DOMAIN = 'ofcoptimizer.com';
const ORIGIN = `https://${DOMAIN}`;
const WEB_APP_ORIGIN = 'https://app.ofcoptimizer.com';
const PUBLIC_EXCLUDED_HTML = new Set(['404.html']);
// Separate GitHub Pages project repos mounted under the same custom domain
const EXTERNAL_SAME_DOMAIN_PREFIXES = ['/ofc-fantasy-optimizer-legal/'];
const VALID_APP_MODES = new Set([
  'daily',
  'daily-spot',
  'training',
  'drill',
  'drills',
  'score',
  'score-calc',
  'calculator',
  'solver',
  'fantasy',
  'flat',
  'flat-solver',
  'battle',
  'cpu-battle',
]);
const VALID_CARD_RE = /^(?:JK1|JK2|JK|[2-9TJQKA][shdc])$/i;

const FORBIDDEN_PATTERNS = [
  { label: 'legacy "HU Bellman" reference', re: /HU\s*Bellman/gi },
  { label: 'legacy "ミックスゲーム優勝" claim', re: /ミックスゲーム優勝/g },
  { label: 'legacy/staging domain (github.io)', re: /github\.io/gi },
  { label: 'legacy/staging domain (pages.dev)', re: /pages\.dev/gi },
  { label: 'legacy/staging domain (vercel.app)', re: /vercel\.app/gi },
  { label: 'legacy/staging domain (netlify.app)', re: /netlify\.app/gi },
  { label: 'local dev URL (localhost)', re: /\blocalhost\b/gi },
  { label: 'local dev IP (127.0.0.1)', re: /\b127\.0\.0\.1\b/g },
  { label: 'legacy repo slug (ofc-fantasy-optimizer)', re: /ofc-fantasy-optimizer(?!-legal)/gi },
  { label: 'broken Japanese street typo (街/町)', re: /[街町]/g },
];

const ADVISORY_PATTERNS = [
  { label: 'English article typo ("a offline")', re: /\ba offline\b/gi },
];

const args = new Set(process.argv.slice(2));
const RUN_LIVE = args.has('--live');
const STRICT = args.has('--strict');

const errors = [];
const warnings = [];
const stats = {
  htmlPublic: 0,
  htmlTotal: 0,
  jsonLdBlocks: 0,
  internalLinksChecked: 0,
  deepLinksChecked: 0,
  sitemapUrls: 0,
  liveUrlsChecked: 0,
};

function addError(category, detail) {
  errors.push({ category, detail });
}

function addWarning(category, detail) {
  warnings.push({ category, detail });
}

function walkFiles(dir, relBase = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const abs = path.join(dir, entry.name);
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...walkFiles(abs, rel));
    } else {
      out.push(rel);
    }
  }
  return out.sort();
}

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function isDir(relPath) {
  const p = path.join(ROOT, relPath);
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function expectedCanonicalForHtml(relHtml) {
  if (relHtml === 'index.html') return `${ORIGIN}/`;
  if (relHtml.endsWith('/index.html')) {
    return `${ORIGIN}/${relHtml.slice(0, -'index.html'.length)}`;
  }
  return `${ORIGIN}/${relHtml}`;
}

function urlPathToLocalTarget(urlPathname) {
  const clean = urlPathname.replace(/^\/+/, '');
  if (clean === '') return 'index.html';
  if (clean.endsWith('/')) return `${clean}index.html`;
  if (fileExists(clean) && !isDir(clean)) return clean;
  if (fileExists(`${clean}/index.html`)) return `${clean}/index.html`;
  return clean;
}

function extractMeta(html, attrName, attrVal) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const attrRe = new RegExp(`\\b${attrName}\\s*=\\s*"([^"]*)"`, 'i');
    const m = tag.match(attrRe);
    if (m && m[1].toLowerCase() === attrVal.toLowerCase()) {
      const c = tag.match(/\bcontent\s*=\s*"([^"]*)"/i);
      return c ? c[1].trim() : '';
    }
  }
  return null;
}

function extractLinks(html, relValue) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const results = [];
  for (const tag of tags) {
    const relM = tag.match(/\brel\s*=\s*"([^"]*)"/i);
    if (!relM) continue;
    const relTokens = relM[1].toLowerCase().split(/\s+/);
    if (!relTokens.includes(relValue.toLowerCase())) continue;
    const hrefM = tag.match(/\bhref\s*=\s*"([^"]*)"/i);
    const hreflangM = tag.match(/\bhreflang\s*=\s*"([^"]*)"/i);
    results.push({
      href: hrefM ? hrefM[1].trim() : null,
      hreflang: hreflangM ? hreflangM[1].trim() : null,
    });
  }
  return results;
}

function isExternalSameDomainPath(pathname) {
  return EXTERNAL_SAME_DOMAIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function validateAppDeepLink(rawUrl, sourceFile) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    addError('deep-link', `${sourceFile}: invalid URL "${rawUrl}"`);
    return;
  }
  if (u.origin !== WEB_APP_ORIGIN) return;
  stats.deepLinksChecked += 1;

  const mode = u.searchParams.get('mode');
  if (mode !== null && !VALID_APP_MODES.has(mode.toLowerCase())) {
    addError('deep-link', `${sourceFile}: unknown app mode "${mode}" in ${rawUrl}`);
  }
  const lang = u.searchParams.get('lang');
  if (lang !== null && lang !== 'ja' && lang !== 'en') {
    addError('deep-link', `${sourceFile}: invalid lang "${lang}" in ${rawUrl}`);
  }
  const cardParams = ['h', 't', 'm', 'b', 'd', 'x', 'ot', 'om', 'ob', 'cards'];
  const seenCards = new Set();
  for (const key of cardParams) {
    const val = u.searchParams.get(key);
    if (!val) continue;
    for (const tok of val.split(',')) {
      const t = tok.trim();
      if (!VALID_CARD_RE.test(t)) {
        addError('deep-link', `${sourceFile}: invalid card token "${t}" in ${rawUrl}`);
        continue;
      }
      const norm = t.toUpperCase();
      if (norm !== 'JK' && seenCards.has(norm)) {
        addError('deep-link', `${sourceFile}: duplicate card "${t}" in ${rawUrl}`);
      }
      seenCards.add(norm);
    }
  }
}

/* =========================================================================
 * 1. Discover files & cache HTML IDs
 * ========================================================================= */
const allFiles = walkFiles(ROOT);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
const publicHtmlFiles = htmlFiles.filter((f) => !PUBLIC_EXCLUDED_HTML.has(f));
stats.htmlTotal = htmlFiles.length;
stats.htmlPublic = publicHtmlFiles.length;

const htmlIdsCache = new Map();
function getHtmlIds(relHtml) {
  if (!htmlIdsCache.has(relHtml)) {
    const content = readText(relHtml);
    htmlIdsCache.set(
      relHtml,
      new Set([...content.matchAll(/\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]))
    );
  }
  return htmlIdsCache.get(relHtml);
}

/* =========================================================================
 * 2. HTML SEO, JSON-LD, Inline JS, Links & Assets
 * ========================================================================= */
const htmlChartVersions = new Map(); // chartName -> Set(version)
const cssVersionsByFile = new Map(); // relHtml -> version

for (const relHtml of htmlFiles) {
  const html = readText(relHtml);
  const isPublic = !PUBLIC_EXCLUDED_HTML.has(relHtml);
  const isEn = relHtml.startsWith('en/');
  const expectedCanonical = expectedCanonicalForHtml(relHtml);

  // <title>
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  if (!title) {
    addError('seo', `${relHtml}: missing or empty <title>`);
  }

  // Inline JS syntax check
  for (const m of html.matchAll(/<script(?:\s+([^>]*))?>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/i.test(attrs) || /application\/ld\+json/i.test(attrs)) continue;
    try {
      new vm.Script(m[2], { filename: relHtml });
    } catch (err) {
      addError('js-syntax', `${relHtml}: inline <script> syntax error: ${err.message}`);
    }
  }

  // Track styles.css cache-buster versions
  const styleVerM = html.match(/styles\.css(?:\?v=([a-z0-9-]+))?/i);
  if (styleVerM) {
    cssVersionsByFile.set(relHtml, styleVerM[1] || '(none)');
  }

  // Track <img data-chart="..." src="...?v=..."> cache-busters
  for (const tag of html.match(/<img\b[^>]*\bdata-chart\s*=\s*"[^"]+"[^>]*>/gi) || []) {
    const nameM = tag.match(/\bdata-chart\s*=\s*"([^"]+)"/i);
    const srcM = tag.match(/\bsrc\s*=\s*"([^"]+)"/i);
    if (nameM && srcM) {
      const verM = srcM[1].match(/\?v=([a-z0-9-]+)/i);
      if (verM) {
        if (!htmlChartVersions.has(nameM[1])) htmlChartVersions.set(nameM[1], new Set());
        htmlChartVersions.get(nameM[1]).add(verM[1]);
      }
    }
  }

  if (isPublic) {
    // <html lang="...">
    const langM = html.match(/<html\b[^>]*\blang\s*=\s*"([^"]+)"/i);
    const expectedLang = isEn ? 'en' : 'ja';
    if (!langM || langM[1] !== expectedLang) {
      addError('seo', `${relHtml}: <html lang="${langM?.[1] || ''}"> should be "${expectedLang}"`);
    }

    // <meta name="description">
    const desc = extractMeta(html, 'name', 'description');
    if (!desc) {
      addError('seo', `${relHtml}: missing or empty <meta name="description">`);
    }

    // <link rel="canonical">
    const canonicals = extractLinks(html, 'canonical');
    if (canonicals.length !== 1) {
      addError('seo', `${relHtml}: expected exactly 1 <link rel="canonical">, found ${canonicals.length}`);
    } else if (canonicals[0].href !== expectedCanonical) {
      addError('seo', `${relHtml}: canonical "${canonicals[0].href}" !== expected "${expectedCanonical}"`);
    }

    // OpenGraph & Twitter image
    const ogTitle = extractMeta(html, 'property', 'og:title');
    const ogDesc = extractMeta(html, 'property', 'og:description');
    const ogUrl = extractMeta(html, 'property', 'og:url');
    const ogImage = extractMeta(html, 'property', 'og:image');
    const twImage = extractMeta(html, 'name', 'twitter:image');

    if (!ogTitle) addError('seo', `${relHtml}: missing og:title`);
    if (!ogDesc) addError('seo', `${relHtml}: missing og:description`);
    if (ogUrl !== expectedCanonical) {
      addError('seo', `${relHtml}: og:url "${ogUrl}" !== canonical "${expectedCanonical}"`);
    }
    if (!ogImage) {
      addError('seo', `${relHtml}: missing og:image`);
    } else if (!ogImage.startsWith(`${ORIGIN}/`)) {
      addError('seo', `${relHtml}: og:image "${ogImage}" must start with ${ORIGIN}/`);
    } else {
      const imgPath = urlPathToLocalTarget(new URL(ogImage).pathname);
      if (!fileExists(imgPath)) {
        addError('asset', `${relHtml}: og:image local file missing (${imgPath})`);
      }
    }
    if (twImage && twImage.startsWith(`${ORIGIN}/`)) {
      const twPath = urlPathToLocalTarget(new URL(twImage).pathname);
      if (!fileExists(twPath)) {
        addError('asset', `${relHtml}: twitter:image local file missing (${twPath})`);
      }
    }

    // Advisory: JA page with English-only og:title / og:description
    if (!isEn && ogTitle && !/[\u3040-\u30ff\u4e00-\u9faf]/.test(ogTitle)) {
      addWarning('seo-i18n', `${relHtml}: JA page has non-Japanese og:title ("${ogTitle}")`);
    }
    if (!isEn && ogDesc && !/[\u3040-\u30ff\u4e00-\u9faf]/.test(ogDesc)) {
      addWarning('seo-i18n', `${relHtml}: JA page has non-Japanese og:description`);
    }

    // hreflang alternates
    const alternates = extractLinks(html, 'alternate').filter((l) => l.hreflang);
    const altMap = new Map(alternates.map((a) => [a.hreflang, a.href]));
    for (const requiredLang of ['ja', 'en', 'x-default']) {
      const href = altMap.get(requiredLang);
      if (!href) {
        addError('seo', `${relHtml}: missing hreflang="${requiredLang}"`);
      } else if (!href.startsWith(`${ORIGIN}/`)) {
        addError('seo', `${relHtml}: hreflang="${requiredLang}" ("${href}") must use ${ORIGIN}/`);
      } else {
        const target = urlPathToLocalTarget(new URL(href).pathname);
        if (!fileExists(target)) {
          addError('seo', `${relHtml}: hreflang="${requiredLang}" points to missing page (${target})`);
        }
      }
    }

    // JSON-LD
    const ldBlocks = [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    if (ldBlocks.length === 0) {
      addError('json-ld', `${relHtml}: missing JSON-LD (<script type="application/ld+json">)`);
    }
    ldBlocks.forEach((m, idx) => {
      stats.jsonLdBlocks += 1;
      try {
        const parsed = JSON.parse(m[1]);
        if (!parsed['@context'] || !parsed['@type']) {
          addError('json-ld', `${relHtml}: JSON-LD block #${idx + 1} missing @context or @type`);
        }
        if (typeof parsed.image === 'string' && parsed.image.startsWith(`${ORIGIN}/`)) {
          const imgTarget = urlPathToLocalTarget(new URL(parsed.image).pathname);
          if (!fileExists(imgTarget)) {
            addError('json-ld', `${relHtml}: JSON-LD block #${idx + 1} image missing (${imgTarget})`);
          }
        }
      } catch (err) {
        addError('json-ld', `${relHtml}: JSON-LD block #${idx + 1} invalid JSON: ${err.message}`);
      }
    });
  }

  // Internal link, anchor & asset checks (applies to ALL HTML files including 404.html)
  const ownIds = getHtmlIds(relHtml);
  for (const m of html.matchAll(/\b(href|src)\s*=\s*"([^"]+)"/gi)) {
    const attr = m[1].toLowerCase();
    const rawVal = m[2].replace(/&amp;/g, '&').trim();
    if (
      !rawVal ||
      rawVal === '#' ||
      rawVal.startsWith('mailto:') ||
      rawVal.startsWith('tel:') ||
      rawVal.startsWith('javascript:') ||
      rawVal.startsWith('data:')
    ) {
      continue;
    }

    if (rawVal.startsWith('#')) {
      stats.internalLinksChecked += 1;
      const frag = rawVal.slice(1);
      if (!ownIds.has(frag)) {
        addError('link', `${relHtml}: broken same-page anchor ${attr}="${rawVal}"`);
      }
      continue;
    }

    if (/^https?:\/\//i.test(rawVal)) {
      if (rawVal.startsWith(`${WEB_APP_ORIGIN}/`)) {
        validateAppDeepLink(rawVal, relHtml);
      } else if (rawVal.startsWith(`${ORIGIN}/`)) {
        const u = new URL(rawVal);
        if (isExternalSameDomainPath(u.pathname)) continue;
        stats.internalLinksChecked += 1;
        const target = urlPathToLocalTarget(u.pathname);
        if (!fileExists(target)) {
          addError('link', `${relHtml}: broken internal absolute ${attr}="${rawVal}" (missing ${target})`);
        } else if (u.hash && target.endsWith('.html')) {
          const targetIds = getHtmlIds(target);
          if (!targetIds.has(u.hash.slice(1))) {
            addError('link', `${relHtml}: broken fragment in ${attr}="${rawVal}" (missing ${u.hash} in ${target})`);
          }
        }
      }
      continue;
    }

    // Relative or root-relative link/asset
    stats.internalLinksChecked += 1;
    const [pathPart, hashPart] = rawVal.split('#');
    const cleanPath = pathPart.split('?')[0];
    let target;
    if (cleanPath.startsWith('/')) {
      target = urlPathToLocalTarget(cleanPath);
    } else {
      const joined = path.posix.normalize(path.posix.join(path.posix.dirname(relHtml), cleanPath));
      if (joined === '.' || joined === '') target = 'index.html';
      else if (joined.endsWith('/')) target = `${joined}index.html`;
      else if (fileExists(joined) && !isDir(joined)) target = joined;
      else if (fileExists(`${joined}/index.html`)) target = `${joined}/index.html`;
      else target = joined;
    }

    if (!fileExists(target)) {
      addError('link', `${relHtml}: broken relative ${attr}="${rawVal}" -> missing ${target}`);
    } else if (hashPart && target.endsWith('.html')) {
      const targetIds = getHtmlIds(target);
      if (!targetIds.has(hashPart)) {
        addError('link', `${relHtml}: broken fragment in ${attr}="${rawVal}" (missing #${hashPart} in ${target})`);
      }
    }
  }
}

// Check styles.css cache-buster consistency across HTML files
const publicCssVersions = new Set(
  [...cssVersionsByFile.entries()]
    .filter(([f]) => !PUBLIC_EXCLUDED_HTML.has(f))
    .map(([, v]) => v)
);
if (publicCssVersions.size === 1) {
  const canonicalCssVer = [...publicCssVersions][0];
  for (const [f, v] of cssVersionsByFile.entries()) {
    if (v !== canonicalCssVer) {
      addWarning('cache-buster', `${f}: loads styles.css?v=${v} (public pages use ?v=${canonicalCssVer})`);
    }
  }
}

/* =========================================================================
 * 3. CSS & JS Static Asset + Syntax Checks
 * ========================================================================= */
for (const relCss of allFiles.filter((f) => f.endsWith('.css'))) {
  const css = readText(relCss);
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
    const ref = m[1].trim();
    if (/^(?:https?:|data:|#)/i.test(ref)) continue;
    const clean = ref.split('?')[0].split('#')[0];
    const target = clean.startsWith('/')
      ? clean.replace(/^\/+/, '')
      : path.posix.normalize(path.posix.join(path.posix.dirname(relCss), clean));
    if (!fileExists(target)) {
      addError('asset', `${relCss}: missing url(${ref}) -> ${target}`);
    }
  }
}

if (fileExists('app.js')) {
  const appJs = readText('app.js');
  try {
    new vm.Script(appJs, { filename: 'app.js' });
  } catch (err) {
    addError('js-syntax', `app.js syntax error: ${err.message}`);
  }

  // Verify every FEATURES[].shot has both -ja.webp and -en.webp
  for (const m of appJs.matchAll(/\bshot\s*:\s*['"]([a-z0-9-]+)['"]/gi)) {
    for (const lang of ['ja', 'en']) {
      const asset = `assets/${m[1]}-${lang}.webp`;
      if (!fileExists(asset)) {
        addError('asset', `app.js: missing feature screenshot ${asset}`);
      }
    }
  }

  // Verify every HTML data-shot & data-chart has both -ja.webp and -en.webp
  const dataShots = new Set();
  const dataCharts = new Set();
  for (const relHtml of htmlFiles) {
    const html = readText(relHtml);
    for (const m of html.matchAll(/\bdata-shot\s*=\s*"([^"]+)"/gi)) dataShots.add(m[1]);
    for (const m of html.matchAll(/\bdata-chart\s*=\s*"([^"]+)"/gi)) dataCharts.add(m[1]);
  }
  for (const s of dataShots) {
    for (const lang of ['ja', 'en']) {
      const asset = `assets/${s}-${lang}.webp`;
      if (!fileExists(asset)) addError('asset', `data-shot="${s}": missing ${asset}`);
    }
  }
  for (const c of dataCharts) {
    for (const lang of ['ja', 'en']) {
      const asset = `assets/${c}-${lang}.webp`;
      if (!fileExists(asset)) addError('asset', `data-chart="${c}": missing ${asset}`);
    }
  }

  // Check if app.js overwrites data-chart ?v=... with an older version than HTML
  const jsChartVerM = appJs.match(/data-chart[\s\S]{0,200}\?v=([a-z0-9-]+)/i);
  if (jsChartVerM) {
    const jsChartVer = jsChartVerM[1];
    for (const [chartName, htmlVers] of htmlChartVersions.entries()) {
      for (const hv of htmlVers) {
        if (hv !== jsChartVer) {
          addWarning(
            'cache-buster',
            `app.js overwrites [data-chart="${chartName}"] with ?v=${jsChartVer}, mismatching HTML ?v=${hv}`
          );
        }
      }
    }
  }
}

/* =========================================================================
 * 4. Forbidden Legacy Strings & Advisory Copy Scan
 * ========================================================================= */
const textFiles = allFiles.filter(
  (f) => /\.(html|js|css|txt|xml)$/.test(f) && !f.startsWith('scripts/')
);
for (const relFile of textFiles) {
  const lines = readText(relFile).split('\n');
  lines.forEach((line, idx) => {
    for (const { label, re } of FORBIDDEN_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(line)) {
        addError('forbidden', `${relFile}:${idx + 1} matches ${label}: ${line.trim().slice(0, 120)}`);
      }
    }
    for (const { label, re } of ADVISORY_PATTERNS) {
      re.lastIndex = 0;
      if (re.test(line)) {
        addWarning('copy', `${relFile}:${idx + 1} matches ${label}: ${line.trim().slice(0, 120)}`);
      }
    }
  });
}

/* =========================================================================
 * 5. sitemap.xml, robots.txt, llms.txt, CNAME, app-ads.txt, IndexNow
 * ========================================================================= */
const sitemapLocs = [];
if (!fileExists('sitemap.xml')) {
  addError('sitemap', 'sitemap.xml is missing');
} else {
  const xml = readText('sitemap.xml');
  if (!xml.trimStart().startsWith('<?xml ')) {
    addError('sitemap', 'sitemap.xml missing XML declaration');
  }
  if (!/<urlset\b[^>]*>[\s\S]*<\/urlset>\s*$/.test(xml)) {
    addError('sitemap', 'sitemap.xml missing balanced <urlset>...</urlset>');
  }
  // Check balanced <url> and <loc> tags and unescaped ampersands
  const urlOpen = (xml.match(/<url>/g) || []).length;
  const urlClose = (xml.match(/<\/url>/g) || []).length;
  if (urlOpen === 0 || urlOpen !== urlClose) {
    addError('sitemap', `sitemap.xml unbalanced <url> tags (open=${urlOpen}, close=${urlClose})`);
  }
  if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(xml)) {
    addError('sitemap', 'sitemap.xml contains unescaped "&"');
  }

  const seenLoc = new Set();
  for (const m of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
    const loc = m[1].trim();
    sitemapLocs.push(loc);
    if (seenLoc.has(loc)) {
      addError('sitemap', `duplicate <loc> in sitemap.xml: ${loc}`);
    }
    seenLoc.add(loc);
    if (!loc.startsWith(`${ORIGIN}/`)) {
      addError('sitemap', `sitemap <loc> does not match ${ORIGIN}/: ${loc}`);
    } else {
      const target = urlPathToLocalTarget(new URL(loc).pathname);
      if (!fileExists(target)) {
        addError('sitemap', `dead URL in sitemap.xml: ${loc} (missing ${target})`);
      }
    }
  }
  stats.sitemapUrls = sitemapLocs.length;

  // Validate xhtml:link alternates in sitemap.xml
  for (const m of xml.matchAll(/<xhtml:link\b[^>]*\bhref="([^"]+)"/g)) {
    const href = m[1].trim();
    if (!href.startsWith(`${ORIGIN}/`)) {
      addError('sitemap', `xhtml:link href does not match ${ORIGIN}/: ${href}`);
    } else {
      const target = urlPathToLocalTarget(new URL(href).pathname);
      if (!fileExists(target)) {
        addError('sitemap', `dead xhtml:link in sitemap.xml: ${href} (missing ${target})`);
      }
    }
  }

  // Bidirectional coverage: every public HTML page must be in sitemap.xml
  for (const relHtml of publicHtmlFiles) {
    const canonical = expectedCanonicalForHtml(relHtml);
    if (!seenLoc.has(canonical)) {
      addError('sitemap', `public HTML page missing from sitemap.xml: ${relHtml} (${canonical})`);
    }
  }
}

// robots.txt
if (!fileExists('robots.txt')) {
  addError('robots', 'robots.txt is missing');
} else {
  const robots = readText('robots.txt');
  if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) {
    addError('robots', `robots.txt missing "Sitemap: ${ORIGIN}/sitemap.xml"`);
  }
  if (/^\s*Disallow:\s*\/\s*$/m.test(robots)) {
    addError('robots', 'robots.txt blocks entire site with "Disallow: /"');
  }
}

// llms.txt
if (!fileExists('llms.txt')) {
  addError('llms', 'llms.txt is missing');
} else {
  const llms = readText('llms.txt');
  for (const requiredUrl of [`${ORIGIN}/`, `${ORIGIN}/en/`, `${WEB_APP_ORIGIN}/`]) {
    if (!llms.includes(requiredUrl)) {
      addError('llms', `llms.txt missing required URL: ${requiredUrl}`);
    }
  }
  const llmsOwnUrls = new Set();
  for (const m of llms.matchAll(/https?:\/\/[^\s)>\]]+/g)) {
    const raw = m[0].replace(/[.,;]+$/, '');
    if (raw.startsWith(`${WEB_APP_ORIGIN}/`)) {
      validateAppDeepLink(raw, 'llms.txt');
    } else if (raw.startsWith(`${ORIGIN}/`)) {
      const u = new URL(raw);
      llmsOwnUrls.add(`${u.origin}${u.pathname}`);
      if (isExternalSameDomainPath(u.pathname)) continue;
      const target = urlPathToLocalTarget(u.pathname);
      if (!fileExists(target)) {
        addError('llms', `dead URL in llms.txt: ${raw} (missing ${target})`);
      }
    }
  }
  for (const loc of sitemapLocs) {
    if (!llmsOwnUrls.has(loc)) {
      addWarning('llms', `sitemap page not listed in llms.txt: ${loc}`);
    }
  }
}

// CNAME, app-ads.txt, IndexNow key
if (!fileExists('CNAME')) {
  addError('infra', 'CNAME file is missing');
} else if (readText('CNAME').trim() !== DOMAIN) {
  addError('infra', `CNAME "${readText('CNAME').trim()}" !== "${DOMAIN}"`);
}
if (!fileExists('app-ads.txt') || readText('app-ads.txt').trim().length === 0) {
  addError('infra', 'app-ads.txt is missing or empty');
}
if (fileExists('scripts/submit-indexnow.mjs')) {
  const idxScript = readText('scripts/submit-indexnow.mjs');
  const keyM = idxScript.match(/const\s+KEY\s*=\s*['"]([^'"]+)['"]/);
  if (keyM) {
    const keyFile = `${keyM[1]}.txt`;
    if (!fileExists(keyFile)) {
      addError('infra', `IndexNow key file missing: ${keyFile}`);
    } else if (readText(keyFile).trim() !== keyM[1]) {
      addError('infra', `IndexNow key file ${keyFile} content does not match key "${keyM[1]}"`);
    }
  }
}

// Check for unreferenced files in assets/
const corpus = textFiles.map((f) => readText(f)).join('\n');
for (const asset of allFiles.filter((f) => f.startsWith('assets/'))) {
  const base = path.posix.basename(asset);
  const stem = base.replace(/-(ja|en)\.webp$/, '');
  if (!corpus.includes(base) && !corpus.includes(stem)) {
    addWarning('asset', `unreferenced file in assets/: ${asset}`);
  }
}

/* =========================================================================
 * 6. Optional Live Endpoint Verification (--live)
 * ========================================================================= */
async function runLiveChecks() {
  const liveTargets = new Set([
    `${ORIGIN}/`,
    `${ORIGIN}/en/`,
    `${ORIGIN}/sitemap.xml`,
    `${ORIGIN}/llms.txt`,
    `${ORIGIN}/robots.txt`,
    `${ORIGIN}/app-ads.txt`,
    ...sitemapLocs,
  ]);
  // Also check any external same-domain links (e.g. privacy policy)
  for (const relHtml of htmlFiles) {
    const html = readText(relHtml);
    for (const m of html.matchAll(/https:\/\/ofcoptimizer\.com\/ofc-fantasy-optimizer-legal\/[^\s"'<>]+/g)) {
      liveTargets.add(m[0]);
    }
  }

  for (const url of liveTargets) {
    stats.liveUrlsChecked += 1;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (res.status !== 200) {
        addError('live', `HTTP ${res.status} for ${url}`);
      }
    } catch (err) {
      addError('live', `fetch failed for ${url}: ${err.message}`);
    }
  }
}

if (RUN_LIVE) {
  await runLiveChecks();
}

/* =========================================================================
 * 7. Summary & Exit
 * ========================================================================= */
console.log('=== app-ads-site Static & SEO Check ===');
console.log(
  `Pages: ${stats.htmlPublic} public (+${stats.htmlTotal - stats.htmlPublic} utility) | ` +
    `JSON-LD: ${stats.jsonLdBlocks} blocks | ` +
    `Internal links: ${stats.internalLinksChecked} | ` +
    `App deep links: ${stats.deepLinksChecked} | ` +
    `Sitemap URLs: ${stats.sitemapUrls}` +
    (RUN_LIVE ? ` | Live URLs: ${stats.liveUrlsChecked}` : '')
);

if (warnings.length > 0) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [WARN:${w.category}] ${w.detail}`);
  }
}

if (errors.length > 0) {
  console.error(`\nERRORS (${errors.length}):`);
  for (const e of errors) {
    console.error(`  [ERR:${e.category}] ${e.detail}`);
  }
  process.exit(1);
}

if (STRICT && warnings.length > 0) {
  console.error(`\nFAILED under --strict due to ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`\nPASS — 0 errors${warnings.length > 0 ? ` (${warnings.length} advisory warning(s))` : ''}.`);
process.exit(0);
