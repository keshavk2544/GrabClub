
'use client';

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export async function requestPermissionAndSaveToken(user: User, firestore: Firestore) {
    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
        console.warn("VAPID key not found in .env. FCM setup will be skipped. Please add NEXT_PUBLIC_FIREBASE_VAPID_KEY from your Firebase project settings.");
        return;
    }
    
    if (!(await isSupported())) {
        console.log("Firebase Messaging is not supported in this browser.");
        return;
    }

    const messaging = getMessaging(getApp());
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (currentToken) {
                console.log('FCM Token received:', currentToken);
                const userProfileRef = doc(firestore, 'users', user.uid);
                // Save token to Firestore
                await updateDoc(userProfileRef, {
                    fcmTokens: arrayUnion(currentToken)
                });
                console.log('FCM token saved to user profile.');
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
    }
}

export async function requestVendorPermissionAndSaveToken(vendorId: string, firestore: Firestore) {
    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
        console.warn("VAPID key not found in .env. FCM setup will be skipped for vendor.");
        return;
    }

    if (!(await isSupported())) {
        console.log("Firebase Messaging is not supported in this browser for vendor.");
        return;
    }

    const messaging = getMessaging(getApp());
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Vendor notification permission granted.');
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (currentToken) {
                console.log('Vendor FCM Token received:', currentToken);
                const vendorRef = doc(firestore, 'vendors', vendorId);
                await updateDoc(vendorRef, {
                    fcmTokens: arrayUnion(currentToken)
                });
                console.log('FCM token saved to vendor profile.');
            } else {
                console.log('No registration token available for vendor.');
            }
        } else {
            console.log('Unable to get permission to notify vendor.');
        }
    } catch (err) {
        console.error('An error occurred while retrieving vendor token. ', err);
    }
}


export function setupOnMessageListener(callback: (payload: any) => void) {
    return isSupported().then(supported => {
        if(supported) {
            const messaging = getMessaging(getApp());
            return onMessage(messaging, (payload) => {
                console.log('Foreground message received.', payload);
                callback(payload);
            });
        }
        return () => {}; // Return an empty unsubscribe function if not supported
    });
}
