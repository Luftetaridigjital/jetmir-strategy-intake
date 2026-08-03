export const DIAGNOSTIC_CHAPTERS = [
  {
    id: 'foundation',
    title: 'Themeli',
    fields: ['business_purpose', 'brand_meaning', 'public_position', 'non_negotiables', 'credentials'],
  },
  {
    id: 'method',
    title: 'Metoda',
    fields: ['ideal_client', 'client_start', 'desired_outcome', 'method_process', 'differentiator', 'fit_boundaries', 'markets_languages'],
  },
  {
    id: 'model',
    title: 'Modeli',
    fields: ['primary_offer', 'offer_portfolio', 'monthly_revenue_range', 'offer_economics_visibility', 'primary_offer_margin_range', 'weekly_capacity', 'current_weekly_load', 'current_delivery_hours', 'backlog_status'],
  },
  {
    id: 'engine',
    title: 'Motori',
    fields: ['primary_acquisition_channel', 'customer_journey', 'monthly_leads_range', 'lead_to_client_conversion_range', 'sales_process', 'proof_readiness'],
  },
  {
    id: 'mandate',
    title: 'Mandati',
    fields: ['vision_12m', 'priority_90d', 'primary_bottleneck', 'founder_dependency', 'delegation_opportunity', 'team_and_systems', 'success_definition', 'implementation_readiness'],
  },
];

export const REQUIRED_FIELDS = [
  ...DIAGNOSTIC_CHAPTERS.flatMap(({ fields }) => fields),
  'consent_accuracy',
];

export const FIELD_ORDER = [
  'business_purpose', 'brand_meaning', 'public_position', 'non_negotiables', 'credentials',
  'ideal_client', 'client_start', 'desired_outcome', 'method_process', 'differentiator',
  'fit_boundaries', 'markets_languages', 'supported_results',
  'primary_offer', 'offer_portfolio', 'monthly_revenue_range', 'offer_economics_visibility',
  'primary_offer_margin_range', 'weekly_capacity', 'current_weekly_load',
  'current_delivery_hours', 'backlog_status', 'offer_focus',
  'primary_acquisition_channel', 'customer_journey', 'monthly_leads_range',
  'lead_to_client_conversion_range', 'sales_process', 'proof_readiness', 'client_objections',
  'vision_12m', 'priority_90d', 'primary_bottleneck', 'founder_dependency',
  'delegation_opportunity', 'team_and_systems', 'success_definition', 'implementation_readiness', 'public_boundaries',
  'additional_context', 'consent_accuracy',
];

export const FIELD_LABELS = {
  business_purpose: 'Pse ekziston kjo punë dhe çfarë dëshiron të ndryshojë?',
  brand_meaning: 'Çfarë është “Terapia e Jetës” në thelb?',
  public_position: 'Si duhet të kuptohet roli yt publik?',
  non_negotiables: 'Çfarë nuk duhet të humbasë gjatë rritjes?',
  credentials: 'Kualifikime, certifikime dhe trajnime që mund të komunikohen saktë',
  ideal_client: 'Kush është personi që përfiton më shumë?',
  client_start: 'Në çfarë gjendjeje ose situate hyn në proces?',
  desired_outcome: 'Çfarë ndryshimi kërkon të arrijë?',
  method_process: 'Si funksionon procesi yt real nga fillimi deri në fund?',
  differentiator: 'Çfarë e bën qasjen tënde të dallueshme?',
  fit_boundaries: 'Për kë është kjo punë dhe për kë nuk është?',
  markets_languages: 'Tregjet dhe gjuhët ku shërben',
  supported_results: 'Rezultatet që mund të mbështeten me evidencë',
  primary_offer: 'Oferta kryesore: emri, formati, kohëzgjatja dhe çmimi',
  offer_portfolio: 'Ekonomia e ofertave aktive: çmimi, shitjet, të ardhurat, koha dhe marzhi',
  monthly_revenue_range: 'Intervali aktual i të ardhurave mujore',
  offer_economics_visibility: 'Sa e qartë është ekonomia e ofertave?',
  primary_offer_margin_range: 'Marzhi i përafërt i ofertës kryesore',
  weekly_capacity: 'Kapaciteti javor pa ulur standardin',
  current_weekly_load: 'Ngarkesa aktuale javore me klientë',
  current_delivery_hours: 'Orët aktuale javore për realizimin e shërbimeve',
  backlog_status: 'Gjendja e listës së pritjes ose kërkesës së papërmbushur',
  offer_focus: 'Oferta që duhet të marrë fokus dhe ajo që duhet thjeshtuar',
  primary_acquisition_channel: 'Kanali kryesor nga vijnë klientët',
  customer_journey: 'Rruga aktuale nga kontakti i parë deri te pagesa dhe fillimi',
  monthly_leads_range: 'Intervali i kërkesave të reja mujore',
  lead_to_client_conversion_range: 'Sa kërkesa kthehen në klientë?',
  sales_process: 'Si merret vendimi i blerjes dhe kush e mbyll?',
  proof_readiness: 'Gjendja e provave dhe consent-it',
  client_objections: 'Pengesat ose dyshimet kryesore para blerjes',
  team_and_systems: 'Ekipi dhe sistemet që mbajnë operimin sot',
  vision_12m: 'Si duhet të duket biznesi pas 12 muajve?',
  priority_90d: 'Prioriteti numër një për 90 ditët e ardhshme',
  primary_bottleneck: 'Bllokuesi kryesor i rritjes sot',
  founder_dependency: 'Çfarë varet ende vetëm nga Jetmiri?',
  delegation_opportunity: 'Çfarë duhet të kalojë te ekipi ose sistemi?',
  success_definition: 'Si matet suksesi i këtij projekti?',
  implementation_readiness: 'Gatishmëria për implementim',
  public_boundaries: 'Temat dhe kufijtë që nuk duhet të kalohen publikisht',
  additional_context: 'Kontekst tjetër që Arlindi duhet ta dijë',
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

export function calculateDiagnosticCoverage(data) {
  const fields = REQUIRED_FIELDS.filter((field) => field !== 'consent_accuracy');
  const answered = fields.filter((field) => stripTags(data?.[field]).length > 0).length;
  return {
    answered,
    total: fields.length,
    percent: fields.length ? Math.round((answered / fields.length) * 100) : 0,
  };
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
    'STRATEGIC BUSINESS DIAGNOSTIC — JETMIR SEFA',
    'Për analizë nga Arlind Berisha, Business Coach & Strategic Architect',
    '',
    `ID: ${stripTags(submission.submission_id)}`,
    `Dërguar më: ${stripTags(submission.submitted_at)}`,
    '',
  ];
  for (const chapter of DIAGNOSTIC_CHAPTERS) {
    lines.push(`## ${chapter.title.toLocaleUpperCase('sq')}`, '');
    for (const field of FIELD_ORDER.filter((name) => chapter.fields.includes(name))) {
      if (!(field in submission)) continue;
      const value = stripTags(submission[field]);
      if (!value) continue;
      lines.push(FIELD_LABELS[field] || field, value, '');
    }
    const lastRequiredIndex = Math.max(...chapter.fields.map((field) => FIELD_ORDER.indexOf(field)));
    const nextRequiredIndex = DIAGNOSTIC_CHAPTERS[DIAGNOSTIC_CHAPTERS.indexOf(chapter) + 1]
      ? FIELD_ORDER.indexOf(DIAGNOSTIC_CHAPTERS[DIAGNOSTIC_CHAPTERS.indexOf(chapter) + 1].fields[0])
      : FIELD_ORDER.length;
    for (const field of FIELD_ORDER.slice(lastRequiredIndex + 1, nextRequiredIndex)) {
      if (!(field in submission)) continue;
      const value = typeof submission[field] === 'boolean' ? (submission[field] ? 'Po' : 'Jo') : stripTags(submission[field]);
      if (!value) continue;
      lines.push(FIELD_LABELS[field] || field, value, '');
    }
  }
  lines.push('Shënim privatësie: Ky dokument nuk duhet të përmbajë emra, diagnoza ose detaje identifikuese të klientëve.');
  return lines.join('\n');
}

export function containsClinicalDataWarning(text) {
  const value = String(text ?? '').toLocaleLowerCase('sq');
  const email = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
  const internationalPhone = /(?:\+|00)\d{1,3}[\s()./-]*(?:\d[\s()./-]*){6,}/;
  const labelledPhone = /(?:telefon|tel\.?|kontakt|whatsapp).{0,35}(?:\d[\s()./-]*){7,}/i;
  const directIdentifiers = /(?:klient(?:i|ja)?|pacient(?:i|ja)?).{0,45}(?:quhet|emri|telefoni|emaili|adresa)|(?:emri (?:i tij|i saj)|emri i klientit|emri i pacientit).{0,25}(?:është|eshte)|num[ëe]r personal|dat[ëe]lindj|banon n[ëe]|adresa e (?:tij|saj)|rruga e (?:tij|saj)/i;
  const caseDiagnosis = /(?:klient|pacient).{0,80}diagnoz|diagnoz.{0,80}(?:klient|pacient)/i;
  return email.test(value)
    || internationalPhone.test(value)
    || labelledPhone.test(value)
    || directIdentifiers.test(value)
    || caseDiagnosis.test(value);
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
