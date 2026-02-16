'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Vendor } from '@/lib/types';
import { useFirestore } from '@/firebase';
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  collection,
  collectionGroup,
  query,
  writeBatch,
  onSnapshot,
  getDocs,
  getDoc,
  limit,
  setDoc,
} from 'firebase/firestore';
import { products as initialProducts, vendors as initialVendors } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import GrabClubLoading from '@/components/layout/loading';

const DB_VERSION = 2; // Increment this to force a re-seed if initial data changes.

interface ProductsContextType {
  products: Product[];
  addProduct: (newProduct: Omit<Product, 'id' | 'image' | 'emoji'> & { image: { src: string, alt: string } }) => Promise<void>;
  updateProduct: (productId: string, updatedProductData: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (productId: string, vendorId: string) => Promise<void>;
  decrementInventory: (items: { productId: string; quantity: number }[]) => Promise<void>;
  isLoading: boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const seedDatabase = useCallback(async () => {
    if (!firestore) return;
    console.log(`Seeding database with initial data (v${DB_VERSION})...`);
    try {
      const configRef = doc(firestore, '_internal', 'version');
      
      // Use merge:true to avoid overwriting unrelated fields if any
      const vendorsBatch = writeBatch(firestore);
      initialVendors.forEach(vendor => {
        const vendorRef = doc(firestore, 'vendors', vendor.id);
        vendorsBatch.set(vendorRef, vendor, { merge: true }); // Safer write
      });
      await vendorsBatch.commit();
      
      const productsBatch = writeBatch(firestore);
      initialProducts.forEach(product => {
        const productRef = doc(firestore, `vendors/${product.vendorId}/products`, product.id);
        productsBatch.set(productRef, product, { merge: true }); // Safer write
      });
      await productsBatch.commit();
      
      // After successful seeding, set the version
      await setDoc(configRef, { version: DB_VERSION });
      
      toast({
        title: "Welcome!",
        description: "Sample vendors and products have been added.",
        variant: 'success',
      });
    } catch (error) {
      console.error("Database seeding failed:", error);
      toast({
        title: "Seeding Failed",
        description: "Could not add sample data.",
        variant: 'destructive',
      });
    }
  }, [firestore, toast]);

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }

    let isInitialLoad = true;
    let unsubscribe = () => {};

    const initialize = async () => {
      try {
        // This is a much more robust way to check if seeding is needed.
        const configRef = doc(firestore, '_internal', 'version');
        const configSnap = await getDoc(configRef);
        
        if (!configSnap.exists() || configSnap.data().version < DB_VERSION) {
          await seedDatabase();
        }
        
        const q = query(collectionGroup(firestore, 'products'));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedProducts = snapshot.docs.map(doc => ({ ...doc.data() as Product, id: doc.id }));
          setProducts(fetchedProducts);
          if (isInitialLoad) {
            setIsLoading(false);
            isInitialLoad = false;
          }
        }, (error) => {
          console.error("Error fetching products in real-time:", error);
          setIsLoading(false);
        });

      } catch (e) {
        console.error("Error during product initialization:", e);
        setIsLoading(false);
      }
    };

    initialize();

    return () => unsubscribe();
  }, [firestore, seedDatabase, toast]);


  const addProduct = useCallback(async (newProductData: Omit<Product, 'id' | 'image' | 'emoji'> & { image: { src: string, alt: string } }) => {
    if (!firestore || !newProductData.vendorId) return;
    
    const productToSave = {
        ...newProductData,
        image: { ...newProductData.image, width: 400, height: 300, hint: newProductData.name },
        emoji: '📦',
    };
    
    const productsCollectionRef = collection(firestore, 'vendors', newProductData.vendorId, 'products');
    await addDoc(productsCollectionRef, productToSave);
  }, [firestore]);

  const updateProduct = useCallback(async (productId: string, updatedProductData: Partial<Omit<Product, 'id'>>) => {
    if (!firestore) return;
    const { vendorId, ...restData } = updatedProductData;
    if (!vendorId) {
        const product = products.find(p => p.id === productId);
        if(product && product.vendorId) {
            const productRef = doc(firestore, 'vendors', product.vendorId, 'products', productId);
            await updateDoc(productRef, restData);
        } else {
             console.error("Update failed: vendorId is missing and could not be found.");
        }
        return;
    }
    const productRef = doc(firestore, 'vendors', vendorId, 'products', productId);
    await updateDoc(productRef, restData);
  }, [firestore, products]);

  const deleteProduct = useCallback(async (productId: string, vendorId: string) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'vendors', vendorId, 'products', productId);
    await deleteDoc(productRef);
  }, [firestore]);

  const decrementInventory = useCallback(async (itemsToDecrement: { productId: string; quantity: number }[]) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    
    itemsToDecrement.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && product.vendorId) {
        const productRef = doc(firestore, 'vendors', product.vendorId, 'products', item.productId);
        const newInventory = product.inventory - item.quantity;
        batch.update(productRef, { inventory: newInventory >= 0 ? newInventory : 0 });
      }
    });

    await batch.commit();
  }, [firestore, products]);

  const value = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    decrementInventory,
    isLoading,
  };

  if (isLoading) {
    return <GrabClubLoading />;
  }

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
