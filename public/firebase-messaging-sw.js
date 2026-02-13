// This file must be in the public directory.

// In a production environment, you should not hardcode the config.
// This is a simplified setup for demonstration.
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// IMPORTANT: Replace this with your project's Firebase configuration.
// You can find this in your Firebase project settings.
const firebaseConfig = {
  "projectId": "studio-5955111434-37f1b",
  "appId": "1:864443100893:web:86e84f9425772ef2a0b534",
  "apiKey": "AIzaSyCWHaLzCNm6Jhv-b0a-FtXUCqKGIctlORo",
  "authDomain": "studio-5955111434-37f1b.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "864443100893"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
