import CategoryBrowser from '@/components/category-browser';
import HeroSection from '@/components/hero-section';
import BlockedUserGuard from '@/components/blocked-user-guard';

export default function Page() {
  return (
    <BlockedUserGuard>
      <HeroSection />
      <CategoryBrowser />
    </BlockedUserGuard>
  );
}
