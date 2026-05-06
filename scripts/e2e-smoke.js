const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const localTestScript = path.join(rootDir, 'scripts', 'local-test.js');
const ROUTES = ['/', '/avisos', '/minha-agenda', '/programacao-da-reuniao', '/trocas', '/busca', '/admin'];

const getAvailablePort = (startPort = 4173, maxPort = 4190) =>
  new Promise((resolve, reject) => {
    const tryPort = (port) => {
      if (port > maxPort) {
        reject(new Error('Nenhuma porta livre encontrada para o preview.'));
        return;
      }

      const server = net.createServer();
      server.unref();
      server.on('error', () => tryPort(port + 1));
      server.listen(port, '127.0.0.1', () => {
        const { port: openPort } = server.address();
        server.close(() => resolve(openPort));
      });
    };

    tryPort(startPort);
  });

const startPreviewServer = async () => {
  const port = await getAvailablePort();
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    }
  );

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[preview] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[preview] ${chunk}`);
  });

  return { child, port };
};

const stopPreviewServer = (child) =>
  new Promise((resolve) => {
    if (!child || child.killed) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch (error) {
        // ignore
      }
      resolve();
    }, 4000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    try {
      child.kill('SIGTERM');
    } catch (error) {
      clearTimeout(timeout);
      resolve();
    }
  });

const waitForServer = (host, port, timeoutMs = 25000) =>
  new Promise((resolve, reject) => {
    const start = Date.now();

    const tryConnect = () => {
      const req = http.get({ host, port, path: '/' }, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Preview não respondeu a tempo.'));
          return;
        }
        setTimeout(tryConnect, 1000);
      });
    };

    tryConnect();
  });

const requestRoute = (host, port, route) =>
  new Promise((resolve, reject) => {
    http
      .get({ host, port, path: route }, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve(res.statusCode);
          return;
        }
        reject(new Error(`Rota ${route} respondeu com ${res.statusCode}`));
      })
      .on('error', reject);
  });

const runLocalSmoke = (host, port) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [localTestScript], {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        LOCAL_TEST_HOST: host,
        LOCAL_TEST_PORT: String(port),
        LOCAL_TEST_TIMEOUT_MS: '25000'
      }
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Smoke local falhou com código ${code}`));
    });
  });

const main = async () => {
  let previewRuntime = null;

  try {
    previewRuntime = await startPreviewServer();
    await waitForServer('127.0.0.1', previewRuntime.port);

    for (const route of ROUTES) {
      const status = await requestRoute('127.0.0.1', previewRuntime.port, route);
      console.log(`Rota ok: ${route} -> ${status}`);
    }

    await runLocalSmoke('127.0.0.1', previewRuntime.port);
    console.log('E2E smoke concluído com sucesso.');
  } finally {
    await stopPreviewServer(previewRuntime?.child);
  }
};

main().catch((error) => {
  console.error(`E2E smoke falhou: ${error.message}`);
  process.exit(1);
});
