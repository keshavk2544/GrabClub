// This file is no longer used and can be deleted.
// The logic has been moved to src/app/checkout/page.tsx.

'use client';

import GrabClubLoading from '@/components/layout/loading';

export default function DeprecatedPaymentPage() {
  return (
    <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold">This page is no longer in use.</h1>
        <p className="text-muted-foreground mt-2">You will be redirected shortly.</p>
        <GrabClubLoading />
    </div>
  );
}
