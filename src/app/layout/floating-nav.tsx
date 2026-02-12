'use client';

import Link from 'next/link';
import { Home, ShoppingCart, History, User, Package } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCartAnimation } from '@/context/cart-animation-context';
import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import type { Order, MedicineRequest } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/cart', label: 'Cart', icon: ShoppingCart },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/history', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function FloatingNav() {
  const pathname = usePathname();
  const { cartCount } = useCartAnimation();
  const { user } = useUser();
  const firestore = useFirestore();

  const userOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    const activeStatuses: Order['status'][] = ['pending', 'pending payment', 'accepted', 'out for delivery'];
    return query(collection(firestore, 'orders'), where('customerEmail', '==', user.email), where('status', 'in', activeStatuses));
  }, [firestore, user]);
  const { data: userOrders } = useCollection<Order>(userOrdersQuery);

  const userRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'medicineRequests'), where('userEmail', '==', user.email), where('status', '==', 'pending-review'));
  }, [firestore, user]);
  const { data: userRequests } = useCollection<MedicineRequest>(userRequestsQuery);
  
  const hasActiveItems = (userOrders && userOrders.length > 0) || (userRequests && userRequests.length > 0);

  if (pathname === '/login' || pathname.startsWith('/admin') || pathname.startsWith('/food-dashboard') || pathname.startsWith('/grocery-dashboard') || pathname.startsWith('/fruits-dashboard') || pathname.startsWith('/vegetable-dashboard') || pathname.startsWith('/bakery-dashboard') || pathname.startsWith('/sweets-dashboard') || pathname.startsWith('/medicine-dashboard') || pathname.startsWith('/cyber-dashboard') || pathname.startsWith('/delivery-dashboard')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-lg border-t border-border/40 md:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isCart = item.label === 'Cart';
          const isOrders = item.label === 'Orders';

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-accent/50 group relative',
                isCart && 'cart-icon'
              )}
            >
              <item.icon
                className={cn(
                  'w-6 h-6 mb-1 text-muted-foreground group-hover:text-foreground',
                  isActive && 'text-primary'
                )}
              />
              <span
                className={cn(
                  'text-xs text-muted-foreground group-hover:text-foreground',
                  isActive && 'text-primary'
                )}
              >
                {item.label}
              </span>
              {isCart && cartCount > 0 && (
                <div className="absolute top-1 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground animate-[bounce_0.5s_ease-out]">
                  {cartCount}
                </div>
              )}
              {isOrders && hasActiveItems && (
                <span className="absolute top-1.5 right-3.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
