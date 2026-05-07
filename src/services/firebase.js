import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDovn542L52BUsDKu_F8eYEs4lq5oUOOE4',
  authDomain: 'minhas-designacoes-app.firebaseapp.com',
  projectId: 'minhas-designacoes-app',
  storageBucket: 'minhas-designacoes-app.firebasestorage.app',
  messagingSenderId: '33324490818',
  appId: '1:33324490818:web:1c7a75a909cc065a198ddb'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
