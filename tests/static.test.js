import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function read(name) {
  return readFile(new URL(name, root), 'utf8');
}

test('intake page exposes six accessible steps and privacy-first handoff', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="sq">/);
  assert.equal((html.match(/data-step="\d"/g) || []).length, 6);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Mos shkruaj emra, diagnoza/);
  assert.match(html, /Dërgo përgjigjet në mënyrë private/);
  assert.match(html, /assets\/app\.js/);
});

test('intake page identifies Arlind as strategic process owner and Zoom Growth as execution owner', async () => {
  const html = await read('index.html');
  assert.match(html, /Arlind Berisha/);
  assert.match(html, /Business Coach &amp; Strategic Architect/);
  assert.match(html, /Zoom Growth/);
  assert.match(html, /zbatimin operacional/i);
});

test('process page covers the client journey through handover and closure', async () => {
  const html = await read('process.html');
  for (const phase of ['Discovery', 'Diagnoza', 'Strategy Blueprint', 'Foundation', 'Build', 'Pilot', 'Optimization', 'Handover']) {
    assert.match(html, new RegExp(phase, 'i'));
  }
  assert.match(html, /Approval Gate/);
  assert.match(html, /Arlind/);
  assert.match(html, /Ideal/);
  assert.match(html, /kriteri i përfundimit/i);
});

test('security headers and no-index policy are declared for GitHub Pages', async () => {
  const html = await read('index.html');
  assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /Referrer-Policy/);
});
