const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'demo-project' });
const db = admin.firestore();

async function run() {
  const doc = await db.collection('tournament_simulations').doc('Q6zCytIdYf7g5b1P9ylZ').get();
  const data = doc.data();
  console.log('Size of bots string:', data.bots.length, 'bytes');
  console.log('Status:', data.status);
  console.log('Games:', data.gamesCompletedInPhase);
}
run().catch(console.error);
