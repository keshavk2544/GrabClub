
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends repeated push notifications to a vendor for a new pending order
 * to simulate a ringing effect.
 * @param {object} order The order data.
 * @param {string} orderId The ID of the order.
 * @param {FirebaseFirestore.DocumentReference} orderRef Reference to the order document.
 */
async function startVendorRinging(order, orderId, orderRef) {
    const vendorId = order.vendorId;
    if (!vendorId) {
      console.log(`Order ${orderId} has no vendorId. Cannot notify vendor.`);
      return;
    }
    
    const vendorDoc = await admin.firestore().collection('vendors').doc(vendorId).get();
    
    if (!vendorDoc.exists) {
        console.log(`Vendor ${vendorId} not found.`);
        return;
    }

    const vendorData = vendorDoc.data();
    const tokens = vendorData.fcmTokens;

    if (!tokens || tokens.length === 0) {
      console.log(`Vendor ${vendorId} has no FCM tokens.`);
      return;
    }
    
    const payload = {
      notification: {
        title: 'Nuovi ordini !!',
        body: `You have a new order from ${order.customerName}. Please respond.`,
        icon: "https://grabclub-nine.vercel.app/favicon.ico",
        click_action: `https://grabclub-nine.vercel.app`,
      },
      data: {
          orderId: orderId,
      }
    };
    
    const MAX_DURATION_MINS = 3;
    const INTERVAL_SECONDS = 5;
    const iterations = (MAX_DURATION_MINS * 60) / INTERVAL_SECONDS;

    for (let i = 0; i < iterations; i++) {
        const currentOrderSnap = await orderRef.get();
        if (!currentOrderSnap.exists) {
            console.log(`Order ${orderId} has been deleted. Stopping notifications.`);
            break;
        }
        const currentOrder = currentOrderSnap.data();

        if (currentOrder.status !== 'pending') {
            console.log(`Order ${orderId} status changed to ${currentOrder.status}. Stopping notifications.`);
            break;
        }

        console.log(`Sending notification attempt ${i + 1} for order ${orderId} to vendor ${vendorId}`);
        await admin.messaging().sendToDevice(tokens, payload, { priority: 'high' });

        await sleep(INTERVAL_SECONDS * 1000);
    }
}


// This function is for newly created orders (e.g., Cash on Delivery).
exports.onnewordercreated = onDocumentCreated("orders/{orderId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const order = snap.data();
    const orderId = event.params.orderId;

    // Only ring for COD orders, which are created directly with 'pending' status.
    if (order && order.status === 'pending') {
      console.log(`New COD order ${orderId}. Starting ringing.`);
      await startVendorRinging(order, orderId, snap.ref);
    } else {
      console.log(`Order ${orderId} created with status '${order.status}'. Not ringing vendor yet.`);
    }
    
    return null;
});


// This function handles order updates, including payment completion and status changes.
exports.onorderupdated = onDocumentUpdated("orders/{orderId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }

    const newValue = snap.after.data();
    const previousValue = snap.before.data();
    const orderId = event.params.orderId;
    
    // --- VENDOR NOTIFICATION LOGIC ---
    // This starts the ringing when an online payment is completed and status moves to 'pending'.
    if (newValue.status === 'pending' && previousValue.status !== 'pending') {
      console.log(`Online payment order ${orderId} is now pending. Starting ringing.`);
      await startVendorRinging(newValue, orderId, snap.after.ref);
    }
    
    // --- CUSTOMER NOTIFICATION LOGIC ---
    if (!newValue || !previousValue || newValue.status === previousValue.status) {
      console.log("No status change, skipping customer notification.");
      // We return here, but only after checking for the vendor ringing condition above.
      return null;
    }

    const customerEmail = newValue.customerEmail;
    if (!customerEmail) {
      console.log("No customer email on order, cannot send customer notification.");
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
        icon: "https://grabclub-nine.vercel.app/favicon.ico",
        click_action: `https://grabclub-nine.vercel.app/orders`,
      },
    };

    return admin.messaging().sendToDevice(tokens, payload);
});
