# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Enabling Push Notifications

This project is set up to use Firebase Cloud Messaging (FCM) to send push notifications to users about their order status. A "simulated ringing" feature for vendors is also included, which sends repeated notifications for new orders.

To fully enable all notification features, follow these steps carefully:

### 1. Add your VAPID Key

This key is essential for Web Push notifications to work.

*   Go to your [Firebase Project Settings](https://console.firebase.google.com/project/_/settings/cloudmessaging).
*   Under the **Web configuration** section, find the **Web Push certificates** tab.
*   Generate a key pair if you haven't already.
*   Copy the **Key pair** value.
*   Create a new file named `.env.local` in the root of your project (if it doesn't exist).
*   Add the following line to `.env.local`, replacing `YOUR_VAPID_KEY` with the key you copied:
    ```
    NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY
    ```

### 2. Deploy Cloud Functions

The backend logic for sending all notifications is in the `functions` directory. You must deploy it to Firebase.

*   Make sure you have the Firebase CLI installed (`npm install -g firebase-tools`).
*   Log in to Firebase (`firebase login`).
*   From your project's root directory, run:
    ```bash
    firebase deploy --only functions
    ```

### 3. Add the Custom Ringing Sound (Crucial for Vendors)

The notification system is designed to simulate a ringing phone by sending repeated alerts.

*   **When the app is in the background or closed:** The vendor's device will play its **default notification sound** every 5 seconds.
*   **When the vendor's dashboard is open:** The app will attempt to play a custom sound file. To enable this, you **must** provide the sound file.

To add the custom foreground sound:

*   In your `public` folder, create a **new directory** named `sounds`.
*   Place your desired sound file inside this new directory.
*   **IMPORTANT:** You must name the file `new-order.mp3`.
*   The final, exact file path must be `public/sounds/new-order.mp3`.

If this file is present, it will be used for the repeating "ring" notification when the vendor's dashboard is open. If it's not found, no sound will play when the dashboard is open.
