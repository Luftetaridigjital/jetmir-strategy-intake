import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profileDir = mkdtempSync(join(tmpdir(), 'jetmir-intake-e2e-'));
const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], { cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore' });
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9342', `--user-data-dir=${profileDir}`, 'http://127.0.0.1:4173/index.html'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  assert.equal(initial.title, 'Intake Strategjik — Jetmir Sefa');
  assert.equal(initial.width, 390);
  assert.equal(initial.scrollWidth, 390);
  assert.equal(initial.activeStep, '1');
  assert.equal(initial.progress, '17%');

  const invalid = await evaluate(`(() => {
    document.querySelector('#nextButton').click();
    return {
      origin: document.querySelector('#origin').getAttribute('aria-invalid'),
      status: document.querySelector('#formStatus').textContent
    };
  })()`);
  assert.equal(invalid.origin, 'true');
  assert.match(invalid.status, /Plotëso fushat/);

  const clinical = await evaluate(`(() => {
    const field=document.querySelector('#calling_moment');
    field.value='Klienti im quhet Filan dhe ka diagnozë depresioni.';
    field.dispatchEvent(new Event('input',{bubbles:true}));
    return document.querySelector('#clinicalWarning').classList.contains('show');
  })()`);
  assert.equal(clinical, true);

  const completed = await evaluate(`(() => {
    const values={
      origin:'E nisa për të ndihmuar njerëzit me një proces autentik.',
      calling_moment:'Një moment profesional që ma qartësoi drejtimin.',
      public_identity:'Terapist me qasje të integruar dhe kufij të qartë.',
      identity_boundaries:'Nuk dëshiroj të prezantohem si psikolog ose psikiatër.',
      method_process:'Kontakt, vlerësim i përshtatshmërisë, proces i strukturuar dhe integrim.',
      fit_boundaries:'Përcaktohet pas vlerësimit dhe referohet kur kërkohet kujdes tjetër.',
      ideal_client:'Të rritur që kërkojnë qartësi dhe janë të gatshëm për proces.',
      active_offers:'Seanca individuale, program grupor dhe retreat.',
      vision_12m:'Një brand i qartë me ekip dhe procese të dokumentuara.',
      priority_90d:'Qartësimi i pozicionimit dhe ofertave.'
    };
    for(const [name,value] of Object.entries(values)){
      const field=document.querySelector('[name="'+name+'"]');
      field.value=value; field.dispatchEvent(new Event('input',{bubbles:true}));
    }
    document.querySelector('#consent_accuracy').click();
    for(let i=0;i<5;i++) document.querySelector('#nextButton').click();
    document.querySelector('#submitButton').click();
    return {
      activeSuccess:document.querySelector('#successPanel').classList.contains('active'),
      formHidden:document.querySelector('#intakeForm').hidden,
      textHref:document.querySelector('#downloadText').href.startsWith('blob:'),
      jsonHref:document.querySelector('#downloadJson').href.startsWith('blob:'),
      storage:sessionStorage.getItem('jetmir-strategy-intake-v1')?.length>20,
      scrollWidth:document.documentElement.scrollWidth,
      width:innerWidth
    };
  })()`);
  assert.deepEqual(completed, { activeSuccess: true, formHidden: true, textHref: true, jsonHref: true, storage: false, scrollWidth: 390, width: 390 });
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
  console.log(JSON.stringify({ initial, invalid, clinical, completed, processPage, exceptions }, null, 2));
} finally {
  ws?.close();
  browser.kill('SIGTERM');
  server.kill('SIGTERM');
  rmSync(profileDir, { recursive: true, force: true });
}
