const admin = require('firebase-admin');
require('dotenv').config();

// Load the secret Firebase key
const serviceAccount = require(process.env.FIREBASE_KEY_PATH);

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('🛡️  Firebase Admin (The Bouncer) initialized successfully.');

module.exports = admin;