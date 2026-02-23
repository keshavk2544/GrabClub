
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MedicineHeader from '@/components/medicine/medicine-header';
import { Toaster } from '@/components/ui/toaster';
import VendorNotificationHandler from '@/components/vendor-notification-handler';

export default function MedicineDashboardLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isMedicineVendor') === 'true';
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [router]);

  if (typeof window !== 'undefined' && sessionStorage.getItem('isMedicineVendor') !== 'true') {
    return (
        <div className="flex items-center justify-center h-screen bg-background text-foreground">
            <p>Redirecting to login...</p>
        </div>
    );
  }

  return (
      <div className="flex flex-col min-h-screen bg-muted/40">
          <MedicineHeader />
          <VendorNotificationHandler />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
          <Toaster />
      </div>
  );
}
