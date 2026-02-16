'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const noFooterPaths = [
    '/login',
    '/admin',
    '/food-dashboard',
    '/grocery-dashboard',
    '/fruits-dashboard',
    '/vegetable-dashboard',
    '/bakery-dashboard',
    '/sweets-dashboard',
    '/medicine-dashboard',
    '/cyber-dashboard',
    '/delivery-dashboard'
  ];

  const isHomePage = pathname === '/';
  const isNoFooterPage = noFooterPaths.some(path => pathname.startsWith(path));

  if (isHomePage || isNoFooterPage) {
    return null;
  }

  return (
    <footer className="border-t border-border/40">
      <div className="container flex h-16 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {currentYear ? `© ${currentYear} GrabClub. All rights reserved.` : <>&nbsp;</>}
        </p>
      </div>
    </footer>
  );
}
