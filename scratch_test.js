const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
  const snapshot = await db.collection('assignments')
    .where('tipo_designacao', '>=', 'Indicador')
    .where('tipo_designacao', '<=', 'Indicador\uf8ff')
    .get();

  console.log(`Found ${snapshot.size} assignments with 'Indicador'`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, data.date, data.tipo_designacao, data.usuario_id, data.participant_name, data.source);
  });
}

check().catch(console.error);
