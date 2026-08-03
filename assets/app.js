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
  calculateDiagnosticCoverage,
} from './intake.js';
import { submitResponse } from './submission.js';

const STORAGE_KEY = 'jetmir-strategic-diagnostic-v2';
const form = document.querySelector('#intakeForm');
const steps = [...document.querySelectorAll('.step')];
const dots = [...document.querySelectorAll('.step-dot')];
const mapItems = [...document.querySelectorAll('.map-item')];
const nextButton = document.querySelector('#nextButton');
const backButton = document.querySelector('#backButton');
const submitButton = document.querySelector('#submitButton');
const progressBar = document.querySelector('#progressBar');
const progressOrbit = document.querySelector('#progressOrbit');
const progressPercent = document.querySelector('#progressPercent');
const stepLabel = document.querySelector('#stepLabel');
const stageMessage = document.querySelector('#stageMessage');
const coverageLabel = document.querySelector('#coverageLabel');
const progressWrap = document.querySelector('.progress-wrap');
const status = document.querySelector('#formStatus');
const clinicalWarning = document.querySelector('#clinicalWarning');
const successPanel = document.querySelector('#successPanel');
const shareButton = document.querySelector('#shareButton');
const downloadText = document.querySelector('#downloadText');
const downloadJson = document.querySelector('#downloadJson');
const clearDataButton = document.querySelector('#clearDataButton');
let currentStep = 0;
let preparedFiles = [];
let objectUrls = [];
let expiryTimer;
let pendingSubmission;

function clearDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
  clearTimeout(expiryTimer);
}

function scheduleDraftExpiry(raw) {
  clearTimeout(expiryTimer);
  const delay = getDraftExpiryDelay(raw);
  if (delay <= 0) {
    clearDraft();
    return;
  }
  expiryTimer = setTimeout(clearDraft, delay);
}

function collectData() {
  const data = {};
  for (const element of form.elements) {
    if (!element.name) continue;
    data[element.name] = element.type === 'checkbox' ? element.checked : element.value;
  }
  return data;
}

function persistDraft() {
  try {
    const raw = JSON.stringify(createDraftEnvelope(collectData()));
    sessionStorage.setItem(STORAGE_KEY, raw);
    scheduleDraftExpiry(raw);
  } catch {
    status.textContent = 'Autosave nuk është i disponueshëm në këtë pajisje. Mund të vazhdosh dhe t’i shkarkosh përgjigjet në fund.';
  }
}

function updateCoverage(data = collectData()) {
  const coverage = calculateDiagnosticCoverage(data);
  coverageLabel.textContent = `${coverage.percent}% e hartës`;
  return coverage;
}

function restoreDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const saved = readDraftEnvelope(raw);
    if (!saved) {
      clearDraft();
      return;
    }
    scheduleDraftExpiry(raw);
    for (const [name, value] of Object.entries(saved)) {
      const field = form.elements.namedItem(name);
      if (!field) continue;
      if (field.type === 'checkbox') field.checked = value === true;
      else field.value = String(value ?? '');
    }
  } catch {
    clearDraft();
  }
}

function updateClinicalWarning() {
  const risky = [...form.querySelectorAll('textarea')].some((field) => containsClinicalDataWarning(field.value));
  clinicalWarning.classList.toggle('show', risky);
  return risky;
}

function renderStep(index, shouldScroll = true) {
  const previousStep = currentStep;
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((step, position) => step.classList.toggle('active', position === currentStep));
  dots.forEach((dot, position) => {
    dot.classList.toggle('active', position === currentStep);
    dot.classList.toggle('done', position < currentStep);
  });
  mapItems.forEach((item, position) => {
    item.classList.toggle('active', position === currentStep);
    item.classList.toggle('done', position < currentStep);
    item.setAttribute('aria-current', position === currentStep ? 'step' : 'false');
  });
  const percent = calculateProgress(currentStep + 1, steps.length);
  progressBar.style.width = `${percent}%`;
  progressOrbit.style.setProperty('--progress', `${percent}%`);
  progressPercent.textContent = `${percent}%`;
  stepLabel.textContent = `Shtylla ${currentStep + 1} nga ${steps.length}`;
  const currentName = steps[currentStep].dataset.stageName;
  const previousName = steps[previousStep]?.dataset.stageName;
  stageMessage.textContent = currentStep > previousStep
    ? `${previousName} u qartësua. Tani: ${currentName}.`
    : `Po qartësojmë ${currentName.toLocaleLowerCase('sq')}.`;
  backButton.hidden = currentStep === 0;
  nextButton.hidden = currentStep === steps.length - 1;
  if (currentStep < steps.length - 1) nextButton.textContent = `Vazhdo te ${steps[currentStep + 1].dataset.stageName}`;
  submitButton.hidden = currentStep !== steps.length - 1;
  status.textContent = '';
  if (shouldScroll) progressWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function requiredNamesForStep(step) {
  return [...step.querySelectorAll('[data-required]')].map((field) => field.name);
}

function showValidation(missing) {
  for (const field of form.querySelectorAll('[data-required]')) {
    const invalid = missing.includes(field.name);
    field.setAttribute('aria-invalid', String(invalid));
    const error = field.closest('.field')?.querySelector('.error');
    if (error) error.classList.toggle('show', invalid);
  }
  if (missing.length) {
    const first = form.elements.namedItem(missing[0]);
    first?.focus();
    status.textContent = 'Plotëso fushat e shënuara para se të vazhdosh.';
    return false;
  }
  return true;
}

function validateCurrentStep() {
  const data = collectData();
  return showValidation(validateStep(requiredNamesForStep(steps[currentStep]), data));
}

function createSubmissionId() {
  const token = globalThis.crypto?.randomUUID?.().slice(0, 8).toUpperCase()
    || Math.random().toString(36).slice(2, 10).toUpperCase();
  return `JS-${token}`;
}

function revokeObjectUrls() {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls = [];
}

function prepareHandoff(submission) {
  revokeObjectUrls();
  const responseText = createResponseText(submission);
  const safeId = submission.submission_id.replace(/[^A-Z0-9-]/gi, '');
  const textFile = new File([responseText], `Jetmir-Sefa-Pergjigjet-${safeId}.txt`, { type: 'text/plain;charset=utf-8' });
  const jsonFile = new File([JSON.stringify(submission, null, 2)], `Jetmir-Sefa-Pergjigjet-${safeId}.json`, { type: 'application/json' });
  preparedFiles = [textFile, jsonFile];

  const textUrl = URL.createObjectURL(textFile);
  const jsonUrl = URL.createObjectURL(jsonFile);
  objectUrls.push(textUrl, jsonUrl);
  downloadText.href = textUrl;
  downloadText.download = textFile.name;
  downloadJson.href = jsonUrl;
  downloadJson.download = jsonFile.name;

  const canShareFiles = navigator.canShare?.({ files: preparedFiles }) === true;
  shareButton.hidden = !canShareFiles;
}

nextButton.addEventListener('click', () => {
  if (!validateCurrentStep() || updateClinicalWarning()) {
    if (clinicalWarning.classList.contains('show')) status.textContent = 'Largo të dhënat potencialisht private para se të vazhdosh.';
    return;
  }
  persistDraft();
  renderStep(currentStep + 1);
});

backButton.addEventListener('click', () => {
  persistDraft();
  renderStep(currentStep - 1);
});

form.addEventListener('input', () => {
  pendingSubmission = undefined;
  persistDraft();
  updateClinicalWarning();
  updateCoverage();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = collectData();
  const missing = validateStep(REQUIRED_FIELDS, data);
  if (!showValidation(missing)) {
    const firstMissingStep = steps.findIndex((step) => requiredNamesForStep(step).some((name) => missing.includes(name)));
    if (firstMissingStep >= 0) renderStep(firstMissingStep);
    return;
  }
  if (updateClinicalWarning()) {
    status.textContent = 'Largo të dhënat potencialisht private para se të përfundosh.';
    return;
  }

  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Duke dërguar në mënyrë të sigurt…';
  status.textContent = 'Po dërgohen përgjigjet. Mos e mbyll këtë faqe.';

  try {
    const submission = pendingSubmission || normalizeSubmission(data, {
      submissionId: createSubmissionId(),
      submittedAt: new Date().toISOString(),
    });
    pendingSubmission = submission;
    await submitResponse(submission);
    prepareHandoff(submission);
    clearDraft();
    status.textContent = '';
    form.hidden = true;
    progressWrap.hidden = true;
    successPanel.classList.add('active');
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    status.textContent = `${error?.message || 'Dërgimi dështoi.'} Mos e rifresko faqen; përgjigjet janë ende këtu dhe mund të provosh përsëri.`;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
});

shareButton.addEventListener('click', async () => {
  if (!preparedFiles.length) return;
  try {
    await navigator.share({
      title: 'Strategic Business Diagnostic — Jetmir Sefa',
      text: 'Dosja strategjike për analizë nga Arlind Berisha.',
      files: preparedFiles,
    });
  } catch (error) {
    if (error?.name !== 'AbortError') {
      shareButton.hidden = true;
    }
  }
});

clearDataButton.addEventListener('click', () => {
  clearDraft();
  form.reset();
  revokeObjectUrls();
  preparedFiles = [];
  clearDataButton.textContent = 'Drafti i shfletuesit është i pastër';
  clearDataButton.disabled = true;
});

restoreDraft();
updateClinicalWarning();
updateCoverage();
renderStep(0, false);
