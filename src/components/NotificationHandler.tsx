'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPermissionAndSaveToken, setupOnMessageListener } from '@/firebase/messaging';
import { useToast } from '@/hooks/use-toast';

export default function NotificationHandler() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // 1. Request permission and save token on user login
    useEffect(() => {
        if (user && firestore) {
            requestPermissionAndSaveToken(user, firestore);
        }
    }, [user, firestore]);

    // 2. Set up foreground message listener
    useEffect(() => {
        const setupListener = async () => {
            const unsubscribe = await setupOnMessageListener((payload) => {
                toast({
                    title: payload.notification?.title,
                    description: payload.notification?.body,
                });
            });
            return unsubscribe;
        };

        const unsubscribePromise = setupListener();

        return () => {
            unsubscribePromise.then(unsubscribe => {
                if (unsubscribe) {
                    unsubscribe();
                }
            });
        };
    }, [toast]);

    return null; // This component doesn't render anything
}
