
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// This function notifies the VENDOR when a NEW order is created.
exports.sendVendorNewOrderNotification = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    if (!order || order.status !== 'pending') {
      console.log(`Order ${orderId} is not new or not pending. Skipping vendor notification.`);
      return null;
    }

    const vendorId = order.vendorId;
    if (!vendorId) {
      console.log(`Order ${orderId} has no vendorId. Cannot notify vendor.`);
      return null;
    }
    
    // Get vendor's FCM tokens
    const vendorRef = admin.firestore().collection('vendors').doc(vendorId);
    const vendorDoc = await vendorRef.get();
    
    if (!vendorDoc.exists) {
        console.log(`Vendor ${vendorId} not found.`);
        return null;
    }

    const vendorData = vendorDoc.data();
    const tokens = vendorData.fcmTokens;

    if (!tokens || tokens.length === 0) {
      console.log(`Vendor ${vendorId} has no FCM tokens.`);
      return null;
    }
    
    const payload = {
      notification: {
        title: 'Nuovi ordini !!',
        body: `You have a new order from ${order.customerName}. Please respond.`,
        icon: "https://grabclub-nine.vercel.app/favicon.ico",
        click_action: `https://grabclub-nine.vercel.app`, // Generic link, vendor dashboards will handle routing
      },
      data: {
          orderId: orderId,
          // You can add more data here if needed by the app
      }
    };
    
    // Simulate ringing by sending notifications repeatedly
    const MAX_DURATION_MINS = 3;
    const INTERVAL_SECONDS = 10;
    const iterations = (MAX_DURATION_MINS * 60) / INTERVAL_SECONDS;

    for (let i = 0; i < iterations; i++) {
        const currentOrderSnap = await snap.ref.get();
        const currentOrder = currentOrderSnap.data();

        if (currentOrder.status !== 'pending') {
            console.log(`Order ${orderId} status changed to ${currentOrder.status}. Stopping notifications.`);
            break;
        }

        console.log(`Sending notification attempt ${i + 1} for order ${orderId} to vendor ${vendorId}`);
        await admin.messaging().sendToDevice(tokens, payload);

        await sleep(INTERVAL_SECONDS * 1000);
    }
    
    return null;
  });


// This function notifies the CUSTOMER when an order's status is updated.
exports.sendCustomerOrderUpdateNotification = functions.firestore
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
