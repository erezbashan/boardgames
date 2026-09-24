import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPLSCY3R0gK7xyYlLrImm0FSVWl_a3qbI",
  authDomain: "board-games-20e3d.firebaseapp.com",
  projectId: "board-games-20e3d",
  storageBucket: "board-games-20e3d.firebasestorage.app",
  messagingSenderId: "613589470783",
  appId: "1:613589470783:web:c26e86f9fd0b6d56f2b28a",
  measurementId: "G-JEN3E41B08"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);

// Use local emulators for development only
if (import.meta.env.DEV || window.location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099');
} else {
  // Only initialize analytics in production to avoid local tracking noise
  if (typeof window !== "undefined") {
    getAnalytics(app);
  }
}

export { db, functions, auth };
