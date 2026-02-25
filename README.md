# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Enabling Push Notifications

This project is set up to use Firebase Cloud Messaging (FCM) to send push notifications. The two main features are:
1.  **Customer Notifications**: Users receive status updates about their orders.
2.  **Vendor "Ringing"**: For new orders, vendors receive repeated notifications to simulate a ringing phone.

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

The backend logic for sending all notifications is in the `functions` directory. **You must deploy this every time you change the function code.**

*   Make sure you have the Firebase CLI installed (`npm install -g firebase-tools`).
*   Log in to Firebase (`firebase login`).
*   From your project's root directory, run:
    ```bash
    firebase deploy --only functions
    ```

### 3. Add the Custom Ringing Sound (For Foreground App)

The "ringing" sound behavior depends on whether the vendor's app is open or closed.

*   **When the app is open (in the foreground):** The app will attempt to play a custom sound file. To enable this, you **must** provide the sound file.
*   **When the app is in the background or closed:** The device will play its **default notification sound** every 5 seconds. The custom MP3 file is **not** used in this case due to web browser limitations.

To add the custom foreground sound:

*   In your `public` folder, create a **new directory** named `sounds`.
*   Place your desired sound file inside this new directory.
*   **IMPORTANT:** You must name the file `new-order.mp3`.
*   The final, exact file path must be `public/sounds/new-order.mp3`.

If this file is present, it will be used for the repeating "ring" when the vendor's dashboard is open. If it's not found, no sound will play when the dashboard is open.

### 4. Troubleshooting (If Sound Still Doesn't Work)

If the ringing feature isn't working after following all the steps, the issue is likely environmental. Here’s a checklist:

*   **Have you redeployed your functions?** After any change to `functions/index.js`, you must run `firebase deploy --only functions` again.
*   **Are browser notifications enabled?** When a vendor logs into their dashboard for the first time, the browser will ask for permission to show notifications. If this was denied, no notifications will appear. Check your browser's site settings for your app's URL and ensure "Notifications" are set to "Allow".
*   **Is the vendor's device/OS muted?** Check that your phone or computer's main volume is on and that notifications for your browser are not silenced by a "Focus" or "Do Not Disturb" mode.
*   **Is the FCM Token saved?** Use the Firestore console to check a vendor's document in the `/vendors` collection. It should have a field named `fcmTokens` containing at least one long string (the token). If it's missing, the vendor's browser hasn't registered for notifications correctly.
*   **Is the foreground sound blocked?** Modern browsers have strict autoplay policies. If a vendor opens their dashboard and doesn't interact with the page (e.g., click a button), the browser might block the custom sound from playing automatically. Clicking anywhere on the page usually resolves this for the current session.
