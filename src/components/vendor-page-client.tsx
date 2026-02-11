'use client';

import ProductGrid from '@/components/product-grid';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useProducts } from '@/hooks/use-products';
import type { Vendor, Product } from '@/lib/types';
import GrabClubLoading from './layout/loading';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';


export default function VendorPageClient({ id }: { id: string }) {
  const firestore = useFirestore();
  const { isLoading: isProductsAndSeedingLoading } = useProducts();

  // Fetch the vendor document
  const vendorRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'vendors', id) : null
  , [firestore, id]);
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  // Fetch products specifically for this vendor
  const productsQuery = useMemoFirebase(() =>
    firestore ? query(collection(firestore, 'vendors', id, 'products')) : null
  , [firestore, id]);
  const { data: vendorProducts, isLoading: isProductsLoading } = useCollection<Product>(productsQuery);

  const isLoading = isProductsAndSeedingLoading || isVendorLoading || isProductsLoading;
  
  if (!isLoading && !vendor) {
    notFound();
  }

  if (isLoading) {
    return <GrabClubLoading />;
  }
  
  if (!vendor) {
    // This is a fallback, should not be reached due to the `notFound()` call above.
    return <div>Vendor not found.</div>;
  }

  return (
    <div>
      <section className="relative w-full h-[30vh] min-h-[200px] flex items-end justify-start text-left overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={vendor.image.src}
            alt={vendor.image.alt}
            data-ai-hint={vendor.image.hint}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-background/50" />
        </div>
        <div className="relative z-10 container pb-8">
          <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">{vendor.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">{vendor.description}</p>
        </div>
      </section>

      {vendor.status === 'inactive' ? (
        <div className="container text-center py-16">
            <h2 className="text-2xl font-bold">This vendor is not currently operating.</h2>
            <p className="text-muted-foreground mt-2">Please check back later.</p>
        </div>
      ) : (
        <ProductGrid title="Menu" products={vendorProducts || []} className="py-8 sm:py-12" />
      )}
    </div>
  );
}
