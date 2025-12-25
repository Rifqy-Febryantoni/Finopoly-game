// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// --- PASTE KONFIGURASI DARI FIREBASE CONSOLE DI SINI ---
// Contoh (JANGAN PAKAI YANG INI, PAKAI PUNYAMU):
const firebaseConfig = {
  apiKey: "AIzaSyB8XBuN4MCqfRrmoRbsqM3Zu7Z7WLBtK8Q",
  authDomain: "fintech-4e617.firebaseapp.com",
  databaseURL: "https://fintech-4e617-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fintech-4e617",
  storageBucket: "fintech-4e617.firebasestorage.app",
  messagingSenderId: "942765896788",
  appId: "1:942765896788:web:4adc8c37f53a44ba52e9c1",
  measurementId: "G-PCGPCWRJ8W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);