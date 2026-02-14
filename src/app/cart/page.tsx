'use client';

import { useCartAnimation } from '@/context/cart-animation-context';
import { ShoppingCart, Trash2, Plus, Minus, Ticket, Check } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import BlockedUserGuard from '@/components/blocked-user-guard';
import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Coupon, Vendor } from '@/lib/types';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const ConfettiExplosion = () => {
    const [pieces, setPieces] = useState<number[]>([]);

    useEffect(() => {
        const newPieces = Array.from({ length: 50 }, (_, i) => i);
        setPieces(newPieces);
    }, []);

    const colors = ['bg-primary', 'bg-accent-magenta', 'bg-yellow-400', 'bg-green-400'];

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {pieces.map(i => (
                <div
                    key={i}
                    className={cn("confetti-piece", colors[i % colors.length])}
                    style={{
                        left: `${Math.random() * 100}vw`,
                        animation: `confetti-fall ${Math.random() * 2 + 3}s linear ${i * 0.05}s forwards`,
                    }}
                />
            ))}
        </div>
    );
};


export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCartAnimation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [shake, setShake] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const vendorIdInCart = useMemo(() => (cartItems.length > 0 ? cartItems[0].product.vendorId : null), [cartItems]);
  const vendorRef = useMemoFirebase(() => (vendorIdInCart && firestore ? doc(firestore, 'vendors', vendorIdInCart) : null), [firestore, vendorIdInCart]);
  const { data: vendor } = useDoc<Vendor>(vendorRef);

  useEffect(() => {
    const savedDiscount = window.localStorage.getItem('grabclub-discount') === 'true';
    if (savedDiscount) {
      setDiscountApplied(true);
    }
  }, []);

  useEffect(() => {
    // If cart becomes empty, remove any applied discount
    if (cartItems.length === 0 && discountApplied) {
      setDiscountApplied(false);
      window.localStorage.removeItem('grabclub-discount');
    }
  }, [cartItems, discountApplied]);

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code || !firestore) return;
    
    const couponsRef = collection(firestore, 'coupons');
    const q = query(couponsRef, where('code', '==', code));

    try {
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
            variant: 'destructive',
            title: "Invalid Coupon Code",
            description: "The code you entered is not valid.",
        });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      const couponDoc = querySnapshot.docs[0];
      const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

      if (coupon.timesUsed >= coupon.usageLimit) {
        toast({
            variant: 'destructive',
            title: "Coupon Code Expired",
            description: "This code has reached its usage limit.",
        });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // Valid coupon, update usage in Firestore
      const couponRef = doc(firestore, 'coupons', coupon.id);
      await updateDoc(couponRef, {
          timesUsed: coupon.timesUsed + 1
      });

      // Apply discount locally and save to localStorage
      setDiscountApplied(true);
      setShowConfetti(true);
      window.localStorage.setItem('grabclub-discount', 'true');
      setTimeout(() => setShowConfetti(false), 5000); 
      toast({
          variant: 'success',
          title: "Congratulations!",
          description: "You've got free delivery!",
      });

    } catch (error) {
      console.error("Error applying promo code:", error);
      toast({
          variant: 'destructive',
          title: "Error",
          description: "Could not validate coupon code. Please try again.",
      });
    }
  };

  const baseDeliveryFee = vendor?.deliveryCharge ?? 50.00;
  const deliveryFee = discountApplied ? 0 : baseDeliveryFee;
  const total = getCartTotal() + deliveryFee;

  const pageContent = (
    <>
      {showConfetti && <ConfettiExplosion />}
      {cartItems.length === 0 ? (
        <div className="container py-16 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
            Your Cart is Empty
          </h1>
          <p className="mt-4 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
          <Button asChild className="mt-6">
              <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="container py-8">
          <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl mb-8">
            Your Cart
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(({product, quantity}) => (
                <div key={product.id} className="relative flex items-center gap-4 p-3 rounded-2xl bg-card/50 border border-white/10">
                    <Image 
                      src={product.image.src}
                      alt={product.image.alt}
                      width={64}
                      height={64}
                      className="rounded-md object-cover aspect-square flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline text-base leading-tight truncate pr-6">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.quantityUnit}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 border rounded-full p-0.5">
                            <Button size="icon" variant="ghost" className="rounded-full h-6 w-6" onClick={() => updateQuantity(product.id, quantity - 1)}>
                                <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-5 text-center font-bold text-sm">{quantity}</span>
                            <Button size="icon" variant="ghost" className="rounded-full h-6 w-6" onClick={() => updateQuantity(product.id, quantity + 1)}>
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-auto">
                        <p className="text-base font-bold">
                            ₹{(product.price * quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            ₹{product.price.toFixed(2)} each
                        </p>
                    </div>
                
                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive rounded-full h-6 w-6" onClick={() => removeFromCart(product.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
              ))}
            </div>
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 rounded-2xl bg-card/50 border border-white/10 sticky top-24">
                <h2 className="text-xl font-headline font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        {discountApplied ? (
                            <span className="text-green-500 font-semibold"><s>₹{baseDeliveryFee.toFixed(2)}</s> FREE</span>
                        ) : (
                            <span>₹{deliveryFee.toFixed(2)}</span>
                        )}
                    </div>
                     <div className="flex justify-between text-base font-bold pt-4 border-t border-border/20 mt-4">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>

                <Button asChild className="w-full mt-6 bg-gradient-to-r from-primary to-accent-magenta text-primary-foreground font-bold text-base shadow-lg transition-transform duration-300 hover:scale-105">
                    <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              </div>
              <div className="p-6 rounded-2xl bg-card/50 border border-white/10">
                <h2 className="text-xl font-headline font-bold mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Apply Coupon Code
                </h2>
                <div className={cn("flex space-x-2", shake && "animate-shake")}>
                  <Input
                    type="text"
                    placeholder="Enter coupon code"
                    className="flex-1"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={discountApplied}
                  />
                  <Button onClick={handleApplyPromo} disabled={discountApplied || !promoCode}>
                    {discountApplied ? <Check className="w-4 h-4" /> : 'Apply'}
                  </Button>
                </div>
                {discountApplied && (
                  <p className="mt-2 text-sm text-green-500 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Free Delivery Applied!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <BlockedUserGuard>
      {pageContent}
    </BlockedUserGuard>
  );
}
