// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Configurações reais do projeto vanessaschoolbd
const firebaseConfig = {
  apiKey: "AIzaSyCnjIoDfPN2iyd1MOH7b9nGk_nvZAx5jZQ",
  authDomain: "vanessaschoolbd.firebaseapp.com",
  projectId: "vanessaschoolbd",
  storageBucket: "vanessaschoolbd.firebasestorage.app",
  messagingSenderId: "95341519059",
  appId: "1:95341519059:web:5784d3f7019d97a9e87426"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta serviços de autenticação e banco de dados
export const auth = getAuth(app);
export const db = getFirestore(app);
