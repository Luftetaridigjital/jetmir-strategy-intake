import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { REQUIRED_FIELDS } from '../assets/intake.js';

const root = new URL('../', import.meta.url);

async function read(name) {
  return readFile(new URL(name, root), 'utf8');
}

test('intake page exposes five strategic chapters and privacy-first handoff', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="sq"[^>]*>/);
  assert.equal((html.match(/data-step="\d"/g) || []).length, 5);
  for (const chapter of ['Themeli', 'Metoda', 'Modeli', 'Motori', 'Mandati']) {
    assert.match(html, new RegExp(chapter, 'i'));
  }
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Mos shkruaj emra, diagnoza/);
  assert.match(html, /Dërgo përgjigjet në mënyrë të sigurt/);
  assert.match(html, /assets\/app\.js/);
});

test('client form requires every signal used by the strategic decision model', async () => {
  const html = await read('index.html');
  const requiredNames = [...html.matchAll(/<(?:textarea|select|input)[^>]*name="([^"]+)"[^>]*data-required/g)].map((match) => match[1]);
  assert.deepEqual(requiredNames.sort(), [...REQUIRED_FIELDS].sort());
});

test('model chapter captures offer-level economics and real capacity utilization', async () => {
  const html = await read('index.html');
  for (const signal of ['Çmimi', 'shitjet në muaj', 'pjesa e të ardhurave', 'orët e realizimit', 'ngarkes(?:a|ën) aktuale', 'list(?:a|ë) pritjeje']) {
    assert.match(html, new RegExp(signal, 'i'));
  }
});

test('client surface presents authority without exposing the internal implementation playbook', async () => {
  const html = await read('index.html');
  assert.match(html, /Para strategjisë,[\s\S]{0,30}qartësojmë biznesin/i);
  assert.match(html, /Strategic Business Diagnostic/i);
  assert.match(html, /Harta Strategjike/i);
  assert.doesNotMatch(html, /Shiko procesin e plotë/i);
  assert.doesNotMatch(html, /CRM|automation|handover|Approval Gate/i);
});

test('deployment excludes the internal process playbook from the client site', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /cp index\.html _site\//);
  assert.doesNotMatch(workflow, /cp[^\n]*process\.html/);
});

test('intake page identifies Arlind as strategic diagnostic owner without agency-detail overload', async () => {
  const html = await read('index.html');
  assert.match(html, /Arlind Berisha/);
  assert.match(html, /Business Coach &amp; Strategic Architect/);
  assert.match(html, /Diagnozë, drejtim dhe arkitekturë strategjike/i);
  assert.doesNotMatch(html, /Zoom Growth/);
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

test('browser security policy and no-index policy are declared for GitHub Pages', async () => {
  const html = await read('index.html');
  assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /connect-src 'self' https:\/\/formsubmit\.co/);
  assert.match(html, /name="referrer" content="strict-origin-when-cross-origin"/);
  assert.match(html, /Referrer-Policy" content="strict-origin-when-cross-origin"/);
});

test('intake explains the real submission and backup behavior', async () => {
  const html = await read('index.html');
  assert.match(html, /mail@arlindberisha\.info/);
  assert.match(html, /FormSubmit/);
  assert.match(html, /kopj(?:e|en) rezervë/i);
  assert.doesNotMatch(html, /Asnjë përgjigje nuk largohet automatikisht nga pajisja/);
});

test('pages fail closed when embedded in a frame', async () => {
  const [intake, process, guard, styles] = await Promise.all([
    read('index.html'),
    read('process.html'),
    read('assets/frame-guard.js'),
    read('assets/styles.css'),
  ]);
  assert.match(intake, /<html[^>]+frame-check-pending/);
  assert.match(process, /<html[^>]+frame-check-pending/);
  assert.match(intake, /<script src="assets\/frame-guard\.js"><\/script>/);
  assert.match(guard, /window\.self === window\.top/);
  assert.match(guard, /is-framed/);
  assert.match(styles, /frame-check-pending body/);
  assert.match(styles, /is-framed body/);
});
