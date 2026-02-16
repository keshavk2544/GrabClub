'use client';

import Link from 'next/link';
import { Search, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import UserNav from './user-nav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentEmoji, setCurrentEmoji] = useState(0);
  const emojis = ['🍕', '🍔', '🥗', '🍜', '🌮', '🍱', '🥘', '🍗', '🍟', '🧀', '🥪', '🍲', '🌽', '🥦', '🍓', '🍇', '🥬', '🌾', '💊', '💉', '🍰'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji(prev => (prev + 1) % emojis.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [emojis.length]);
  
  const handleAdminSignOut = () => {
    sessionStorage.removeItem('isAdmin');
    router.push('/login');
    toast({ title: 'Signed out successfully.' });
  };
  
  const isDashboardPage = pathname.startsWith('/admin') || 
                          pathname.startsWith('/food-dashboard') || 
                          pathname.startsWith('/grocery-dashboard') || 
                          pathname.startsWith('/fruits-dashboard') || 
                          pathname.startsWith('/vegetable-dashboard') || 
                          pathname.startsWith('/bakery-dashboard') || 
                          pathname.startsWith('/sweets-dashboard') || 
                          pathname.startsWith('/medicine-dashboard') || 
                          pathname.startsWith('/cyber-dashboard') ||
                          pathname.startsWith('/delivery-dashboard');

  if (pathname === '/login' || (isDashboardPage && !pathname.startsWith('/admin'))) {
    return null; // No header on login or vendor/delivery dashboards
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href={pathname.startsWith('/admin') ? '/admin' : '/'} className="mr-6 flex items-center space-x-2">
          <div className="relative flex h-8 w-8 items-center justify-center">
            {emojis.map((emoji, i) => (
              <div
                key={i}
                className={`absolute text-3xl transition-all duration-500 ${
                  currentEmoji === i
                    ? 'scale-100 opacity-100 rotate-0'
                    : 'scale-0 opacity-0 rotate-180'
                }`}
              >
                {emoji}
              </div>
            ))}
          </div>
          <span className="font-headline text-lg font-bold text-foreground">
            Grab<span className="text-primary">Club</span>
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {pathname.startsWith('/admin') ? (
             <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold hidden sm:block">Admin Dashboard</h1>
                <Button variant="outline" onClick={handleAdminSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
              </div>
          ) : (
            <nav className="flex items-center space-x-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-9 w-64" />
              </div>
              <UserNav />
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
