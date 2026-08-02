export const FORM_ENDPOINT = 'https://formsubmit.co/ajax/mail@arlindberisha.info';

export async function submitResponse(submission, fetchImpl = globalThis.fetch) {
  let response;
  try {
    response = await fetchImpl(FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...submission,
        _subject: 'Jetmir Sefa — Përgjigje të reja strategjike',
        _template: 'table',
        _captcha: 'false',
      }),
    });
  } catch {
    throw new Error('Lidhja dështoi. Përgjigjet nuk u dërguan.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // A non-JSON provider response is not a valid receipt.
  }

  if (!response.ok || ![true, 'true'].includes(data.success)) {
    throw new Error('Dërgimi nuk u pranua. Përgjigjet mbeten në formular.');
  }

  return { accepted: true, providerMessage: data.message || '' };
}
