import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBj8Kw1ofG3qAAQxQhIpuJActjvrdrRLMo",
  authDomain: "circl-d.firebaseapp.com",
  projectId: "circl-d",
  storageBucket: "circl-d.firebasestorage.app",
  messagingSenderId: "143872324607",
  appId: "1:143872324607:web:e4361b466a1b8fbc55edca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
