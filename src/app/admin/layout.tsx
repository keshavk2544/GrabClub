'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // Start with null to represent the "loading" or "unchecked" state.
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // This client-side check is for demonstration purposes only.
    // In a production application, this should be a server-side check based on a secure session or token.
    if (sessionStorage.getItem('isAdmin') === 'true') {
      setIsAuthorized(true);
    } else {
      // If not authorized, set state to false and redirect.
      setIsAuthorized(false);
      router.replace('/login');
    }
  }, [router]);

  // While checking authorization, render nothing to prevent layout flashes.
  if (isAuthorized === null) {
    return null;
  }

  // If authorized, render the admin content. Otherwise, the redirect is in progress.
  return isAuthorized ? <>{children}</> : (
    <div className="flex items-center justify-center h-screen bg-background text-foreground">
      <p>Redirecting to login...</p>
    </div>
  );
}
