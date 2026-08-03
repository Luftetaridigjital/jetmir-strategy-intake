import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profileDir = mkdtempSync(join(tmpdir(), 'jetmir-intake-e2e-'));
const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], { cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore' });
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9342', `--user-data-dir=${profileDir}`, 'http://127.0.0.1:4173/index.html'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function stopProcess(child) {
  if (child.exitCode !== null) return;
  let exited = once(child, 'exit');
  child.kill('SIGTERM');
  await Promise.race([exited, sleep(2000)]);
  if (child.exitCode === null) {
    exited = once(child, 'exit');
    child.kill('SIGKILL');
    await Promise.race([exited, sleep(2000)]);
  }
}
let ws;
try {
  let targets = [];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      targets = await (await fetch('http://127.0.0.1:9342/json')).json();
      if (targets.some((target) => target.type === 'page')) break;
    } catch {}
    await sleep(200);
  }
  const page = targets.find((target) => target.type === 'page');
  assert.ok(page, 'Chrome page target should exist');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const nextId = ++id;
    pending.set(nextId, resolve);
    ws.send(JSON.stringify({ id: nextId, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text);
    return response.result.result.value;
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });
  await send('Page.reload', { ignoreCache: true });
  await sleep(900);

  const initial = await evaluate(`({
    title: document.title,
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    activeStep: document.querySelector('.step.active')?.dataset.step,
    progress: document.querySelector('#progressBar').style.width
  })`);
  assert.equal(initial.title, 'Strategic Business Diagnostic — Jetmir Sefa');
  assert.equal(initial.width, 390);
  assert.equal(initial.scrollWidth, 390);
  assert.equal(initial.activeStep, '1');
  assert.equal(initial.progress, '20%');

  const invalid = await evaluate(`(() => {
    document.querySelector('#nextButton').click();
    return {
      businessPurpose: document.querySelector('#business_purpose').getAttribute('aria-invalid'),
      status: document.querySelector('#formStatus').textContent
    };
  })()`);
  assert.equal(invalid.businessPurpose, 'true');
  assert.match(invalid.status, /Plotëso fushat/);

  const clinical = await evaluate(`(() => {
    const field=document.querySelector('#business_purpose');
    field.value='Klienti im quhet Filan dhe ka diagnozë depresioni.';
    field.dispatchEvent(new Event('input',{bubbles:true}));
    return document.querySelector('#clinicalWarning').classList.contains('show');
  })()`);
  assert.equal(clinical, true);

  const completed = await evaluate(`(async () => {
    const values={
      business_purpose:'E nisa për të ndërtuar një proces autentik dhe të qëndrueshëm.',
      brand_meaning:'Një ekosistem i kombinuar',
      public_position:'Terapist me qasje të integruar dhe kufij të qartë.',
      non_negotiables:'Autenticiteti, etika dhe standardi i punës.',
      credentials:'Trajnime dhe certifikime të dokumentuara.',
      ideal_client:'Të rritur që kërkojnë qartësi dhe janë të gatshëm për proces.',
      client_start:'Vijnë pa qartësi dhe pa një rrugë të strukturuar.',
      desired_outcome:'Qartësi, stabilitet dhe një proces i zbatueshëm.',
      method_process:'Kontakt, vlerësim i përshtatshmërisë, proces i strukturuar dhe integrim.',
      differentiator:'Kombinimi i përvojës, strukturës dhe qasjes personale.',
      fit_boundaries:'Përcaktohet pas vlerësimit dhe referohet kur kërkohet kujdes tjetër.',
      markets_languages:'Zvicër, Kosovë dhe diasporë në gjuhën shqipe.',
      primary_offer:'Program individual, 8 javë, €1,000.',
      offer_portfolio:'Program individual | €1,000 | 8 | 60% | 12 orë | 60–79%\\nProgram grupor | €300 | 12 | 25% | 8 orë | 40–59%',
      monthly_revenue_range:'€10,000–€25,000',
      offer_economics_visibility:'I njoh pjesërisht',
      primary_offer_margin_range:'60–79%',
      weekly_capacity:'11–20',
      current_weekly_load:'6–10',
      current_delivery_hours:'21–30 orë',
      backlog_status:'Ka raste të rralla kur mbushet kapaciteti',
      primary_acquisition_channel:'Instagram organik',
      customer_journey:'Instagram, mesazh privat, telefonatë, pagesë dhe onboarding.',
      monthly_leads_range:'31–75',
      lead_to_client_conversion_range:'25–39%',
      sales_process:'Jetmiri zhvillon telefonatën dhe mbyll marrëveshjen.',
      proof_readiness:'Ka dëshmi, por jo sistem',
      vision_12m:'Një brand i qartë me ekip dhe procese të dokumentuara.',
      priority_90d:'Qartësimi i pozicionimit dhe ofertave.',
      primary_bottleneck:'Oferta',
      founder_dependency:'Shitja dhe delivery varen nga Jetmiri.',
      delegation_opportunity:'Follow-up, operimi dhe raportimi kalojnë te ekipi.',
      team_and_systems:'Një asistent dhe mjete bazë për booking e pagesa.',
      success_definition:'Një ofertë kryesore, customer journey i matshëm dhe më pak varësi.',
      implementation_readiness:'Gati, por me faza dhe prioritete'
    };
    for(const [name,value] of Object.entries(values)){
      const field=document.querySelector('[name="'+name+'"]');
      field.value=value; field.dispatchEvent(new Event('input',{bubbles:true}));
    }
    document.querySelector('#consent_accuracy').click();
    for(let i=0;i<4;i++) document.querySelector('#nextButton').click();

    window.fetch = async (_url, options) => {
      window.__failedSubmissionId = JSON.parse(options.body).submission_id;
      throw new Error('offline');
    };
    document.querySelector('#submitButton').click();
    await new Promise(resolve => setTimeout(resolve, 500));
    const failedAttempt = {
      formStillVisible:!document.querySelector('#intakeForm').hidden,
      successHidden:!document.querySelector('#successPanel').classList.contains('active'),
      draftPreserved:sessionStorage.getItem('jetmir-strategic-diagnostic-v2')?.length>20,
      retryMessage:/mund të provosh përsëri/.test(document.querySelector('#formStatus').textContent)
    };

    window.fetch = async (url, options) => {
      window.__submissionReceipt = { url, payload: JSON.parse(options.body) };
      return { ok: true, json: async () => ({ success: 'true', message: 'Email sent' }) };
    };
    document.querySelector('#submitButton').click();
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      failedAttempt,
      activeSuccess:document.querySelector('#successPanel').classList.contains('active'),
      formHidden:document.querySelector('#intakeForm').hidden,
      textHref:document.querySelector('#downloadText').href.startsWith('blob:'),
      jsonHref:document.querySelector('#downloadJson').href.startsWith('blob:'),
      storage:sessionStorage.getItem('jetmir-strategic-diagnostic-v2')?.length>20,
      coverage:document.querySelector('#coverageLabel').textContent,
      completedMapItems:document.querySelectorAll('.map-item.done').length,
      networkSubmitted:window.__submissionReceipt?.url==='https://formsubmit.co/ajax/mail@arlindberisha.info',
      submissionId:window.__submissionReceipt?.payload?.submission_id?.startsWith('JS-'),
      retryUsedSameId:window.__submissionReceipt?.payload?.submission_id===window.__failedSubmissionId,
      scrollWidth:document.documentElement.scrollWidth,
      width:innerWidth
    };
  })()`);
  assert.deepEqual(completed, {
    failedAttempt: { formStillVisible: true, successHidden: true, draftPreserved: true, retryMessage: true },
    activeSuccess: true,
    formHidden: true,
    textHref: true,
    jsonHref: true,
    storage: false,
    coverage: '100% e hartës',
    completedMapItems: 4,
    networkSubmitted: true,
    submissionId: true,
    retryUsedSameId: true,
    scrollWidth: 390,
    width: 390
  });
  assert.deepEqual(exceptions, []);

  await evaluate(`location.href='http://127.0.0.1:4173/process.html'`);
  await sleep(700);
  const processPage = await evaluate(`({
    title:document.title,
    phases:document.querySelectorAll('.phase-card').length,
    width:innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    handover:document.body.textContent.includes('Handover & Project Closure')
  })`);
  assert.deepEqual(processPage, { title: 'Procesi Strategjik — Jetmir Sefa', phases: 8, width: 390, scrollWidth: 390, handover: true });

  await evaluate(`location.href='http://127.0.0.1:4173/tests/frame-wrapper.html'`);
  await sleep(500);
  const frameGuard = await evaluate(`(() => {
    const frame = document.querySelector('iframe');
    const body = frame.contentDocument?.body;
    return { framed: Boolean(body), display: body ? getComputedStyle(body).display : null };
  })()`);
  assert.deepEqual(frameGuard, { framed: true, display: 'none' });
  console.log(JSON.stringify({ initial, invalid, clinical, completed, processPage, exceptions }, null, 2));
} finally {
  ws?.close();
  await stopProcess(browser);
  await stopProcess(server);
  rmSync(profileDir, { recursive: true, force: true });
}
