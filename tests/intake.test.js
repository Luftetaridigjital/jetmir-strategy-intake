import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_FIELDS,
  validateStep,
  normalizeSubmission,
  createResponseText,
  containsClinicalDataWarning,
  calculateProgress,
  createDraftEnvelope,
  readDraftEnvelope,
  getDraftExpiryDelay,
} from '../assets/intake.js';

test('required fields are defined for every strategic decision area', () => {
  assert.deepEqual(REQUIRED_FIELDS, [
    'origin',
    'public_identity',
    'identity_boundaries',
    'method_process',
    'fit_boundaries',
    'ideal_client',
    'active_offers',
    'vision_12m',
    'priority_90d',
    'consent_accuracy',
  ]);
});

test('validateStep returns field names that are missing', () => {
  const fields = ['origin', 'public_identity'];
  assert.deepEqual(validateStep(fields, { origin: 'Historia ime' }), ['public_identity']);
});

test('validateStep trims whitespace before accepting a required answer', () => {
  assert.deepEqual(validateStep(['origin'], { origin: '   ' }), ['origin']);
});

test('normalizeSubmission only keeps allowlisted fields and adds metadata', () => {
  const result = normalizeSubmission(
    { origin: 'Fillimi', injected: '<script>bad</script>', website: '' },
    { submissionId: 'JS-123', submittedAt: '2026-08-02T13:00:00.000Z' },
  );
  assert.equal(result.origin, 'Fillimi');
  assert.equal(result.injected, undefined);
  assert.equal(result.submission_id, 'JS-123');
  assert.equal(result.submitted_at, '2026-08-02T13:00:00.000Z');
});

test('normalizeSubmission rejects a filled honeypot', () => {
  assert.throws(
    () => normalizeSubmission({ origin: 'Fillimi', website: 'spam.example' }, { submissionId: 'JS-1', submittedAt: 'now' }),
    /submission rejected/i,
  );
});

test('createResponseText produces a readable Albanian handoff without HTML', () => {
  const text = createResponseText({
    submission_id: 'JS-123',
    submitted_at: '2026-08-02T13:00:00.000Z',
    origin: '<b>Historia</b>',
    public_identity: 'Terapist',
  });
  assert.match(text, /PËRGJIGJET STRATEGJIKE/);
  assert.match(text, /JS-123/);
  assert.match(text, /Historia/);
  assert.doesNotMatch(text, /<b>/);
});

test('containsClinicalDataWarning flags likely identifiable clinical content', () => {
  assert.equal(containsClinicalDataWarning('Klienti im quhet Filan dhe ka diagnozë depresioni.'), true);
  assert.equal(containsClinicalDataWarning('Dua të ndihmoj njerëzit me më shumë qartësi.'), false);
  assert.equal(containsClinicalDataWarning('Nuk bëj diagnoza dhe i referoj rastet kur kërkohet kujdes tjetër.'), false);
});

test('calculateProgress clamps values between 0 and 100', () => {
  assert.equal(calculateProgress(0, 6), 0);
  assert.equal(calculateProgress(3, 6), 50);
  assert.equal(calculateProgress(9, 6), 100);
});

test('draft envelope restores only within the 24 hour retention window', () => {
  const savedAt = Date.parse('2026-08-02T12:00:00.000Z');
  const envelope = createDraftEnvelope({ origin: 'Historia' }, savedAt);
  assert.deepEqual(readDraftEnvelope(JSON.stringify(envelope), savedAt + 23 * 60 * 60 * 1000), { origin: 'Historia' });
  assert.equal(readDraftEnvelope(JSON.stringify(envelope), savedAt + 25 * 60 * 60 * 1000), null);
});

test('malformed draft data is rejected instead of restored', () => {
  assert.equal(readDraftEnvelope('{bad-json', Date.now()), null);
  assert.equal(readDraftEnvelope(JSON.stringify({ savedAt: 'wrong', data: [] }), Date.now()), null);
});

test('draft expiry delay reaches zero at the retention boundary', () => {
  const savedAt = Date.parse('2026-08-02T12:00:00.000Z');
  const raw = JSON.stringify(createDraftEnvelope({ origin: 'Historia' }, savedAt));
  assert.equal(getDraftExpiryDelay(raw, savedAt + 23 * 60 * 60 * 1000), 60 * 60 * 1000);
  assert.equal(getDraftExpiryDelay(raw, savedAt + 24 * 60 * 60 * 1000), 0);
  assert.equal(getDraftExpiryDelay('{bad-json', savedAt), 0);
});
