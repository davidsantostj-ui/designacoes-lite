const { spawnSync } = require('child_process');

const getJavaMajor = () => {
  const result = spawnSync('java', ['-version'], { encoding: 'utf8', shell: true });
  const output = `${result.stderr || ''}\n${result.stdout || ''}`;
  const match = output.match(/version "(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  const first = Number(match[1]);
  if (Number.isNaN(first)) return null;
  return first === 1 ? Number(match[2]) : first;
};

const javaMajor = getJavaMajor();

if (!javaMajor) {
  console.error('Não foi possível identificar a versão do Java. Instale o JDK 21+ para rodar os testes de regras.');
  process.exit(1);
}

if (javaMajor < 21) {
  console.error(`JDK ${javaMajor} detectado. Os testes de regras exigem JDK 21 ou superior para iniciar os emuladores do Firebase.`);
  process.exit(1);
}

const command =
  'npx firebase-tools emulators:exec --only firestore,storage "npx mocha --timeout 20000 scripts/tests/firestore.rules.test.js scripts/tests/storage.rules.test.js"';
const result = spawnSync(command, {
  stdio: 'inherit',
  shell: true
});

process.exit(result.status || 0);
