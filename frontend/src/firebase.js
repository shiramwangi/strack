// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // We import Auth instead of Analytics

const firebaseConfig = {
  apiKey: "AIzaSyCwT0QPwZ3hx07c28FuuKtjvKUqWWcHHgc",
  authDomain: "shambarecords-traker.firebaseapp.com",
  projectId: "shambarecords-traker",
  storageBucket: "shambarecords-traker.firebasestorage.app",
  messagingSenderId: "15220418537",
  appId: "1:15220418537:web:08a2b2a6f8ef7ce2038d78",
  measurementId: "G-8Y6JFF6BC2"
};

// Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Authentication and export it so Login.jsx can use it
export const auth = getAuth(app);