import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "acquire-game-1782999027",
  appId: "1:13397046224:web:cde4c3a9637972f464ffd5",
  storageBucket: "acquire-game-1782999027.firebasestorage.app",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "acquire-game-1782999027.firebaseapp.com",
  messagingSenderId: "13397046224"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
