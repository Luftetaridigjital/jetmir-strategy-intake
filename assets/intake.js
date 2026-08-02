export const REQUIRED_FIELDS = [
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
];

export const FIELD_ORDER = [
  'origin', 'calling_moment', 'public_identity', 'identity_boundaries', 'terapia_meaning',
  'credentials', 'method_process', 'unique_elements', 'fit_boundaries', 'referral_rules',
  'supported_results', 'ideal_client', 'client_start', 'desired_change', 'markets_languages',
  'client_objections', 'active_offers', 'strongest_transformation', 'best_economics',
  'energy_drain', 'personal_only', 'delegatable', 'weekly_capacity', 'stop_merge_rename',
  'proof_examples', 'testimonial_consent', 'voice_topics', 'public_boundaries',
  'vision_12m', 'content_hours', 'delivery_hours', 'team_roles', 'current_tools',
  'priority_90d', 'ai_boundaries', 'data_pack_ready', 'additional_context', 'consent_accuracy',
];

export const FIELD_LABELS = {
  origin: 'Pse e nise këtë punë?',
  calling_moment: 'Cili moment të bindi se kjo ishte thirrja jote?',
  public_identity: 'Si dëshiron të përshkruhesh publikisht?',
  identity_boundaries: 'Si nuk dëshiron të përshkruhesh kurrë?',
  terapia_meaning: 'Çfarë do të thotë “Terapia e Jetës” për ty?',
  credentials: 'Titujt, certifikimet dhe trajnimet që mund të komunikohen',
  method_process: 'Procesi yt nga kontakti i parë deri te integrimi',
  unique_elements: 'Elementet e qasjes që janë vërtet të tuat',
  fit_boundaries: 'Për cilat raste je right fit dhe për cilat jo?',
  referral_rules: 'Kur e referon dikë te profesionistë të tjerë?',
  supported_results: 'Rezultatet që mund t’i mbështesësh me evidencë',
  ideal_client: 'Kush përfiton më shumë nga puna jote?',
  client_start: 'Me çfarë situate vijnë zakonisht?',
  desired_change: 'Çfarë duan të ndiejnë ose arrijnë?',
  markets_languages: 'Shtetet dhe gjuhët ku shërben',
  client_objections: 'Frika ose keqkuptimi para se të kërkojnë ndihmë',
  active_offers: 'Ofertat aktive: çmimi, formati, kohëzgjatja dhe kapaciteti',
  strongest_transformation: 'Oferta me transformimin më të fortë',
  best_economics: 'Oferta më e qëndrueshme financiarisht',
  energy_drain: 'Oferta që merr më shumë energji',
  personal_only: 'Çfarë duhet ta bësh vetëm ti?',
  delegatable: 'Çfarë mund t’ia delegosh ekipit?',
  weekly_capacity: 'Kapaciteti pa ulur standardin',
  stop_merge_rename: 'Çfarë dëshiron të ndalosh, bashkosh ose riemërtosh?',
  proof_examples: 'Tri histori që përfaqësojnë punën tënde',
  testimonial_consent: 'Lejet për testimoniale, foto dhe video',
  voice_topics: 'Temat që dëshiron t’i thuash vetëm me zërin tënd',
  public_boundaries: 'Temat ose detajet jashtë kufirit publik',
  vision_12m: 'Si duket puna pas 12 muajsh?',
  content_hours: 'Orët javore për content',
  delivery_hours: 'Orët javore për delivery',
  team_roles: 'Ekipi aktual dhe përgjegjësitë',
  current_tools: 'Mjetet për leads, booking, pagesa, email dhe klientë',
  priority_90d: 'Problemi numër një për 90 ditët e ardhshme',
  ai_boundaries: 'Çfarë mund dhe nuk mund t’i besohet AI-së?',
  data_pack_ready: 'Cilat të dhëna biznesore mund t’i ndani?',
  additional_context: 'Kontekst tjetër që duhet ta dimë',
  consent_accuracy: 'Konfirmimi i saktësisë dhe privatësisë',
};

const stripTags = (value) => String(value ?? '').replace(/<[^>]*>/g, '').trim();

export function validateStep(fieldNames, data) {
  return fieldNames.filter((name) => {
    const value = data[name];
    if (typeof value === 'boolean') return value !== true;
    return stripTags(value).length === 0;
  });
}

export function normalizeSubmission(formData, metadata) {
  if (stripTags(formData.website)) throw new Error('Submission rejected');
  const normalized = {
    submission_id: stripTags(metadata.submissionId),
    submitted_at: stripTags(metadata.submittedAt),
  };
  for (const field of FIELD_ORDER) {
    if (!(field in formData)) continue;
    normalized[field] = typeof formData[field] === 'boolean'
      ? formData[field]
      : stripTags(formData[field]);
  }
  return normalized;
}

export function createResponseText(submission) {
  const lines = [
    'PËRGJIGJET STRATEGJIKE — JETMIR SEFA',
    'Përgatitur për Arlind Berisha × Zoom Growth',
    '',
    `ID: ${stripTags(submission.submission_id)}`,
    `Dërguar më: ${stripTags(submission.submitted_at)}`,
    '',
  ];
  for (const field of FIELD_ORDER) {
    if (!(field in submission)) continue;
    const value = typeof submission[field] === 'boolean'
      ? (submission[field] ? 'Po' : 'Jo')
      : stripTags(submission[field]);
    if (!value) continue;
    lines.push(FIELD_LABELS[field] || field, value, '');
  }
  lines.push('Shënim privatësie: Ky dokument nuk duhet të përmbajë emra, diagnoza ose detaje identifikuese të klientëve.');
  return lines.join('\n');
}

export function containsClinicalDataWarning(text) {
  const value = String(text ?? '').toLocaleLowerCase('sq');
  const directIdentifiers = /(klient(?:i|ja)? (?:im|ime) quhet|pacient(?:i|ja)? (?:im|ime) quhet|num[ëe]r personal|adresa e (?:tij|saj)|telefon(?:i)? i (?:tij|saj)|email(?:i)? i (?:tij|saj))/i;
  const caseDiagnosis = /(?:klient|pacient).{0,80}diagnoz|diagnoz.{0,80}(?:klient|pacient)/i;
  return directIdentifiers.test(value) || caseDiagnosis.test(value);
}

export function calculateProgress(currentStep, totalSteps) {
  if (!Number.isFinite(totalSteps) || totalSteps <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((currentStep / totalSteps) * 100)));
}

export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export function createDraftEnvelope(data, savedAt = Date.now()) {
  return { savedAt, data };
}

export function readDraftEnvelope(raw, now = Date.now()) {
  try {
    const envelope = JSON.parse(raw || 'null');
    const isObject = envelope?.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data);
    const isFresh = Number.isFinite(envelope?.savedAt) && now - envelope.savedAt >= 0 && now - envelope.savedAt <= DRAFT_TTL_MS;
    return isObject && isFresh ? envelope.data : null;
  } catch {
    return null;
  }
}

export function getDraftExpiryDelay(raw, now = Date.now()) {
  try {
    const envelope = JSON.parse(raw || 'null');
    if (!Number.isFinite(envelope?.savedAt)) return 0;
    return Math.max(0, Math.min(DRAFT_TTL_MS, envelope.savedAt + DRAFT_TTL_MS - now));
  } catch {
    return 0;
  }
}
