// Using compat scripts for easier service worker implementation.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// IMPORTANT: This config is duplicated from src/firebase/config.ts
// If you change your Firebase project, you must update this config as well.
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

// Handle incoming messages when the app is in the background or closed
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize the notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/favicon.ico',
    // Store the click action URL in the notification data
    data: {
        url: payload.fcmOptions.link 
    }
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked: ', event.notification);
  
  event.notification.close();

  // This looks for an open window with the same URL and focuses it.
  // If no window is open, it opens a new one.
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      const urlToOpen = event.notification.data.url;
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        if (urlToOpen) {
          return client.focus().then(cli => cli.navigate(urlToOpen));
        }
        return client.focus();
      }
      if (urlToOpen) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
