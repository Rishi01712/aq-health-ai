// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAaTV-SVmAY1rQ6bIslOjW4FJmqunO_cng",
  authDomain: "aq-health-ai.firebaseapp.com",
  databaseURL: "https://aq-health-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aq-health-ai",
  storageBucket: "aq-health-ai.firebasestorage.app",
  messagingSenderId: "1004149016384",
  appId: "1:1004149016384:web:a657f731fb3ab9df64dca5",
  measurementId: "G-CHLEDHCM6K"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
export { app, db }