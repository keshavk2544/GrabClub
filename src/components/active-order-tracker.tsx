'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import type { Order, Vendor } from '@/lib/types';
import Link from 'next/link';
import { Button } from './ui/button';
import { TicketCheck, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { usePathname } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc } from 'firebase/firestore';

export default function ActiveOrderTracker() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const userOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'orders'), where('customerEmail', '==', user.email));
  }, [firestore, user]);
  const { data: userOrders, isLoading: ordersLoading } = useCollection<Order>(userOrdersQuery);

  const vendorsQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'vendors') : null
  , [firestore]);
  const { data: vendors, isLoading: vendorsLoading } = useCollection<Vendor>(vendorsQuery);

  const checkAndRejectOldOrders = useCallback(async () => {
    if (!firestore || !userOrders || userOrders.length === 0) return;

    const now = new Date().getTime();
    const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
    const batch = writeBatch(firestore);
    let ordersModified = false;

    userOrders.forEach(order => {
        const orderTime = (order.orderTime as any).toDate ? (order.orderTime as any).toDate().getTime() : new Date(order.orderTime as any).getTime();
        if (order.status === 'pending' && orderTime < twelveHoursAgo) {
            const orderRef = doc(firestore, 'orders', order.id);
            batch.update(orderRef, { status: 'rejected', rejectionReason: 'vendor_unavailable' });
            ordersModified = true;
        }
    });

    if (ordersModified) {
        await batch.commit();
    }
  }, [firestore, userOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndRejectOldOrders();
    }, 60 * 60 * 1000); // Check every hour
    
    checkAndRejectOldOrders(); // Initial check

    return () => clearInterval(interval);
  }, [checkAndRejectOldOrders]);

  const activeOrders = useMemo(() => 
    userOrders
      ? userOrders
          .filter(order => order.status === 'accepted' || order.status === 'out for delivery')
          .sort((a, b) => (b.orderTime as any).toDate().getTime() - (a.orderTime as any).toDate().getTime())
      : [],
    [userOrders]
  );
  
  const pendingOrders = useMemo(() =>
    userOrders
      ? userOrders
          .filter(order => order.status === 'pending')
          .sort((a, b) => (b.orderTime as any).toDate().getTime() - (a.orderTime as any).toDate().getTime())
      : [],
    [userOrders]
  );

  const hasActiveOrders = activeOrders.length > 0;
  const hasPendingOrders = pendingOrders.length > 0;
  
  const isLoading = ordersLoading || vendorsLoading;

  if (isLoading || pathname === '/' || pathname === '/login' || pathname.startsWith('/admin') || pathname.startsWith('/food-dashboard') || pathname.startsWith('/grocery-dashboard') || pathname.startsWith('/fruits-dashboard') || pathname.startsWith('/vegetable-dashboard') || pathname.startsWith('/bakery-dashboard') || pathname.startsWith('/sweets-dashboard') || pathname.startsWith('/medicine-dashboard') || pathname.startsWith('/cyber-dashboard') || pathname.startsWith('/delivery-dashboard')) {
    return null;
  }

  if (!hasActiveOrders && !hasPendingOrders) {
    return null;
  }

  const getVendor = (vendorId: string) => vendors?.find(v => v.id === vendorId);

  // Render split view if both active and pending orders exist
  if (hasActiveOrders && hasPendingOrders) {
    const firstActive = activeOrders[0];
    const firstPending = pendingOrders[0];
    const activeVendor = getVendor(firstActive.vendorId);
    const pendingVendor = getVendor(firstPending.vendorId);

    return (
        <div className={cn(
            "fixed bottom-16 left-0 z-40 w-full p-2 md:hidden",
            "transition-all duration-500 ease-in-out"
        )}>
            <div className="flex gap-2 max-w-lg mx-auto">
                {/* Pending Order Half */}
                <div className="w-1/2">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl blur opacity-75 animate-pulse-slow"></div>
                        <div className="relative p-3 bg-card/80 backdrop-blur-xl border border-blue-500/30 rounded-xl shadow-2xl h-full">
                            <Link href="/orders" className="flex items-center justify-between gap-2 h-full">
                                <div className="flex items-center gap-2">
                                    <div className="bg-sky-500/20 p-2 rounded-lg">
                                        <Clock className="h-5 w-5 text-sky-400 animate-spin-slow" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground truncate">{pendingVendor?.name || 'Your Order'}</p>
                                        <p className="font-bold text-xs leading-tight text-sky-400">
                                            Pending
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 flex-shrink-0" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Active Order Half */}
                <div className="w-1/2">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-75 animate-pulse-slow"></div>
                        <div className="relative p-3 bg-card/80 backdrop-blur-xl border border-green-500/30 rounded-xl shadow-2xl h-full">
                           <Link href="/orders" className="flex items-center justify-between gap-2 h-full">
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-500/20 p-2 rounded-lg">
                                        <TicketCheck className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground truncate">{activeVendor?.name || 'Your Order'}</p>
                                        <div className="flex items-center gap-2">
                                          <p className="font-bold text-xs leading-tight tracking-widest text-green-400">{firstActive.verificationCode}</p>
                                          <p className="font-bold text-xs text-green-400">Confirmed</p>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 flex-shrink-0" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  } else if (hasActiveOrders) {
    // Render full carousel for active orders only
    return (
        <div className={cn(
            "fixed bottom-16 left-0 z-40 w-full p-2 md:hidden",
            "transition-all duration-500 ease-in-out"
        )}>
            <Carousel className="w-full max-w-lg mx-auto" opts={{ loop: activeOrders.length > 1 }}>
                <CarouselContent>
                    {activeOrders.map((order) => {
                        const vendor = getVendor(order.vendorId);
                        return (
                            <CarouselItem key={order.id}>
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
                                                    {activeOrders.length > 1 && (
                                                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                                        <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-sky-500 text-xs font-bold text-white">
                                                            {activeOrders.length}
                                                        </span>
                                                        </span>
                                                    )}
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
            </Carousel>
        </div>
    );
  } else if (hasPendingOrders) {
    // Render full carousel for pending orders only
     return (
        <div className={cn(
            "fixed bottom-16 left-0 z-40 w-full p-2 md:hidden",
            "transition-all duration-500 ease-in-out"
        )}>
            <Carousel className="w-full max-w-lg mx-auto" opts={{ loop: pendingOrders.length > 1 }}>
                <CarouselContent>
                    {pendingOrders.map((order) => {
                        const vendor = getVendor(order.vendorId);
                        return (
                            <CarouselItem key={order.id}>
                                 <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl blur opacity-75 animate-pulse-slow"></div>
                                    <div className="relative p-3 bg-card/80 backdrop-blur-xl border border-blue-500/30 rounded-xl shadow-2xl">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-sky-500/20 p-2 rounded-lg">
                                                    <Clock className="h-6 w-6 text-sky-400 animate-spin-slow" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground">{vendor?.name || 'Your Order'}</p>
                                                    <p className="font-bold text-sm leading-tight text-sky-400">
                                                        Awaiting Confirmation
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Order yet to be confirmed</p>
                                                </div>
                                            </div>
                                            <Link href="/orders" passHref>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                                                    {pendingOrders.length > 1 && (
                                                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                                        <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-sky-500 text-xs font-bold text-white">
                                                            {pendingOrders.length}
                                                        </span>
                                                        </span>
                                                    )}
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
            </Carousel>
        </div>
      );
  }

  return null;
}
