'use client';
import { useState, useEffect } from 'react';

// Mock user type. The real one might be more complex.
type MockUser = {
  uid: string;
  email: string | null;
  displayName?: string | null;
} | null;

// Mock implementation of useUser hook
export const useUser = () => {
  const [user, setUser] = useState<MockUser>(null);

  useEffect(() => {
    // In this mock, we'll simulate a logged-in user after a short delay.
    console.warn("Firebase (useUser) is not fully configured. Using mock user data.");
    const timeout = setTimeout(() => {
      setUser({ uid: 'mock-user-id', email: 'user@example.com', displayName: 'Mock User' });
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  return { user };
};
