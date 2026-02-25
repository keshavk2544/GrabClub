// This file must be in the public directory.

// Scripts for Firebase v9+ (the versions are compatible with your project's Firebase SDK)
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// IMPORTANT: This config object is a copy from your src/firebase/config.ts
// It's necessary because Service Workers can't import modules directly.
const firebaseConfig = {
  "projectId": "studio-5955111434-37f1b",
  "appId": "1:864443100893:web:86e84f9425772ef2a0b534",
  "apiKey": "AIzaSyCWHaLzCNm6Jhv-b0a-FtXUCqKGIctlORo",
  "authDomain": "studio-5955111434-37f1b.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "864443100893"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    sound: payload.notification.sound, // This is the important part
  };

  // The service worker needs to show the notification to the user.
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
