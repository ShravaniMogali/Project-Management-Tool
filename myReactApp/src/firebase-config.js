import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDjiJP1lAfswSpFpdPeabedhmtDFfAukZU",
    authDomain: "project-management-tool-ea31f.firebaseapp.com",
    projectId: "project-management-tool-ea31f",
    storageBucket: "project-management-tool-ea31f.appspot.com",
    messagingSenderId: "934966707074",
    appId: "1:934966707074:web:0487920d07f5810092c59b",
    measurementId: "G-DCJ00QSRPR"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, collection, addDoc, onSnapshot };