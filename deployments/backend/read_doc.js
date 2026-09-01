const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'demo-project' });
const db = admin.firestore();

async function run() {
  const doc = await db.collection('tournament_simulations').doc('aXE38Hai8sjcfhUky3RO').get();
  if (!doc.exists) {
    console.log('Doc not found');
  } else {
    const data = doc.data();
    console.log('Status:', data.status);
    console.log('Phase:', data.phase);
    console.log('Games Completed:', data.gamesCompletedInPhase);
    console.log('Total Games:', data.totalGamesInPhase);
    console.log('Starting Players:', data.startingPlayers);
    console.log('Bots count:', data.bots.length);
  }
}
run().catch(console.error);
