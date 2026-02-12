'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import type { Order, Vendor } from '@/lib/types';
import Link from 'next/link';
import { Button } from './ui/button';
import { TicketCheck, ChevronRight, Clock, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { usePathname } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ActiveOrderTracker() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const prevOrdersRef = useRef<Order[]>();
  const [notification, setNotification] = useState<{ title: string; description: string; status: Order['status'] } | null>(null);

  const allUserOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'orders'), where('customerEmail', '==', user.email));
  }, [firestore, user]);
  const { data: allUserOrders, isLoading: ordersLoading } = useCollection<Order>(allUserOrdersQuery);

  useEffect(() => {
    if (ordersLoading || !allUserOrders) {
      return;
    }

    if (prevOrdersRef.current) {
        const prevOrdersMap = new Map(prevOrdersRef.current.map(o => [o.id, o]));

        for (const newOrder of allUserOrders) {
            const oldOrder = prevOrdersMap.get(newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
                let notifData: { title: string; description: string; status: Order['status'] } | null = null;
                switch (newOrder.status) {
                    case 'accepted':
                        notifData = {
                            title: 'Order Confirmed!',
                            description: `The vendor has confirmed your order #${newOrder.id.split('-').pop()}. It's being prepared.`,
                            status: 'accepted'
                        };
                        break;
                    case 'out for delivery':
                         notifData = {
                            title: 'Out for Delivery!',
                            description: `Your order #${newOrder.id.split('-').pop()} is on its way.`,
                            status: 'out for delivery'
                        };
                        break;
                    case 'delivered':
                        notifData = {
                            title: 'Order Delivered!',
                            description: `Your order #${newOrder.id.split('-').pop()} has been delivered. Enjoy!`,
                            status: 'delivered'
                        };
                        break;
                    case 'rejected':
                        notifData = {
                            title: 'Order Rejected',
                            description: `Unfortunately, your order #${newOrder.id.split('-').pop()} was rejected by the vendor.`,
                            status: 'rejected'
                        };
                        break;
                }
                if (notifData) {
                    setNotification(notifData);
                }
            }
        }
    }
    
    prevOrdersRef.current = allUserOrders;

  }, [allUserOrders, ordersLoading]);

  const vendorsQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'vendors') : null
  , [firestore]);
  const { data: vendors, isLoading: vendorsLoading } = useCollection<Vendor>(vendorsQuery);

  const checkAndRejectOldOrders = useCallback(async () => {
    const userOrders = allUserOrders?.filter(o => o.status === 'pending');
    if (!firestore || !userOrders || userOrders.length === 0) return;

    const now = new Date().getTime();
    const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
    const batch = writeBatch(firestore);
    let ordersModified = false;

    userOrders.forEach(order => {
        if (order.status === 'pending') {
            const orderTime = (order.orderTime as any).toDate ? (order.orderTime as any).toDate().getTime() : new Date(order.orderTime as any).getTime();
            if (orderTime < twelveHoursAgo) {
                const orderRef = doc(firestore, 'orders', order.id);
                batch.update(orderRef, { status: 'rejected', rejectionReason: 'vendor_unavailable' });
                ordersModified = true;
            }
        }
    });

    if (ordersModified) {
        await batch.commit();
    }
  }, [firestore, allUserOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndRejectOldOrders();
    }, 60 * 60 * 1000); // Check every hour
    
    checkAndRejectOldOrders(); // Initial check

    return () => clearInterval(interval);
  }, [checkAndRejectOldOrders]);

  const allTrackedOrders = useMemo(() => {
    const userOrders = allUserOrders?.filter(o => ['pending', 'pending payment', 'accepted', 'out for delivery'].includes(o.status));
    
    if (!userOrders) return [];
    
    const ordersWithType = userOrders.map(order => {
        let type: 'paymentPending' | 'active' | 'awaitingConfirmation' | null = null;
        if (order.status === 'pending') type = 'awaitingConfirmation';
        else if (order.status === 'pending payment') type = 'paymentPending';
        else if (order.status === 'accepted' || order.status === 'out for delivery') type = 'active';
        return { ...order, type };
    }).filter(o => o.type !== null);

    // Sort by type priority then time
    const typePriority: Record<string, number> = { 'paymentPending': 1, 'awaitingConfirmation': 2, 'active': 3 };
    
    return ordersWithType.sort((a, b) => {
        const priorityA = typePriority[a.type!];
        const priorityB = typePriority[b.type!];
        if (priorityA !== priorityB) return priorityA - priorityB;
        
        const timeA = (a.orderTime as any).toDate ? (a.orderTime as any).toDate().getTime() : new Date(a.orderTime as any).getTime();
        const timeB = (b.orderTime as any).toDate ? (b.orderTime as any).toDate().getTime() : new Date(b.orderTime as any).getTime();
        return timeB - timeA;
    });

  }, [allUserOrders]);
  
  const isLoading = ordersLoading || vendorsLoading;

  if (isLoading || pathname === '/login' || pathname.startsWith('/admin') || pathname.startsWith('/food-dashboard') || pathname.startsWith('/grocery-dashboard') || pathname.startsWith('/fruits-dashboard') || pathname.startsWith('/vegetable-dashboard') || pathname.startsWith('/bakery-dashboard') || pathname.startsWith('/sweets-dashboard') || pathname.startsWith('/medicine-dashboard') || pathname.startsWith('/cyber-dashboard') || pathname.startsWith('/delivery-dashboard')) {
    return null;
  }

  const getVendor = (vendorId: string) => vendors?.find(v => v.id === vendorId);

  return (
    <>
      {allTrackedOrders && allTrackedOrders.length > 0 && (
        <div className={cn(
            "fixed bottom-16 left-0 z-40 w-full p-2 md:hidden",
            "transition-all duration-500 ease-in-out"
        )}>
            <Carousel className="w-full max-w-lg mx-auto" opts={{ loop: allTrackedOrders.length > 1 }}>
                <CarouselContent>
                    {allTrackedOrders.map((order) => {
                        const vendor = getVendor(order.vendorId);
                        return (
                            <CarouselItem key={order.id}>
                                {order.type === 'paymentPending' && (
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-75 animate-pulse-slow"></div>
                                        <div className="relative p-3 bg-card/80 backdrop-blur-xl border border-amber-500/30 rounded-xl shadow-2xl">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-amber-500/20 p-2 rounded-lg">
                                                        <CreditCard className="h-6 w-6 text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground">{vendor?.name || 'Your Order'}</p>
                                                        <p className="font-bold text-sm leading-tight text-amber-400">
                                                            Payment Required
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Total: ₹{order.total.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <Link href={`/payment/${order.id}`} passHref>
                                                    <Button variant="ghost" size="sm" className="h-auto px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                                                        Pay Now <ChevronRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {order.type === 'awaitingConfirmation' && (
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-75 animate-pulse-slow"></div>
                                        <div className="relative p-3 bg-card/80 backdrop-blur-xl border border-blue-500/30 rounded-xl shadow-2xl">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-500/20 p-2 rounded-lg">
                                                        <Clock className="h-6 w-6 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground">{vendor?.name || 'Your Order'}</p>
                                                        <p className="font-bold text-sm leading-tight text-blue-400">
                                                            Awaiting Confirmation
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Total: ₹{order.total.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <Link href="/orders" passHref>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                                                        {allTrackedOrders.length > 1 && (
                                                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                                            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-sky-500 text-xs font-bold text-white">
                                                                {allTrackedOrders.length}
                                                            </span>
                                                            </span>
                                                        )}
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {order.type === 'active' && (
                                     <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-75 animate-pulse-slow"></div>
                                        <div className="relative p-3 bg-card/80 backdrop-blur-xl border border-green-500/30 rounded-xl shadow-2xl">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-green-500/20 p-2 rounded-lg">
                                                        <TicketCheck className="h-6 w-6 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground">{vendor?.name || 'Your Order'}</p>
                                                        <div className="flex items-baseline gap-2">
                                                          <p className="font-bold text-lg leading-tight tracking-widest text-green-400">{order.verificationCode}</p>
                                                          <p className="font-bold text-xs text-green-400">Confirmed</p>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{order.deliveryTimeSlot || (order.status === 'accepted' ? 'Preparing...' : 'On its way!')}</p>
                                                    </div>
                                                </div>
                                                 <Link href="/orders" passHref>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                                                        {allTrackedOrders.length > 1 && (
                                                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                                            <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-sky-500 text-xs font-bold text-white">
                                                                {allTrackedOrders.length}
                                                            </span>
                                                            </span>
                                                        )}
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
            </Carousel>
        </div>
      )}
      <AlertDialog open={!!notification} onOpenChange={() => setNotification(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-3">
                    {notification?.status === 'rejected' 
                        ? <XCircle className="h-8 w-8 text-destructive" /> 
                        : <CheckCircle className="h-8 w-8 text-green-500" />}
                    {notification?.title}
                </AlertDialogTitle>
                <AlertDialogDescription>
                    {notification?.description}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setNotification(null)}>OK</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
