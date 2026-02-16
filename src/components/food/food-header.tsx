'use client';
import { useEffect, useState } from 'react';
import { vendors } from '@/lib/data';

export default function FoodHeader() {
  const [vendorName, setVendorName] = useState('');

  useEffect(() => {
    const vendorId = sessionStorage.getItem('vendorId');
    if (vendorId) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        setVendorName(vendor.name);
      } else {
        setVendorName('Food Vendor');
      }
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <h1 className="text-xl font-bold">{vendorName} Dashboard</h1>
      </div>
    </header>
  );
}
