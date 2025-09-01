import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBpUBunrxAyJlNEkcKs6LI0k5QLtlOxcaw",
  authDomain: "code-provider.firebaseapp.com",
  projectId: "code-provider",
  storageBucket: "code-provider.firebasestorage.app",
  messagingSenderId: "803611920484",
  appId: "1:803611920484:web:0a0b43b6a6d248b061b771",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getDatabase(
  app,
  "https://code-provider-default-rtdb.asia-southeast1.firebasedatabase.app"
);
export const auth = getAuth(app);

export default app;
