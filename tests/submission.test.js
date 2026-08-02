import test from 'node:test';
import assert from 'node:assert/strict';
import { submitResponse, FORM_ENDPOINT } from '../assets/submission.js';

test('submitResponse accepts only a successful FormSubmit receipt', async () => {
  const result = await submitResponse({ submission_id: 'JS-TEST' }, async (url, options) => {
    assert.equal(url, FORM_ENDPOINT);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    const payload = JSON.parse(options.body);
    assert.equal(payload.submission_id, 'JS-TEST');
    assert.equal(payload._subject, 'Jetmir Sefa — Përgjigje të reja strategjike');
    return { ok: true, json: async () => ({ success: 'true', message: 'Email sent' }) };
  });
  assert.equal(result.accepted, true);
});

test('submitResponse fails closed on provider rejection or network failure', async () => {
  await assert.rejects(
    () => submitResponse({}, async () => ({ ok: false, status: 500, json: async () => ({ success: 'false' }) })),
    /nuk u pranua/i,
  );
  await assert.rejects(
    () => submitResponse({}, async () => { throw new Error('offline'); }),
    /lidhja dështoi/i,
  );
});
