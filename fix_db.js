const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'erez-boardgames-portal' });
const db = admin.firestore();

async function run() {
  try {
    const doc = await db.collection('games').doc('FDSL1C').get();
    if (doc.exists) {
      const data = doc.data();
      if (data.state && data.state.status === 'Playing') {
        await db.collection('games').doc('FDSL1C').update({ 'state.status': 'Finished' });
        console.log('Fixed FDSL1C!');
      } else {
        console.log('FDSL1C already finished or not playing.', data.state.status);
      }
    } else {
      console.log('FDSL1C not found.');
    }
  } catch (e) {
    console.error(e);
  }
}
run();
