'use client';

import { categories } from '@/lib/data';
import { notFound } from 'next/navigation';
import { useProducts } from '@/hooks/use-products';
import { useMemo } from 'react';
import type { Vendor } from '@/lib/types';
import { Clock, Truck } from 'lucide-react';
import GrabClubLoading from '@/components/layout/loading';
import FoodVendorBrowser from '@/components/food-vendor-browser';
import GroceryBrowser from '@/components/grocery-browser';
import FruitsBrowser from '@/components/fruits-browser';
import VegetableBrowser from '@/components/vegetable-browser';
import BakeryBrowser from '@/components/bakery-browser';
import SweetsBrowser from '@/components/sweets-browser';
import MedicineOrderForm from '@/components/medicine-order-form';
import CyberCafePrintForm from '@/components/cyber-cafe-print-form';
import ProductGrid from '@/components/product-grid';
import AnimatedGroceryTitle from '@/components/grocery/animated-grocery-title';
import AnimatedFoodTitle from '@/components/food/animated-food-title';
import AnimatedFruitsTitle from '@/components/fruits/animated-fruits-title';
import AnimatedVegetableTitle from '@/components/vegetable/animated-vegetable-title';
import AnimatedBakeryTitle from '@/components/bakery/animated-bakery-title';
import AnimatedSweetsTitle from '@/components/sweets/animated-sweets-title';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';


export default function CategoryPageClient({ slug }: { slug: string }) {
  const category = categories.find((c) => c.id === slug);
  const { products, isLoading: isProductsLoading } = useProducts();
  const firestore = useFirestore();

  const vendorsQuery = useMemoFirebase(() => !isProductsLoading && firestore ? collection(firestore, 'vendors') : null, [isProductsLoading, firestore]);
  const { data: vendors, isLoading: isVendorsLoading } = useCollection<Vendor>(vendorsQuery);


  const foodProducts = useMemo(() => products.filter(p => p.category === 'food'), [products]);
  const categoryProducts = useMemo(() => products.filter((p) => p.category === slug), [products, slug]);

  const isLoading = isProductsLoading || isVendorsLoading;

  if (!category) {
    notFound();
  }

  const DeliveryTypeBanner = ({ vendorId }: { vendorId: string }) => {
    if (!vendors) return null;
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return null;

    if (vendor.deliveryType === 'grabclub') {
      return (
        <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <Clock className="mr-2 h-4 w-4" />
                Scheduled Delivery
            </div>
        </div>
      );
    }

    if (vendor.deliveryType === 'self') {
      return (
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm font-semibold text-green-500">
            <Truck className="mr-2 h-4 w-4" />
            Instant Delivery
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return <GrabClubLoading />;
  }

  if (slug === 'food') {
    return (
        <div className="container py-12 sm:py-16">
             <AnimatedFoodTitle />
            <FoodVendorBrowser vendors={(vendors || []).filter(v => v.category === 'food')} products={foodProducts} />
        </div>
    );
  }

  if (slug === 'grocery') {
    return (
      <div className="container py-12 sm:py-16">
        <AnimatedGroceryTitle />
        <DeliveryTypeBanner vendorId="general-store" />
        <GroceryBrowser />
      </div>
    );
  }

  if (slug === 'fruits') {
    return (
      <div className="container py-12 sm:py-16">
        <AnimatedFruitsTitle />
        <DeliveryTypeBanner vendorId="fresh-fruits" />
        <FruitsBrowser />
      </div>
    );
  }

  if (slug === 'vegetables') {
    return (
      <div className="container py-12 sm:py-16">
        <AnimatedVegetableTitle />
        <DeliveryTypeBanner vendorId="fresh-vegetables" />
        <VegetableBrowser />
      </div>
    );
  }
  
  if (slug === 'bakery') {
    return (
      <div className="container py-12 sm:py-16">
        <AnimatedBakeryTitle />
        <DeliveryTypeBanner vendorId="sweet-treats-bakery" />
        <BakeryBrowser />
      </div>
    );
  }

  if (slug === 'sweets') {
    return (
      <div className="container py-12 sm:py-16">
        <AnimatedSweetsTitle />
        <DeliveryTypeBanner vendorId="sweets-shop" />
        <SweetsBrowser />
      </div>
    );
  }

  if (slug === 'medicine') {
    return <MedicineOrderForm />;
  }

  if (slug === 'cyber-cafe') {
    return <CyberCafePrintForm />;
  }

  return (
    <div>
        {categoryProducts.length > 0 ? (
            <ProductGrid title={category.name} products={categoryProducts} />
        ) : (
            <div className="container text-center py-16">
                <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl mb-8">
                    {category.name}
                </h1>
                <p className="text-muted-foreground">No products found in this category yet.</p>
            </div>
        )}
    </div>
  );
}
