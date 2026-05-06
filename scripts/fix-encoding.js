const fs = require('fs');
const path = require('path');

const map = new Map([
  ['\u00C3\u00A1', '\u00E1'],
  ['\u00C3\u00A0', '\u00E0'],
  ['\u00C3\u00A2', '\u00E2'],
  ['\u00C3\u00A3', '\u00E3'],
  ['\u00C3\u00A4', '\u00E4'],
  ['\u00C3\u00A5', '\u00E5'],
  ['\u00C3\u0081', '\u00C1'],
  ['\u00C3\u0080', '\u00C0'],
  ['\u00C3\u0082', '\u00C2'],
  ['\u00C3\u0083', '\u00C3'],
  ['\u00C3\u0084', '\u00C4'],
  ['\u00C3\u0085', '\u00C5'],
  ['\u00C3\u00A9', '\u00E9'],
  ['\u00C3\u00A8', '\u00E8'],
  ['\u00C3\u00AA', '\u00EA'],
  ['\u00C3\u00AB', '\u00EB'],
  ['\u00C3\u0089', '\u00C9'],
  ['\u00C3\u0088', '\u00C8'],
  ['\u00C3\u008A', '\u00CA'],
  ['\u00C3\u008B', '\u00CB'],
  ['\u00C3\u00AD', '\u00ED'],
  ['\u00C3\u00AC', '\u00EC'],
  ['\u00C3\u00AE', '\u00EE'],
  ['\u00C3\u00AF', '\u00EF'],
  ['\u00C3\u008D', '\u00CD'],
  ['\u00C3\u008C', '\u00CC'],
  ['\u00C3\u008E', '\u00CE'],
  ['\u00C3\u008F', '\u00CF'],
  ['\u00C3\u00B3', '\u00F3'],
  ['\u00C3\u00B2', '\u00F2'],
  ['\u00C3\u00B4', '\u00F4'],
  ['\u00C3\u00B5', '\u00F5'],
  ['\u00C3\u00B6', '\u00F6'],
  ['\u00C3\u0093', '\u00D3'],
  ['\u00C3\u0092', '\u00D2'],
  ['\u00C3\u0094', '\u00D4'],
  ['\u00C3\u0095', '\u00D5'],
  ['\u00C3\u0096', '\u00D6'],
  ['\u00C3\u00BA', '\u00FA'],
  ['\u00C3\u00B9', '\u00F9'],
  ['\u00C3\u00BB', '\u00FB'],
  ['\u00C3\u00BC', '\u00FC'],
  ['\u00C3\u009A', '\u00DA'],
  ['\u00C3\u0099', '\u00D9'],
  ['\u00C3\u009B', '\u00DB'],
  ['\u00C3\u009C', '\u00DC'],
  ['\u00C3\u00A7', '\u00E7'],
  ['\u00C3\u0087', '\u00C7'],
  ['\u00C3\u00B1', '\u00F1'],
  ['\u00C3\u0091', '\u00D1'],
  ['\u00C2\u00BA', '\u00BA'],
  ['\u00C2\u00AA', '\u00AA'],
  ['\u00C2\u00B0', '\u00B0'],
  ['\u00C2\u00B7', '\u00B7'],
  ['\u00C2\u00A9', '\u00A9'],
  ['\u00C2\u00AE', '\u00AE'],
  ['\u00E2\u0082\u00AC', '\u20AC'],
  ['\u00E2\u0080\u0094', '\u2014'],
  ['\u00E2\u0080\u0093', '\u2013'],
  ['\u00E2\u0080\u009C', '\u201C'],
  ['\u00E2\u0080\u009D', '\u201D'],
  ['\u00E2\u0080\u0098', '\u2018'],
  ['\u00E2\u0080\u0099', '\u2019'],
  ['\u00E2\u0080\u00A2', '\u2022'],
  ['\u00E2\u0080\u00A6', '\u2026'],
  ['\u00E2\u0084\u00A2', '\u2122']
]);

const allowedExts = new Set([
  '.js',
  '.jsx',
  '.css',
  '.html',
  '.json',
  '.md',
  '.cjs',
  '.mjs',
  '.ts',
  '.tsx'
]);

const roots = ['src', 'public', 'scripts', 'index.html'];

const shouldProcess = (file) => {
  if (file === 'index.html') return true;
  const ext = path.extname(file);
  return allowedExts.has(ext);
};

const walk = (target, files = []) => {
  if (!fs.existsSync(target)) return files;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    files.push(target);
    return files;
  }
  const entries = fs.readdirSync(target);
  entries.forEach((entry) => {
    walk(path.join(target, entry), files);
  });
  return files;
};

const processFile = (file) => {
  if (!shouldProcess(file)) return false;
  if (path.normalize(file).endsWith(path.normalize('scripts/fix-encoding.js'))) return false;
  const content = fs.readFileSync(file, 'utf8');
  let updated = content;
  map.forEach((to, from) => {
    updated = updated.split(from).join(to);
  });
  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    return true;
  }
  return false;
};

const allFiles = roots.flatMap((root) => walk(root));
let changed = 0;
allFiles.forEach((file) => {
  if (processFile(file)) changed += 1;
});

console.log(`Encoding fix complete. Files updated: ${changed}`);
