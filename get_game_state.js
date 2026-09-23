const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'board-games-20e3d' });
const db = admin.firestore();
async function run() {
  const snapshot = await db.collection('games').orderBy('createdAt', 'desc').limit(5).get();
  for (const doc of snapshot.docs) {
    if (doc.data().gameType === 'acquire') {
      console.log("Found acquire game:", doc.id);
      console.log(JSON.stringify(doc.data().state.players, null, 2));
      process.exit(0);
    }
  }
}
run();
