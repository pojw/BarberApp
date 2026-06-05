import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  console.log("Firebase auth persistence fallback:", error);
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };