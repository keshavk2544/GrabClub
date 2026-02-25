
'use client';

import { useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { requestVendorPermissionAndSaveToken, setupOnMessageListener } from '@/firebase/messaging';
import { useToast } from '@/hooks/use-toast';

export default function VendorNotificationHandler() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Pre-load the audio element when the component mounts.
    useEffect(() => {
        // Ensure this only runs on the client
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/new-order.mp3');
            audioRef.current.loop = false; // We don't loop here; the repeated notifications create the effect.
        }
    }, []);

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
                console.log('Foreground message received.', payload);
                // Always show the toast notification.
                toast({
                    title: payload.notification?.title,
                    description: payload.notification?.body,
                });

                // Manually play the sound for foreground notifications if the file exists.
                if (audioRef.current) {
                    // Resetting currentTime ensures the sound plays from the beginning
                    // for each "ding" of the simulated ringing.
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(error => {
                        console.error('Error playing notification sound:', error);
                        // This can happen if the user hasn't interacted with the page yet.
                        // The browser may block autoplay. The toast is a good fallback.
                    });
                }
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
