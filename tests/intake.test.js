import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_FIELDS,
  DIAGNOSTIC_CHAPTERS,
  validateStep,
  normalizeSubmission,
  createResponseText,
  containsClinicalDataWarning,
  calculateProgress,
  createDraftEnvelope,
  readDraftEnvelope,
  getDraftExpiryDelay,
  calculateDiagnosticCoverage,
} from '../assets/intake.js';

test('required fields are defined for every strategic decision area', () => {
  assert.deepEqual(REQUIRED_FIELDS, [
    'business_purpose',
    'brand_meaning',
    'public_position',
    'non_negotiables',
    'credentials',
    'ideal_client',
    'client_start',
    'desired_outcome',
    'method_process',
    'differentiator',
    'fit_boundaries',
    'markets_languages',
    'primary_offer',
    'offer_portfolio',
    'monthly_revenue_range',
    'offer_economics_visibility',
    'primary_offer_margin_range',
    'weekly_capacity',
    'current_weekly_load',
    'current_delivery_hours',
    'backlog_status',
    'primary_acquisition_channel',
    'customer_journey',
    'monthly_leads_range',
    'lead_to_client_conversion_range',
    'sales_process',
    'proof_readiness',
    'vision_12m',
    'priority_90d',
    'primary_bottleneck',
    'founder_dependency',
    'delegation_opportunity',
    'team_and_systems',
    'success_definition',
    'implementation_readiness',
    'consent_accuracy',
  ]);
});

test('diagnostic chapters cover identity, market, economics, engine and mandate', () => {
  assert.deepEqual(DIAGNOSTIC_CHAPTERS.map(({ id }) => id), ['foundation', 'method', 'model', 'engine', 'mandate']);
  assert.equal(new Set(DIAGNOSTIC_CHAPTERS.flatMap(({ fields }) => fields)).size, REQUIRED_FIELDS.length - 1);
});

test('validateStep returns field names that are missing', () => {
  const fields = ['business_purpose', 'public_position'];
  assert.deepEqual(validateStep(fields, { business_purpose: 'Historia ime' }), ['public_position']);
});

test('validateStep trims whitespace before accepting a required answer', () => {
  assert.deepEqual(validateStep(['business_purpose'], { business_purpose: '   ' }), ['business_purpose']);
});

test('normalizeSubmission only keeps allowlisted fields and adds metadata', () => {
  const result = normalizeSubmission(
    { business_purpose: 'Fillimi', injected: '<script>bad</script>', website: '' },
    { submissionId: 'JS-123', submittedAt: '2026-08-02T13:00:00.000Z' },
  );
  assert.equal(result.business_purpose, 'Fillimi');
  assert.equal(result.injected, undefined);
  assert.equal(result.submission_id, 'JS-123');
  assert.equal(result.submitted_at, '2026-08-02T13:00:00.000Z');
});

test('normalizeSubmission rejects a filled honeypot', () => {
  assert.throws(
    () => normalizeSubmission({ business_purpose: 'Fillimi', website: 'spam.example' }, { submissionId: 'JS-1', submittedAt: 'now' }),
    /submission rejected/i,
  );
});

test('createResponseText produces a readable Albanian handoff without HTML', () => {
  const text = createResponseText({
    submission_id: 'JS-123',
    submitted_at: '2026-08-02T13:00:00.000Z',
    business_purpose: '<b>Historia</b>',
    public_position: 'Terapist',
  });
  assert.match(text, /STRATEGIC BUSINESS DIAGNOSTIC/);
  assert.match(text, /JS-123/);
  assert.match(text, /Historia/);
  assert.doesNotMatch(text, /<b>/);
});

test('createResponseText emits final context and consent exactly once', () => {
  const text = createResponseText({
    submission_id: 'JS-1',
    submitted_at: 'now',
    additional_context: 'Kontekst final',
    consent_accuracy: true,
  });
  assert.equal((text.match(/Kontekst tjetër që Arlindi duhet ta dijë/g) || []).length, 1);
  assert.equal((text.match(/Konfirmimi i saktësisë dhe privatësisë/g) || []).length, 1);
});

test('containsClinicalDataWarning flags likely identifiable clinical content', () => {
  assert.equal(containsClinicalDataWarning('Klienti im quhet Filan dhe ka diagnozë depresioni.'), true);
  assert.equal(containsClinicalDataWarning('Kontakti i tij është person@example.com dhe +383 44 123 456.'), true);
  assert.equal(containsClinicalDataWarning('Emri i saj është Filane dhe banon në Rrugën X.'), true);
  assert.equal(containsClinicalDataWarning('Datëlindja është 02.03.1990 dhe numri personal është 1234567890.'), true);
  assert.equal(containsClinicalDataWarning('Dua të ndihmoj njerëzit me më shumë qartësi.'), false);
  assert.equal(containsClinicalDataWarning('Nuk bëj diagnoza dhe i referoj rastet kur kërkohet kujdes tjetër.'), false);
  assert.equal(containsClinicalDataWarning('Të ardhurat janë €10,000–€25,000 dhe shërbej në Kosovë e Zvicër.'), false);
});

test('calculateProgress clamps values between 0 and 100', () => {
  assert.equal(calculateProgress(0, 5), 0);
  assert.equal(calculateProgress(3, 5), 60);
  assert.equal(calculateProgress(9, 5), 100);
});

test('diagnostic coverage measures answered required business signals, not business quality', () => {
  const empty = calculateDiagnosticCoverage({});
  assert.deepEqual(empty, { answered: 0, total: REQUIRED_FIELDS.length - 1, percent: 0 });
  const partial = calculateDiagnosticCoverage({ business_purpose: 'Qëllimi', brand_meaning: 'Platformë' });
  assert.equal(partial.answered, 2);
  assert.equal(partial.total, REQUIRED_FIELDS.length - 1);
  assert.ok(partial.percent > 0 && partial.percent < 100);
});

test('draft envelope restores only within the 24 hour retention window', () => {
  const savedAt = Date.parse('2026-08-02T12:00:00.000Z');
  const envelope = createDraftEnvelope({ business_purpose: 'Historia' }, savedAt);
  assert.deepEqual(readDraftEnvelope(JSON.stringify(envelope), savedAt + 23 * 60 * 60 * 1000), { business_purpose: 'Historia' });
  assert.equal(readDraftEnvelope(JSON.stringify(envelope), savedAt + 25 * 60 * 60 * 1000), null);
});

test('malformed draft data is rejected instead of restored', () => {
  assert.equal(readDraftEnvelope('{bad-json', Date.now()), null);
  assert.equal(readDraftEnvelope(JSON.stringify({ savedAt: 'wrong', data: [] }), Date.now()), null);
});

test('draft expiry delay reaches zero at the retention boundary', () => {
  const savedAt = Date.parse('2026-08-02T12:00:00.000Z');
  const raw = JSON.stringify(createDraftEnvelope({ business_purpose: 'Historia' }, savedAt));
  assert.equal(getDraftExpiryDelay(raw, savedAt + 23 * 60 * 60 * 1000), 60 * 60 * 1000);
  assert.equal(getDraftExpiryDelay(raw, savedAt + 24 * 60 * 60 * 1000), 0);
  assert.equal(getDraftExpiryDelay('{bad-json', savedAt), 0);
});
