import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAeP1VGUzynUK91Pq-FARIcvcPfSdVtEd4",
  authDomain: "url-bookmarks-app.firebaseapp.com",
  projectId: "url-bookmarks-app",
  storageBucket: "url-bookmarks-app.firebasestorage.app",
  messagingSenderId: "27787012957",
  appId: "1:27787012957:web:5da72cf199c74026b196b4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
