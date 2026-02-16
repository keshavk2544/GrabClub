'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import type { Order, Coupon } from '@/lib/types';
import GrabClubLoading from '@/components/layout/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Ticket, CheckCircle } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProducts } from '@/hooks/use-products';

export default function PaymentPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { decrementInventory } = useProducts();

  const orderRef = useMemoFirebase(() => (firestore && orderId ? doc(firestore, 'orders', orderId) : null), [firestore, orderId]);
  const { data: order, isLoading: isOrderLoading, error } = useDoc<Order>(orderRef);
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    if (order && order.couponCode) {
      setCouponCode(order.couponCode);
    }
  }, [order]);

  const handleApplyCoupon = async () => {
    if (!order || !couponCode.trim() || !firestore) return;
    setIsApplyingCoupon(true);
    
    const code = couponCode.trim().toUpperCase();
    
    const couponsRef = collection(firestore, 'coupons');
    const q = query(couponsRef, where('code', '==', code));
    
    try {
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ variant: 'destructive', title: "Invalid Coupon" });
        setIsApplyingCoupon(false);
        return;
      }

      const couponDoc = querySnapshot.docs[0];
      const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

      if (coupon.timesUsed >= coupon.usageLimit) {
        toast({ variant: 'destructive', title: "Coupon Expired" });
        setIsApplyingCoupon(false);
        return;
      }
      
      const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const platformFee = order.platformFee || 0;

      if (order.total > (subtotal + platformFee)) { // Check if a delivery fee was applied
        const batch = writeBatch(firestore);

        const couponRef = doc(firestore, 'coupons', coupon.id);
        batch.update(couponRef, { timesUsed: coupon.timesUsed + 1 });
        
        if(orderRef) {
             batch.update(orderRef, {
                total: subtotal + platformFee,
                couponApplied: true,
                couponCode: code,
            });
        }
       
        await batch.commit();
        toast({ variant: 'success', title: "Coupon Applied!", description: "Free delivery unlocked." });
      } else {
        toast({ variant: 'default', title: "No Delivery Fee", description: "This order already has free delivery." });
      }

    } catch (error) {
      console.error("Error applying coupon:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not apply coupon." });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;
    setIsProcessingPayment(true);

    const loadScript = (src: string) => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => { resolve(true); };
            script.onerror = () => { resolve(false); };
            document.body.appendChild(script);
        });
    };

    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
        toast({ variant: 'destructive', title: 'Payment Gateway Error', description: 'Could not load payment script.' });
        setIsProcessingPayment(false);
        return;
    }

    try {
        const response = await fetch('/api/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: order.total }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not connect to payment gateway.');
        }

        const razorpayOrder = await response.json();
        
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            amount: razorpayOrder.amount.toString(),
            currency: "INR",
            name: "GrabClub",
            description: `Payment for Order #${order.id.split('-').pop()}`,
            order_id: razorpayOrder.id,
            callback_url: `${window.location.origin}/api/razorpay/verify?order_id=${order.id}`,
            redirect: true,
            prefill: {
                name: user?.displayName || '',
                email: user?.email || '',
                contact: order.customerPhone,
            },
            theme: { color: "#FE9D15" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function () {
            toast({ variant: 'destructive', title: 'Payment Failed', description: 'Please try again or contact support.' });
            setIsProcessingPayment(false);
        });
        rzp.open();

    } catch (error) {
        console.error('Payment process failed:', error);
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        setIsProcessingPayment(false);
    }
  };

  if (isOrderLoading || isUserLoading) {
    return <GrabClubLoading />;
  }

  if (error || !order) {
    return (
        <div className="container py-8">
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Could not load order details. Please try again or go back to your orders.</AlertDescription>
            </Alert>
        </div>
    );
  }

  if (order.status !== 'pending payment') {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold">This order has already been processed.</h1>
        <p className="text-muted-foreground mt-2">Current status: <span className="font-semibold">{order.status}</span></p>
        <Button asChild className="mt-4"><a href="/orders">View Your Orders</a></Button>
      </div>
    );
  }
  
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = order.platformFee || 0;
  const deliveryFee = order.total - subtotal - platformFee;

  return (
    <div className="container py-12 sm:py-16">
        <div className="max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Complete Your Payment</CardTitle>
                    <CardDescription>Review your order details and complete the payment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between">
                                <span className="text-muted-foreground">{item.name} x {item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <Separator />
                     <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {platformFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Platform Fee</span>
                                <span>₹{platformFee.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery Fee</span>
                             {order.couponApplied ? (
                                <span className="text-green-500 font-semibold">FREE</span>
                            ) : (
                                <span>₹{deliveryFee.toFixed(2)}</span>
                            )}
                        </div>
                    </div>
                    <Separator />
                    {!order.couponApplied && deliveryFee > 0 ? (
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="coupon-code" className="text-sm font-medium flex items-center gap-2"><Ticket className="w-4 h-4" /> Apply Coupon</Label>
                             <div className="flex gap-2">
                                <Input 
                                    id="coupon-code" 
                                    placeholder="Enter code" 
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    disabled={isApplyingCoupon}
                                />
                                <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode}>
                                    {isApplyingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Apply
                                </Button>
                            </div>
                        </div>
                    ) : (
                         order.couponApplied && <div className="text-sm font-semibold text-green-500 flex items-center justify-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
                            <CheckCircle className="w-4 h-4" />
                            Coupon for Free Delivery Applied!
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span>₹{order.total.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>
            <Button onClick={handlePayment} className="w-full mt-6" disabled={isProcessingPayment}>
                {isProcessingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay ₹{order.total.toFixed(2)} Now
            </Button>
        </div>
    </div>
  );
}
