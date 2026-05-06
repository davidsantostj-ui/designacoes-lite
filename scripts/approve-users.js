/*
Simple admin script to list or approve users in Firestore.

Usage:
  1) Install dependencies:
     npm install firebase-admin

  2) Provide service account credentials (one of these):
     - Set environment variable GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
     - OR put the JSON at ./serviceAccountKey.json

  3) Run:
     node scripts/approve-users.js --list
     node scripts/approve-users.js --approve <uid>            # approve one user (will ask confirmation)
     node scripts/approve-users.js --approve-all --yes       # approve all non-approved users without prompt

NOTE: This script uses the Admin SDK and requires a service account with Firestore access. Use carefully.
*/

const admin = require('firebase-admin');
const fs = require('fs');

const svcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
if (!fs.existsSync(svcPath)) {
  console.error('Service account JSON not found. Set GOOGLE_APPLICATION_CREDENTIALS or put serviceAccountKey.json next to this script.');
  process.exit(1);
}

const serviceAccount = require(svcPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag) || argv.some(a => a.startsWith(flag + '='));
const getArg = (flag) => {
  const idx = argv.findIndex(a => a === flag);
  if (idx >= 0 && idx + 1 < argv.length) return argv[idx + 1];
  const kv = argv.find(a => a.startsWith(flag + '='));
  return kv ? kv.split('=')[1] : null;
};

async function listNonApproved() {
  const snap = await db.collection('users').get();
  const rows = [];
  snap.forEach(d => {
    const data = d.data() || {};
    if (data.approved !== true) rows.push({ id: d.id, name: data.name || '', surname: data.surname || '', email: data.email || '', approved: data.approved });
  });
  if (rows.length === 0) {
    console.log('Nenhum usuário pendente de aprovação.');
    return;
  }
  console.table(rows);
}

async function approveUser(uid) {
  console.log(`Aprovando usuário ${uid} ...`);
  await db.doc(`users/${uid}`).set({ approved: true }, { merge: true });
  console.log('Feito.');
}

async function approveAll(promptSkip = false) {
  const snap = await db.collection('users').get();
  const rows = [];
  snap.forEach(d => {
    const data = d.data() || {};
    if (data.approved !== true) rows.push({ id: d.id, name: data.name || '', email: data.email || '' });
  });
  if (rows.length === 0) {
    console.log('Nenhum usuário pendente de aprovação.');
    return;
  }
  console.table(rows);
  if (!promptSkip) {
    const { once } = require('events');
    process.stdout.write('Confirmar atualização de todos para approved=true? (type YES): ');
    const input = await once(process.stdin, 'data');
    const answer = String(input[0] || '').trim();
    if (answer !== 'YES') {
      console.log('Cancelado.');
      return;
    }
  }
  for (const r of rows) {
    await db.doc(`users/${r.id}`).set({ approved: true }, { merge: true });
    console.log(`Aprovado: ${r.id}`);
  }
  console.log('Concluído.');
}

(async () => {
  try {
    if (has('--list')) {
      await listNonApproved();
      process.exit(0);
    }
    const uid = getArg('--approve') || getArg('--approve=') || getArg('--uid');
    if (uid) {
      const skip = has('--yes');
      if (!skip) {
        process.stdout.write(`Confirmar aprovação do usuário ${uid}? (type YES): `);
        const { once } = require('events');
        const input = await once(process.stdin, 'data');
        const answer = String(input[0] || '').trim();
        if (answer !== 'YES') {
          console.log('Cancelado.');
          process.exit(0);
        }
      }
      await approveUser(uid);
      process.exit(0);
    }
    if (has('--approve-all')) {
      const skip = has('--yes');
      await approveAll(skip);
      process.exit(0);
    }
    console.log(`Uso:
  --list                 Lista usu?rios sem approved === true
  --approve <uid>        Aprova um usu?rio (pedir? confirma??o)
  --approve-all --yes    Aprova todos os n?o-aprovados sem pedir confirma??o
`);
    process.exit(0);
  } catch (e) {
    console.error('Erro:', e);
    process.exit(1);
  }
})();
