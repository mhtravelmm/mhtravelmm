/**
 * Plan §4 gate: "renders the fixture shop with every section (hero, catalog,
 * gallery, reviews, contact, booking CTA) at phone and desktop widths, in both
 * languages and both themes, with no horizontal overflow and no axe violation."
 *
 * Usage:  npm run dev   then   node scripts/a11y-audit.mjs
 * Flags:  --base <url>   --paths <a,b>   --widths <360,1440>   --theme dark|light|both
 *
 * Exits non-zero on any violation, horizontal overflow, or a page whose theme
 * did not apply — a "light" run that silently rendered dark would pass every
 * colour rule while testing nothing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';
import { seedTemplates } from '../src/lib/shopTemplates.ts';
import { SHOP_PAGES } from '../src/templates/shopPageData.ts';

const AXE = readFileSync(join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';

/**
 * An owner session, so a `?preview=` run is allowed to render. `name` must match
 * the shop's `ownerName`, because that is how the store resolves who owns it.
 */
function ownerFor(name) {
  return {
    id: `u-${name}`,
    name,
    username: name.toLowerCase().replace(/[^a-z]+/g, ''),
    email: 'a@b.c',
    role: 'owner_admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

/**
 * Every template of every category, as a preview on its own category's fixture
 * shop, plus each shop on its served template. §4 requires each template to
 * render the fixture with every section — so no template may skip the gate.
 */
function defaultCases() {
  const templates = seedTemplates().filter((template) => template.status === 'active');
  const cases = [];
  for (const shop of SHOP_PAGES) {
    const own = templates.filter((template) => template.category === shop.category);
    cases.push({ path: `/shops/${shop.shopId}`, owner: null });
    for (const template of own) {
      cases.push({
        path: `/shops/${shop.shopId}?preview=${template.id}`,
        owner: ownerFor(shop.nameEn),
      });
    }
  }
  return cases;
}

const base = arg('base', 'http://localhost:5173');
const themeArg = arg('theme', 'both');
const themes = themeArg === 'both' ? ['dark', 'light'] : [themeArg];
const widths = arg('widths', '360,390,768,1440').split(',').map(Number);
const cases = arg('paths')
  ? arg('paths')
      .split(',')
      .map((path) => ({ path, owner: path.includes('?preview=') ? ownerFor('The Rangoon House') : null }))
  : defaultCases();

const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
let failures = 0;

for (const theme of themes) {
  for (const width of widths) {
    for (const testCase of cases) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: 900 });
      // Seeded before the app boots: the theme provider reads storage once on
      // mount, so setting it after navigation is always one page too late.
      await page.evaluateOnNewDocument(
        (session, wanted) => {
          window.localStorage.clear();
          window.localStorage.setItem('mh-travel-theme', wanted);
          if (!session) return;
          window.localStorage.setItem('mh-travel-auth-session', JSON.stringify(session));
          window.localStorage.setItem('mh-travel-authenticated', 'true');
        },
        testCase.owner,
        theme,
      );

      await page.goto(`${base}${testCase.path}`, { waitUntil: 'networkidle2' });
      await new Promise((resolve) => setTimeout(resolve, 700));
      await page.addScriptTag({ content: AXE });

      const result = await page.evaluate(async () => {
        const report = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
        return {
          violations: report.violations.map((violation) => `${violation.id}(${violation.nodes.length})`),
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          h1: document.querySelectorAll('h1').length,
          light: document.documentElement.classList.contains('light'),
        };
      });

      const themeApplied = result.light === (theme === 'light');
      if (result.violations.length || result.overflow > 0 || result.h1 !== 1 || !themeApplied) {
        failures += 1;
        const why = [
          result.violations.join(' | ') || null,
          result.overflow > 0 ? `overflow=${result.overflow}` : null,
          result.h1 !== 1 ? `h1=${result.h1}` : null,
          themeApplied ? null : 'theme did not apply',
        ].filter(Boolean);
        console.log(`FAIL ${theme}/${width} ${testCase.path} -> ${why.join(' ')}`);
      }
      await page.close();
    }
  }
}

await browser.close();
const total = themes.length * widths.length * cases.length;
console.log(failures ? `${failures}/${total} failing combinations` : `clean: ${total} combinations`);
process.exit(failures ? 1 : 0);
