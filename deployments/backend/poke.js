const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'demo-project' });
const db = admin.firestore();

async function run() {
  const docRef = db.collection('tournament_simulations').doc('Q6zCytIdYf7g5b1P9ylZ');
  const doc = await docRef.get();
  const data = doc.data();
  console.log('Current Games:', data.gamesCompletedInPhase);
  await docRef.update({ gamesCompletedInPhase: data.gamesCompletedInPhase + 1 });
  console.log('Poked!');
}
run().catch(console.error);
