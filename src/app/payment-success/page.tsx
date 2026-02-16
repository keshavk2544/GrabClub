'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import GrabClubLoading from '@/components/layout/loading';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProducts } from '@/hooks/use-products';
import { CheckCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { decrementInventory } = useProducts();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  const orderRef = useMemoFirebase(() => (firestore && orderId ? doc(firestore, 'orders', orderId) : null), [firestore, orderId]);
  const { data: order } = useDoc<Order>(orderRef);

  useEffect(() => {
    if (!orderId) {
        setErrorMessage('No order ID found in URL.');
        setStatus('error');
        return;
    }

    if (!order || status !== 'verifying') return;

    if (order.status === 'pending payment') {
      const finalizeOrder = async () => {
        try {
          const updateData: Partial<Order> = { status: 'accepted' };
          if (!order.verificationCode) {
            updateData.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
          }

          await updateDoc(orderRef!, updateData);
          
          const itemsToDecrement = order.items.map(item => ({ productId: item.productId, quantity: item.quantity }));
          await decrementInventory(itemsToDecrement);
          
          toast({ variant: 'success', title: 'Payment Successful!', description: "Your order has been confirmed and is being prepared." });
          setStatus('success');
        } catch (e) {
          console.error("Failed to finalize order:", e);
          setErrorMessage('Failed to update your order status. Please contact support.');
          setStatus('error');
        }
      };

      finalizeOrder();
    } else if (order.status === 'accepted' || order.status === 'delivered') {
      // Order already processed, maybe by a webhook or previous visit.
      setStatus('success');
    } else {
      setErrorMessage(`Your order status is "${order.status}". Payment might not have been completed.`);
      setStatus('error');
    }

  }, [order, status, orderId, orderRef, firestore, decrementInventory, toast]);

  if (status === 'verifying') {
    return <GrabClubLoading />;
  }

  if (status === 'error') {
    return (
      <div className="container py-8">
          <Alert variant="destructive">
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{errorMessage || 'An unknown error occurred.'}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/orders')} className="mt-4">Go to My Orders</Button>
      </div>
    );
  }

  return (
    <div className="container py-12 sm:py-16 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
            Payment Successful!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
            Your order has been confirmed. You can view its status in your active orders.
        </p>
        <Button onClick={() => router.push('/orders')} className="mt-8">
            View My Orders
        </Button>
    </div>
  );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<GrabClubLoading />}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
