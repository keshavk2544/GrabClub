const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendOrderUpdateNotification = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Only send notification if the status has changed.
    if (!newValue || !previousValue || newValue.status === previousValue.status) {
      console.log("No status change, skipping notification.");
      return null;
    }

    const customerEmail = newValue.customerEmail;
    if (!customerEmail) {
      console.log("No customer email on order, cannot send notification.");
      return null;
    }

    // Find the user by their email to get their FCM tokens.
    const usersRef = admin.firestore().collection("users");
    const userQuery = await usersRef.where("email", "==", customerEmail).limit(1).get();

    if (userQuery.empty) {
      console.log("Could not find user with email:", customerEmail);
      return null;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const tokens = userData.fcmTokens;

    if (!tokens || tokens.length === 0) {
      console.log("User does not have any FCM tokens.");
      return null;
    }

    // Customize the notification message based on the new status.
    let title = "GrabClub Order Update";
    let body = `The status of your order has been updated to ${newValue.status}.`;

    switch (newValue.status) {
      case "accepted":
        title = "Order Confirmed!";
        body = `Your order is being prepared!`;
        break;
      case "rejected":
        title = "Order Rejected";
        body = `Unfortunately, your recent order was rejected.`;
        break;
      case "out for delivery":
        title = "Your Order is on the Way!";
        body = `Get ready! Your order is now out for delivery.`;
        break;
      case "delivered":
        title = "Order Delivered!";
        body = `Your order has been delivered. Enjoy!`;
        break;
      case "pending payment":
        title = "Payment Required";
        body = `Your order is ready. Please complete the payment to proceed.`;
        break;
      case "refunded":
        title = "Refund Processed";
        body = `Your refund has been processed and should reflect in your account soon.`;
        break;
    }

    const payload = {
      notification: {
        title,
        body,
        icon: "https://grabclub-nine.vercel.app/favicon.ico", // You can replace this with a full URL to your app's logo
        click_action: `https://grabclub-nine.vercel.app/orders`, // IMPORTANT: Replace with your app's URL
      },
    };

    // Send the notification to all of the user's registered devices.
    return admin.messaging().sendToDevice(tokens, payload);
  });