import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import FloatingNav from '@/components/layout/floating-nav';
import { CartAnimationProvider } from '@/context/cart-animation-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ProductsProvider } from '@/hooks/use-products';
import { GroceryCategoryProvider } from '@/context/grocery-categories-context';
import { FruitCategoryProvider } from '@/context/fruit-categories-context';
import { VegetableCategoryProvider } from '@/context/vegetable-categories-context';
import { BakeryCategoryProvider } from '@/context/bakery-categories-context';
import { SweetsCategoryProvider } from '@/context/sweets-categories-context';
import { FoodCategoryProvider } from '@/context/food-categories-context';
import ActiveOrderTracker from '@/components/active-order-tracker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'GrabClub',
  description: 'Fast delivery for college students.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col pb-16 md:pb-0">
        <FirebaseClientProvider>
          <CartAnimationProvider>
            <ProductsProvider>
              <FoodCategoryProvider>
                <GroceryCategoryProvider>
                  <FruitCategoryProvider>
                    <VegetableCategoryProvider>
                      <BakeryCategoryProvider>
                        <SweetsCategoryProvider>
                          <Header />
                          <main className="flex-grow">{children}</main>
                          <Footer />
                          <FloatingNav />
                          <ActiveOrderTracker />
                          <Toaster />
                        </SweetsCategoryProvider>
                      </BakeryCategoryProvider>
                    </VegetableCategoryProvider>
                  </FruitCategoryProvider>
                </GroceryCategoryProvider>
              </FoodCategoryProvider>
            </ProductsProvider>
          </CartAnimationProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
