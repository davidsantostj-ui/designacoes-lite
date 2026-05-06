const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const localTestScript = path.join(rootDir, 'scripts', 'local-test.js');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

const runCommand = (label, command, args, extraEnv = {}) =>
  new Promise((resolve, reject) => {
    console.log(`\n==> ${label}`);
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv }
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });

const getAvailablePort = (startPort = 4173, maxPort = 4190) =>
  new Promise((resolve, reject) => {
    const tryPort = (port) => {
      if (port > maxPort) {
        reject(new Error('Nenhuma porta livre encontrada para o preview.'));
        return;
      }

      const server = net.createServer();
      server.unref();
      server.on('error', () => {
        tryPort(port + 1);
      });
      server.listen(port, '127.0.0.1', () => {
        const { port: openPort } = server.address();
        server.close(() => resolve(openPort));
      });
    };

    tryPort(startPort);
  });

const startPreviewServer = async () => {
  const port = await getAvailablePort();
  console.log(`\n==> Iniciando preview de produção na porta ${port}`);
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
      } catch (err) {
        // ignore forced shutdown failures
      }
      resolve();
    }, 4000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    try {
      child.kill('SIGTERM');
    } catch (err) {
      clearTimeout(timeout);
      resolve();
    }
  });

const main = async () => {
  let previewRuntime = null;

  try {
    await runCommand(
      'Lint',
      process.platform === 'win32' ? 'cmd.exe' : 'npm',
      process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run lint'] : ['run', 'lint']
    );
    await runCommand(
      'Unit tests',
      process.platform === 'win32' ? 'cmd.exe' : 'npm',
      process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run test:unit'] : ['run', 'test:unit']
    );
    await runCommand(
      'Build',
      process.platform === 'win32' ? 'cmd.exe' : 'npm',
      process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build']
    );

    previewRuntime = await startPreviewServer();

    await runCommand('Smoke local', process.execPath, [localTestScript], {
      LOCAL_TEST_HOST: '127.0.0.1',
      LOCAL_TEST_PORT: String(previewRuntime.port),
      LOCAL_TEST_TIMEOUT_MS: '25000'
    });

    console.log('\nPrelaunch check concluído com sucesso.');
  } finally {
    await stopPreviewServer(previewRuntime?.child);
  }
};

main().catch((error) => {
  console.error(`\nPrelaunch check falhou: ${error.message}`);
  process.exit(1);
});
