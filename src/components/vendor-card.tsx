'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Vendor } from '@/lib/types';
import { ChevronRight, Clock, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!vendor || typeof window === 'undefined' || !(vendor.openingTime || vendor.workingDays)) {
        setIsOpen(true);
        return;
    }
    
    const checkOpenStatus = () => {
        const now = new Date();
        const timeZone = 'Asia/Kolkata';

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
        
        if (!vendor.workingDays || !vendor.workingDays.includes(dayOfWeek)) {
            setIsOpen(false);
            return;
        }

        const [openHour, openMinute] = vendor.openingTime!.split(':').map(Number);
        const [closeHour, closeMinute] = vendor.closingTime!.split(':').map(Number);

        const openTimeInMinutes = openHour * 60 + openMinute;
        const closeTimeInMinutes = closeHour * 60 + closeMinute;
        
        if (closeTimeInMinutes <= openTimeInMinutes) { // Overnight case
            setIsOpen(currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes);
        } else { // Same day case
            setIsOpen(currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes);
        }
    };

    checkOpenStatus();
    const intervalId = setInterval(checkOpenStatus, 60000);

    return () => clearInterval(intervalId);

  }, [vendor]);

  const isInactive = vendor.status === 'inactive';
  const isStoreAndClosed = !isOpen && !isInactive;
  const isDisabled = isInactive || isStoreAndClosed;

  return (
    <Link href={isDisabled ? '#' : `/vendor/${vendor.id}`} className={cn("block group", isDisabled && "pointer-events-none")}>
      <div className={cn(
        "relative h-full flex flex-col overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-white/10 transition-all duration-300",
        !isDisabled && "hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/20",
        isDisabled && "grayscale"
      )}>
        {!isDisabled && (
          <div className="absolute top-2 left-2 z-10">
            {vendor.deliveryType === 'grabclub' && (
              <div className="inline-flex items-center rounded-full border-transparent bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                <Clock className="mr-1.5 h-3 w-3" />
                Scheduled Delivery
              </div>
            )}
            {vendor.deliveryType === 'self' && (
              <div className="inline-flex items-center rounded-full border-transparent bg-green-500 px-2.5 py-1 text-xs font-semibold text-white">
                <Truck className="mr-1.5 h-3 w-3" />
                Instant Delivery
              </div>
            )}
          </div>
        )}
        <div className="aspect-[16/9] overflow-hidden">
          <Image
            src={vendor.image.src}
            width={vendor.image.width}
            height={vendor.image.height}
            alt={vendor.image.alt}
            data-ai-hint={vendor.image.hint}
            className={cn("object-cover w-full h-full transition-transform duration-500", !isDisabled && "group-hover:scale-110")}
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-headline text-lg font-bold text-foreground">{vendor.name}</h3>
          <p className="text-sm text-muted-foreground flex-grow">{vendor.description}</p>
          <div className="flex items-center justify-end mt-2 text-sm font-semibold text-primary">
            View Menu
            <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
        {isDisabled && (
            <>
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-2xl z-10 transition-all" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-20">
                    <div className="bg-card/80 border border-primary/30 rounded-full px-5 py-2.5 shadow-lg backdrop-blur-sm">
                        <p className="font-headline font-bold text-primary text-center text-sm">{isInactive ? 'Not Operating' : 'Currently Closed'}</p>
                    </div>
                </div>
            </>
        )}
      </div>
    </Link>
  );
}
