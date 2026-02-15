import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from './layout/header';
import FloatingNav from './layout/floating-nav';
import { Toaster } from '@/components/ui/toaster';
import { CartAnimationProvider } from '@/context/cart-animation-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GrabClub',
  description: 'Your one-stop shop for everything you need, delivered fast.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <CartAnimationProvider>
          <div className="relative flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1">{children}</main>
            <FloatingNav />
            <Toaster />
          </div>
        </CartAnimationProvider>
      </body>
    </html>
  );
}
