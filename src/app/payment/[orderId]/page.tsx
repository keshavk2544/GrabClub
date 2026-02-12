'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import GrabClubLoading from '@/components/layout/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';

export default function PaymentPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const orderRef = useMemoFirebase(() => (firestore && orderId ? doc(firestore, 'orders', orderId) : null), [firestore, orderId]);
  const { data: order, isLoading: isOrderLoading, error } = useDoc<Order>(orderRef);
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
            handler: async function (paymentResponse: any) {
                if (!orderRef) return;

                // Verify Razorpay signature on server before updating DB
                const verifyRes = await fetch('/api/razorpay/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: paymentResponse.razorpay_order_id,
                        razorpay_payment_id: paymentResponse.razorpay_payment_id,
                        razorpay_signature: paymentResponse.razorpay_signature,
                    }),
                });

                if (!verifyRes.ok) {
                    const errorData = await verifyRes.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Payment verification failed.');
                }
                
                // Update order only after signature is verified
                const updateData: Partial<Order> = { status: 'pending' };
                if (!order.verificationCode) {
                    updateData.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
                }

                await updateDoc(orderRef, updateData);

                toast({ variant: 'success', title: 'Payment Successful!', description: 'Your order is awaiting vendor confirmation.' });
                router.push('/orders');
            },
            prefill: {
                name: user?.displayName || '',
                email: user?.email || '',
                contact: order.customerPhone,
            },
            theme: { color: "#FE9D15" },
            modal: {
                ondismiss: function() {
                    setIsProcessingPayment(false);
                    toast({ variant: 'destructive', title: 'Payment Cancelled', description: 'Your order was not paid.' });
                }
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (paymentResponse: any) {
            toast({ variant: 'destructive', title: 'Payment Failed', description: paymentResponse.error.description || 'Please try again.' });
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
