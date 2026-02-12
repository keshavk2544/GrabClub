'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/components/hero-section';
import CategoryBrowser from '@/components/category-browser';
import BlockedUserGuard from '@/components/blocked-user-guard';
import WelcomePage from '@/components/welcome-page';
import GrabClubLoading from '@/components/layout/loading';

const WELCOME_KEY = 'grabclub-welcome-completed';

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    // This effect should only run on the client side
    if (typeof window !== 'undefined') {
      const welcomeCompleted = localStorage.getItem(WELCOME_KEY) === 'true';
      setShowWelcome(!welcomeCompleted);
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setShowWelcome(false);
  };

  if (showWelcome === null) {
    // While checking localStorage, show a loading state
    return <GrabClubLoading />;
  }

  if (showWelcome) {
    return <WelcomePage onEnter={handleEnter} />;
  }

  return (
    <BlockedUserGuard>
      <div className="flex flex-col">
        <HeroSection />
        <CategoryBrowser />
      </div>
    </BlockedUserGuard>
  );
}
