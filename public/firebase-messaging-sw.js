// public/firebase-messaging-sw.js

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker with your project's configuration.
// This configuration is public and safe to include here.
firebase.initializeApp({
  "apiKey": "AIzaSyCWHaLzCNm6Jhv-b0a-FtXUCqKGIctlORo",
  "authDomain": "studio-5955111434-37f1b.firebaseapp.com",
  "projectId": "studio-5955111434-37f1b",
  "messagingSenderId": "864443100893",
  "appId": "1:864443100893:web:86e84f9425772ef2a0b534",
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  
  // The backend constructs the notification payload, including title, body, and icon.
  // The service worker's primary job is to display it.
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    // Note: The 'sound' property in the payload is a suggestion.
    // Most browsers will play the default notification sound for background notifications,
    // which creates the desired repeating alert effect.
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
