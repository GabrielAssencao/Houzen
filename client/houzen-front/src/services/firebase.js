// Importa as funções necessárias dos SDKs do Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// A sua configuração web do Firebase
// para não deixar suas chaves expostas no código, mas para testar rápido você pode colar as chaves direto aqui.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o serviço de Autenticação e o provedor do Google
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Exporta para usarmos no Login.jsx
export { auth, provider };