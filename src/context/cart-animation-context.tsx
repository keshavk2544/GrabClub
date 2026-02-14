'use client';

import type { Product, ProductVariant } from '@/lib/types';
import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VariantSelectionDialog } from '@/components/variant-selection-dialog';

export type CartItem = { product: Product; quantity: number, variant?: ProductVariant };

type Animation = {
  id: number;
  product: Product;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type CartAnimationContextType = {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (product: Product, event: React.MouseEvent<HTMLElement>) => void;
  removeFromCart: (productId: string, variantName?: string) => void;
  updateQuantity: (productId: string, newQuantity: number, variantName?: string) => void;
  getCartTotal: () => number;
  clearCart: () => void;
  replaceCart: (items: CartItem[]) => void;
};

const CartAnimationContext = createContext<CartAnimationContextType | undefined>(undefined);

export const CartAnimationProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [animations, setAnimations] = useState<Animation[]>([]);
  const { toast } = useToast();
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string, description: string } | null>(null);
  const [pendingProductInfo, setPendingProductInfo] = useState<{ product: Product; variant?: ProductVariant } | null>(null);
  const [pendingReorderItems, setPendingReorderItems] = useState<CartItem[] | null>(null);
  
  const buttonRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const [showPopup, setShowPopup] = useState(false);
  const [addedProduct, setAddedProduct] = useState<Product | null>(null);
  const isCartPage = pathname === '/cart';

  const [productForVariantSelection, setProductForVariantSelection] = useState<Product | null>(null);

  const startAnimation = (product: Product, button: HTMLElement) => {
    const rect = button.getBoundingClientRect();
    
    const cartIcon = document.querySelector('.cart-icon');
    const cartRect = cartIcon?.getBoundingClientRect();

    const animationId = Date.now();
    
    setAnimations(prev => [...prev, {
      id: animationId,
      product,
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      endX: cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth / 2,
      endY: cartRect ? cartRect.top + cartRect.height / 2 : window.innerHeight - 48,
    }]);

    setTimeout(() => {
      setAnimations(prev => prev.filter(a => a.id !== animationId));
    }, 1400);
  };

  const _addToCartInternal = (product: Product, event?: React.MouseEvent<HTMLElement>, variant?: ProductVariant) => {
    const targetButton = event?.currentTarget || buttonRef.current;
    if (!targetButton) return;

    if (cartItems.length > 0 && cartItems[0].product.vendorId !== product.vendorId) {
      setPendingProductInfo({ product, variant });
      buttonRef.current = targetButton;
      setAlertConfig({
        title: 'Clear Cart?',
        description: 'You can only order from one restaurant or store at a time. Would you like to clear your current cart and add this item?'
      });
      setIsAlertOpen(true);
      return;
    }
    
    const quantityInCart = cartItems.find(item => 
        item.product.id === product.id && item.variant?.name === variant?.name
    )?.quantity || 0;

    if (product.inventory <= 0 || product.inventory <= quantityInCart) {
        toast({
            variant: 'destructive',
            title: 'Out of Stock',
            description: `Sorry, "${product.name}" is currently sold out.`,
        });
        return;
    }

    startAnimation(product, targetButton);
    
    setAddedProduct(product);
    if (!isCartPage) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
    }

    setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => 
            item.product.id === product.id && item.variant?.name === variant?.name
        );

        if (existingItemIndex > -1) {
            const newItems = [...prevItems];
            newItems[existingItemIndex].quantity += 1;
            return newItems;
        } else {
            return [...prevItems, { product, quantity: 1, variant }];
        }
    });
  };

  const addToCart = (product: Product, event: React.MouseEvent<HTMLElement>) => {
    buttonRef.current = event.currentTarget;
    if (product.variants && product.variants.length > 0) {
      setProductForVariantSelection(product);
    } else {
      _addToCartInternal(product, event);
    }
  };


  const replaceCart = (items: CartItem[]) => {
    if (cartItems.length > 0) {
      setPendingReorderItems(items);
      setAlertConfig({
        title: 'Replace Cart?',
        description: 'This will remove all items currently in your cart and replace them with the items from your past order. Do you want to continue?'
      });
      setIsAlertOpen(true);
    } else {
      setCartItems(items);
      setAddedProduct(items[0].product);
      if (!isCartPage) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);
      }
    }
  };

  const handleConfirmClearCart = () => {
    window.localStorage.removeItem('grabclub-discount');
    if (pendingProductInfo && buttonRef.current) {
        const { product, variant } = pendingProductInfo;
        startAnimation(product, buttonRef.current);
        
        setAddedProduct(product);
        if (!isCartPage) {
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 4000);
        }

        setCartItems([{ product, quantity: 1, variant }]);
    } else if (pendingReorderItems) {
        setCartItems(pendingReorderItems);
        setAddedProduct(pendingReorderItems[0].product);
        if (!isCartPage) {
          setShowPopup(true);
          setTimeout(() => setShowPopup(false), 4000);
        }
    }
    handleAlertCancel();
  };
  
  const removeFromCart = (productId: string, variantName?: string) => {
    setCartItems(prev => prev.filter(item => 
        item.product.id !== productId || item.variant?.name !== variantName
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    window.localStorage.removeItem('grabclub-discount');
  };
  
  const updateQuantity = (productId: string, newQuantity: number, variantName?: string) => {
    const itemToUpdate = cartItems.find(item => 
      item.product.id === productId && item.variant?.name === variantName
    );
    if (!itemToUpdate) return;
    
    const { product } = itemToUpdate;
    if (newQuantity > product.inventory) {
        toast({
            variant: "destructive",
            title: "Stock Limit Exceeded",
            description: `You can only order up to ${product.inventory} of "${product.name}".`,
        });
        return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId, variantName);
    } else {
      setCartItems(prev => prev.map(item => 
        (item.product.id === productId && item.variant?.name === variantName) 
        ? { ...item, quantity: newQuantity } 
        : item
      ));
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.variant ? item.variant.price : item.product.price;
      return total + price * item.quantity;
    }, 0);
  }

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleAlertCancel = () => {
    setIsAlertOpen(false);
    setAlertConfig(null);
    setPendingProductInfo(null);
    setPendingReorderItems(null);
    buttonRef.current = null;
  }

  return (
    <CartAnimationContext.Provider value={{ cartItems, cartCount, addToCart, removeFromCart, updateQuantity, getCartTotal, clearCart, replaceCart }}>
      {children}
      
      <VariantSelectionDialog 
        product={productForVariantSelection}
        isOpen={!!productForVariantSelection}
        setIsOpen={() => setProductForVariantSelection(null)}
        onAddToCart={_addToCartInternal}
        buttonRef={buttonRef}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig?.title || 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig?.description || 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAlertCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClearCart}>
              {pendingReorderItems ? 'Replace Cart' : 'Clear Cart & Add'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showPopup && addedProduct && (
        <div className="fixed bottom-[72px] md:bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-[slideUpFade_0.4s_ease-out]">
            <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent-magenta blur-xl opacity-40 rounded-full"></div>
            <div className="relative bg-gradient-to-r from-card to-background border-2 border-primary/50 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-[scalePulse_0.6s_ease-out]">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <Link href="/cart" className="flex items-center gap-2 group">
                    <span className="text-foreground font-semibold group-hover:text-primary transition-colors text-sm">View Cart</span>
                </Link>
            </div>
            </div>
        </div>
      )}

      {animations.map((anim) => (
        <div
          key={anim.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${anim.startX}px`,
            top: `${anim.startY}px`,
            animation: `dropToCart 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            // @ts-ignore
            '--end-x': `${anim.endX - anim.startX}px`,
            '--end-y': `${anim.endY - anim.startY}px`,
          }}
        >
          {/* Glow effect background */}
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-primary to-accent-magenta rounded-full blur-xl opacity-60 animate-pulse"></div>
          
          {/* Main item with shadow */}
          <div className="relative text-5xl md:text-6xl filter drop-shadow-2xl" style={{
            animation: 'floatSpin 1.4s ease-out',
            textShadow: '0 0 30px hsl(var(--primary) / 0.8), 0 10px 40px rgba(0, 0, 0, 0.5)'
          }}>
            {anim.product.emoji}
          </div>

          {/* Trail effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-orange-400 to-transparent opacity-40 blur-sm"
               style={{ animation: 'trail 1.4s ease-out' }}>
          </div>
        </div>
      ))}
    </CartAnimationContext.Provider>
  );
};

export const useCartAnimation = () => {
  const context = useContext(CartAnimationContext);
  if (context === undefined) {
    throw new Error('useCartAnimation must be used within a CartAnimationProvider');
  }
  return context;
};
