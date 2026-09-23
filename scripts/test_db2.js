const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, connectFirestoreEmulator } = require('firebase/firestore');

const firebaseConfig = { projectId: 'demo-project' };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
connectFirestoreEmulator(db, 'localhost', 8080);

async function run() {
  const simRef = doc(db, 'games', 'LX5XHQ');
  const snap = await getDoc(simRef);
  if (snap.exists()) {
    const data = snap.data();
    console.log('Logs:', data.state.logs);
  } else {
    console.log('No game LX5XHQ found');
  }
  process.exit(0);
}
run().catch(console.error);

