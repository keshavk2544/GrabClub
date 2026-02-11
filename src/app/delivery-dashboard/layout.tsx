'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DeliveryHeader from '@/components/delivery/delivery-header';
import { Toaster } from '@/components/ui/toaster';

export default function DeliveryDashboardLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();

  useEffect(() => {
    // This is a simple client-side check. In a real app, this would be a secure server-side session check.
    const isLoggedIn = sessionStorage.getItem('isDeliveryPerson') === 'true';
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [router]);

  // We can show a loading state while checking
  if (typeof window !== 'undefined' && sessionStorage.getItem('isDeliveryPerson') !== 'true') {
    return (
        <div className="flex items-center justify-center h-screen bg-background text-foreground">
            <p>Redirecting to login...</p>
        </div>
    );
  }

  return (
      <div className="flex flex-col min-h-screen bg-muted/40">
          <DeliveryHeader />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
          <Toaster />
      </div>
  );
}
