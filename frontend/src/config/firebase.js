// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzWakAl1QiGkhj-hDvSwThBivrD505JQ8",
  authDomain: "cutiq-700bc.firebaseapp.com",
  projectId: "cutiq-700bc",
  storageBucket: "cutiq-700bc.firebasestorage.app",
  messagingSenderId: "654000739780",
  appId: "1:654000739780:web:229acf67911dd752084091",
  measurementId: "G-6KZ7NZD1TN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);