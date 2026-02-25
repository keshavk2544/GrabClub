# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Enabling Push Notifications

This project is set up to use Firebase Cloud Messaging (FCM) to send push notifications to users about their order status. To fully enable this feature, follow these steps:

1.  **Add your VAPID Key:**
    *   Go to your [Firebase Project Settings](https://console.firebase.google.com/project/_/settings/cloudmessaging).
    *   Under the "Web configuration" section, find the "Web Push certificates" tab.
    *   Generate a key pair if you haven't already.
    *   Copy the **Key pair** value.
    *   Create a new file named `.env.local` in the root of your project (if it doesn't exist).
    *   Add the following line to `.env.local`, replacing `YOUR_VAPID_KEY` with the key you copied:
        ```
        NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY
        ```

2.  **Deploy Cloud Functions:**
    *   The backend logic for sending notifications is in the `functions` directory. You need to deploy it to Firebase.
    *   Make sure you have the Firebase CLI installed (`npm install -g firebase-tools`).
    *   Log in to Firebase (`firebase login`).
    *   Run the following command from your project's root directory:
        ```bash
        firebase deploy --only functions
        ```

3.  **Add a Custom Ringing Sound for Vendors:**
    *   To make new order alerts more distinct for vendors, you must provide a custom sound file.
    *   Create a new directory named `sounds` inside your `public` folder.
    *   Place your desired sound file in this new directory. The app is configured to look for a file named `new-order.mp3`.
    *   **Crucially, the final file path must be exactly `public/sounds/new-order.mp3`.**
    *   If this file is present, it will be used for the repeating "ring" notification for vendors. If it's not found, a default notification sound will be used.

Once these steps are completed, your application will ask users and vendors for permission to send notifications when they log in. If they grant permission, they will receive updates and alerts.
