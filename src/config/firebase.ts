import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Firebase configuration for Medallia Goodbye app
// This is a public read/write configuration for the farewell site
const firebaseConfig = {
  apiKey: "AIzaSyCEUA0_s0FaN76sgYbEKQG-txKLepZsJ3g",
  authDomain: "medallia-goodbye.firebaseapp.com",
  databaseURL: "https://medallia-goodbye-default-rtdb.firebaseio.com",
  projectId: "medallia-goodbye",
  storageBucket: "medallia-goodbye.firebasestorage.app",
  messagingSenderId: "821867534143",
  appId: "1:821867534143:web:abc170d739abb5aa7fa58a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage and Database
export const storage = getStorage(app);
export const database = getDatabase(app);

export default app;