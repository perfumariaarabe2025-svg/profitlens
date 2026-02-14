// frontend/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKQfO8p0reguvc5zpth6Xok-982GExYKI",
  authDomain: "profitlens-fda3c.firebaseapp.com",
  projectId: "profitlens-fda3c",
  storageBucket: "profitlens-fda3c.firebasestorage.app",
  messagingSenderId: "1029861463389",
  appId: "1:1029861463389:web:a1ada03d35c4b194f784b4",
  measurementId: "G-JDZR4L4NY8"
};

// Evita recriar a conexão se ela já existir (Boa prática no Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta a autenticação para usarmos no Login
export const auth = getAuth(app);