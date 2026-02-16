'use client';

import type { Category } from '@/lib/data';
import { categories } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import type { Vendor } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';


const categoryColors = {
  food: 'from-amber-500 to-orange-600',
  grocery: 'from-green-500 to-emerald-600',
  fruits: 'from-red-500 to-pink-600',
  vegetables: 'from-lime-500 to-green-600',
  bakery: 'from-yellow-400 to-amber-500',
  sweets: 'from-fuchsia-500 to-purple-600',
  medicine: 'from-sky-500 to-blue-600',
  'cyber-cafe': 'from-indigo-500 to-violet-600',
};

const CategoryCard = ({ category, index, isClosed }: { category: Category; index: number; isClosed: boolean }) => {
  const colorClass = categoryColors[category.id as keyof typeof categoryColors] || 'from-gray-400 to-gray-500';
  const isDisabled = isClosed;

  return (
    <Link href={isDisabled ? '#' : `/category/${category.id}`} className={cn("block group", isDisabled && "pointer-events-none")}>
      <div className={cn(
        "relative p-6 overflow-hidden rounded-3xl bg-card/40 backdrop-blur-lg border border-white/10 shadow-lg transition-all duration-300 ease-in-out h-full",
        !isDisabled && "hover:shadow-2xl hover:border-white/20 hover:-translate-y-2",
        isDisabled && "grayscale"
      )}>
        <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
          <div className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl ${colorClass} opacity-50`}></div>
          <div className={`absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full blur-3xl ${colorClass} opacity-50`}></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className={`mb-4 p-4 rounded-full bg-gradient-to-br ${colorClass} shadow-lg text-white group-hover:scale-110 transition-transform duration-300`}>
            <category.icon className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-headline font-bold text-foreground">{category.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Service #{String(index + 1).padStart(2, '0')}</p>
        </div>
         {isDisabled && (
          <>
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-2xl z-10 transition-all" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-20">
                  <div className="bg-card/80 border border-destructive/30 rounded-full px-5 py-2.5 shadow-lg backdrop-blur-sm">
                      <p className="font-headline font-bold text-destructive text-center text-sm">Currently Closed</p>
                  </div>
              </div>
          </>
        )}
      </div>
    </Link>
  );
};


export default function CategoryBrowser() {
  const firestore = useFirestore();
  const vendorsQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'vendors') : null
  , [firestore]);
  const { data: vendors } = useCollection<Vendor>(vendorsQuery);
  
  const [vendorStatus, setVendorStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!vendors) return;
    
    const checkAllVendorStatuses = () => {
        const statuses: Record<string, boolean> = {};
        const timeZone = 'Asia/Kolkata';
        const now = new Date();

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        });

        const parts = formatter.formatToParts(now);
        const partsMap = parts.reduce((acc, part) => {
            acc[part.type] = part.value;
            return acc;
        }, {} as Record<string, string>);

        const dayOfWeek = partsMap.weekday;
        const currentHour = parseInt(partsMap.hour, 10);
        const currentMinute = parseInt(partsMap.minute, 10);
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        vendors.forEach(vendor => {
            if (vendor.status === 'inactive') {
                statuses[vendor.id] = false;
                return;
            }
            
            if (!vendor.openingTime || !vendor.closingTime || !vendor.workingDays || vendor.workingDays.length === 0) {
                statuses[vendor.id] = true;
                return;
            }
            
            if (!vendor.workingDays!.includes(dayOfWeek)) {
                statuses[vendor.id] = false;
                return;
            }

            const [openHour, openMinute] = vendor.openingTime!.split(':').map(Number);
            const [closeHour, closeMinute] = vendor.closingTime!.split(':').map(Number);

            const openTimeInMinutes = openHour * 60 + openMinute;
            const closeTimeInMinutes = closeHour * 60 + closeMinute;
            
            if (closeTimeInMinutes <= openTimeInMinutes) {
                statuses[vendor.id] = currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes;
            } else {
                statuses[vendor.id] = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes;
            }
        });
        setVendorStatus(statuses);
    };

    checkAllVendorStatuses();
    const intervalId = setInterval(checkAllVendorStatuses, 60000);
    return () => clearInterval(intervalId);
  }, [vendors]);

  const isCategoryClosed = (categoryId: string) => {
    if (!vendors) return true; // Assume closed if vendors haven't loaded
    const categoryVendors = vendors.filter(v => v.category === categoryId);
    
    if (categoryVendors.length === 0) {
      return true;
    }
    
    const isAnyVendorOpen = categoryVendors.some(v => vendorStatus[v.id]);
    
    return !isAnyVendorOpen;
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="container">
        <h2 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl mb-8 text-center">
          WELCOME TO Grab<span className="text-primary">Club</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              index={index} 
              isClosed={isCategoryClosed(category.id)} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
