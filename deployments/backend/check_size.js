const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'demo-project' });
const db = admin.firestore();

async function run() {
  const doc = await db.collection('tournament_simulations').doc('aXE38Hai8sjcfhUky3RO').get();
  const data = doc.data();
  const jsonStr = JSON.stringify(data);
  console.log('Size of document JSON:', jsonStr.length, 'bytes');
}
run().catch(console.error);
