'use client';

import HeroSection from '@/components/hero-section';
import CategoryBrowser from '@/components/category-browser';
import BlockedUserGuard from '@/components/blocked-user-guard';

export default function HomePage() {
  return (
    <BlockedUserGuard>
      <div className="flex flex-col">
        <HeroSection />
        <CategoryBrowser />
      </div>
    </BlockedUserGuard>
  );
}
