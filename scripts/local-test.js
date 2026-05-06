const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');

const host = process.env.LOCAL_TEST_HOST || '127.0.0.1';
const port = Number(process.env.LOCAL_TEST_PORT || 5173);
const timeoutMs = Number(process.env.LOCAL_TEST_TIMEOUT_MS || 20000);
const url = `http://${host}:${port}/`;

const SUCCESS_MARKERS = [
  'Acesso Seguro',
  'Solicitar Acesso',
  'Acesso ativo',
  'Administração',
  'Reuniões Semanais'
];

const FAILURE_MARKERS = [
  'Algo deu errado',
  'Falha ao iniciar o app.',
  'Recarregue o app ou limpe o cache.'
];

const browserCandidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
];

const findBrowser = () => browserCandidates.find((candidate) => fs.existsSync(candidate)) || '';

const parseRootInnerHtml = (html) => {
  const match = String(html || '').match(/<div id="root"[^>]*>([\s\S]*?)<\/div>/i);
  if (!match) return '';
  return String(match[1] || '').replace(/\s+/g, ' ').trim();
};

const runBrowserSmoke = () => {
  const browserPath = findBrowser();
  if (!browserPath) {
    console.log('Browser smoke skipped: Edge/Chrome not found.');
    return { ok: true, skipped: true };
  }

  const headlessArgs = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--virtual-time-budget=8000',
    '--dump-dom',
    url
  ];

  const fallbackArgs = [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--virtual-time-budget=8000',
    '--dump-dom',
    url
  ];

  let result = spawnSync(browserPath, headlessArgs, {
    encoding: 'utf8',
    timeout: 20000,
    windowsHide: true
  });

  if (result.status !== 0) {
    result = spawnSync(browserPath, fallbackArgs, {
      encoding: 'utf8',
      timeout: 20000,
      windowsHide: true
    });
  }

  if (result.error) {
    return {
      ok: false,
      message: `Browser smoke failed to start: ${result.error.message}`
    };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      message: `Browser smoke exited with code ${result.status}. ${String(
        result.stderr || ''
      ).trim()}`
    };
  }

  const html = String(result.stdout || '');
  const rootInnerHtml = parseRootInnerHtml(html);
  const foundFailure = FAILURE_MARKERS.find((marker) => html.includes(marker));
  if (foundFailure) {
    return {
      ok: false,
      message: `Browser smoke found fatal UI state: ${foundFailure}`
    };
  }

  const foundSuccess = SUCCESS_MARKERS.find((marker) => html.includes(marker));
  if (foundSuccess) {
    return {
      ok: true,
      message: `Browser smoke ok: ${foundSuccess}`
    };
  }

  if (!rootInnerHtml) {
    return {
      ok: false,
      message: 'Browser smoke failed: app root rendered empty DOM.'
    };
  }

  return {
    ok: true,
    message: 'Browser smoke ok: root rendered content.'
  };
};

console.log(`Verificando servidor local em ${url}...`);

let resolved = false;

const finish = (code, message) => {
  if (resolved) return;
  resolved = true;
  if (message) console.log(message);
  process.exit(code);
};

const tryRequest = () => {
  http
    .get({ host, port, path: '/' }, (res) => {
      const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
      if (!ok) {
        finish(1, `Localhost test status: ${res.statusCode}`);
        return;
      }

      const browserSmoke = runBrowserSmoke();
      if (!browserSmoke.ok) {
        finish(1, browserSmoke.message);
        return;
      }

      finish(0, `Localhost test status: ${res.statusCode}\n${browserSmoke.message || ''}`.trim());
    })
    .on('error', () => {
      // retry until timeout
    });
};

const startTime = Date.now();
const poll = setInterval(() => {
  if (resolved) {
    clearInterval(poll);
    return;
  }
  if (Date.now() - startTime > timeoutMs) {
    clearInterval(poll);
    finish(1, 'Localhost test timeout. Vite server did not respond in time.');
    return;
  }
  tryRequest();
}, 1000);
