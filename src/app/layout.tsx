import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
        {/* The Header and FloatingNav were temporarily removed to fix the 404 error. */}
        {/* I will restore them in the next step. */}
        <div className="relative flex min-h-screen flex-col bg-background">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}