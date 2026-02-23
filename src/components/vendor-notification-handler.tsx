
'use client';

import { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { requestVendorPermissionAndSaveToken, setupOnMessageListener } from '@/firebase/messaging';
import { useToast } from '@/hooks/use-toast';

export default function VendorNotificationHandler() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // 1. Request permission and save token on vendor login
    useEffect(() => {
        const vendorId = sessionStorage.getItem('vendorId');
        if (vendorId && firestore) {
            requestVendorPermissionAndSaveToken(vendorId, firestore);
        }
    }, [firestore]);

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
