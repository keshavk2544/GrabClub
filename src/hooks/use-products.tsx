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
  limit,
} from 'firebase/firestore';
import { products as initialProducts, vendors as initialVendors } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import GrabClubLoading from '@/components/layout/loading';

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
    console.log("Seeding database with initial data...");
    try {
      // Seed vendors
      const vendorsBatch = writeBatch(firestore);
      initialVendors.forEach(vendor => {
        const vendorRef = doc(firestore, 'vendors', vendor.id);
        vendorsBatch.set(vendorRef, vendor);
      });
      await vendorsBatch.commit();

      // Seed products
      const productsBatch = writeBatch(firestore);
      initialProducts.forEach(product => {
        const productRef = doc(firestore, `vendors/${product.vendorId}/products`, product.id);
        productsBatch.set(productRef, product);
      });
      await productsBatch.commit();
      
      toast({
        title: "Welcome!",
        description: "Sample vendors and products have been added to your app.",
        variant: 'success',
      });
    } catch (error) {
      console.error("Database seeding failed:", error);
      toast({
        title: "Seeding Failed",
        description: "Could not add sample data. Please check the console.",
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
        const vendorsCollection = collection(firestore, 'vendors');
        const snapshot = await getDocs(query(vendorsCollection, limit(1)));
        
        if (snapshot.empty) {
          await seedDatabase();
        } else {
          // Data migration check for existing vendors
          const allVendorsSnapshot = await getDocs(vendorsCollection);
          const batch = writeBatch(firestore);
          let needsMigration = false;
          
          allVendorsSnapshot.forEach(vendorDoc => {
            const vendorData = vendorDoc.data() as Vendor;
            const vendorRef = doc(firestore, 'vendors', vendorDoc.id);
            let updateNeeded = false;
            const updatePayload: Partial<Vendor> = {};

            if (vendorData.deliveryType === undefined) {
                const seedVendor = initialVendors.find(v => v.id === vendorDoc.id);
                if (seedVendor?.deliveryType) {
                    updatePayload.deliveryType = seedVendor.deliveryType;
                    updateNeeded = true;
                }
            }
            
            if (vendorData.deliveryCharge === undefined) {
                updatePayload.deliveryCharge = 50; // Default charge
                updateNeeded = true;
            }

            if (updateNeeded) {
                batch.update(vendorRef, updatePayload);
                needsMigration = true;
            }
          });

          if (needsMigration) {
            await batch.commit();
            console.log("Vendor data migration for delivery options complete.");
            toast({
              title: "System Update",
              description: "Vendor data has been successfully updated.",
            });
          }
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
