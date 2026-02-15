// This file re-exports the core Firebase hooks and utilities.
// The original content was lost and has been reconstructed.

export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDocument } from './firestore/use-doc';
export { firebaseConfig } from './config';

// Placeholder for useFirestore, assuming it might have been here.
export const useFirestore = () => {
    console.warn("Firebase (useFirestore) is a placeholder and not fully configured.");
    return null;
}

// Placeholder for useMemoFirebase, assuming it might have been here.
import { useMemo } from 'react';
export const useMemoFirebase = (callback: () => any, deps: any[]) => {
    return useMemo(callback, deps);
}
