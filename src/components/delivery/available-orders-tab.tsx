'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Order, Vendor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bike } from 'lucide-react';
import { vendors as initialVendors, categories } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '@/components/ui/badge';

const ORDERS_STORAGE_KEY = 'grabclub-orders';
const VENDORS_STORAGE_KEY = 'grabclub-vendors';

export default function AvailableOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deliveryPersonId, setDeliveryPersonId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const id = sessionStorage.getItem('deliveryPersonId');
    setDeliveryPersonId(id);

    const loadData = () => {
        try {
            const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
            const storedVendors = window.localStorage.getItem(VENDORS_STORAGE_KEY);
            setOrders(storedOrders ? JSON.parse(storedOrders).map((o: Order) => ({...o, orderTime: new Date(o.orderTime)})) : []);
            setVendors(storedVendors ? JSON.parse(storedVendors) : initialVendors);
        } catch (error) {
            console.error('Failed to load data for delivery dashboard', error);
        }
    };
    
    loadData();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === ORDERS_STORAGE_KEY || event.key === VENDORS_STORAGE_KEY) {
            loadData();
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const ordersByService = useMemo(() => {
    const availableOrders = orders.filter(order => {
      const vendor = vendors.find(v => v.id === order.vendorId);
      return order.status === 'accepted' && vendor?.deliveryType === 'grabclub' && !order.deliveryPersonId;
    });

    return categories.map(category => ({
        ...category,
        orders: availableOrders.filter(order => {
            const vendor = vendors.find(v => v.id === order.vendorId);
            return vendor?.category === category.id;
        }),
    })).filter(service => service.orders.length > 0);
  }, [orders, vendors]);
  
  const handlePickUpOrder = (orderId: string) => {
    if (!deliveryPersonId) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify delivery person." });
        return;
    }

    const updatedOrders = orders.map(o => {
        if(o.id === orderId) {
            return { ...o, status: 'out for delivery' as const, deliveryPersonId: deliveryPersonId };
        }
        return o;
    });
    setOrders(updatedOrders);
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));

    toast({ title: 'Order Picked Up', description: 'You can now see this order in your deliveries.' });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Available for Pickup</CardTitle>
          <CardDescription>These orders are ready to be picked up and delivered.</CardDescription>
        </CardHeader>
        <CardContent>
            {ordersByService.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                    {ordersByService.map(service => (
                        <AccordionItem value={service.id} key={service.id} className="bg-card/50 rounded-lg border">
                             <AccordionTrigger className="text-lg font-bold hover:no-underline px-4">
                                <div className="flex items-center gap-3">
                                    <service.icon className="w-5 h-5" />
                                    {service.name}
                                    <Badge variant="outline">{service.orders.length}</Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="border-t pt-4 px-4 space-y-3">
                                {service.orders.map(order => (
                                    <div key={order.id} className="p-3 border rounded-lg bg-background/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{order.receiverName}</p>
                                                <p className="text-sm text-muted-foreground">From: {vendors.find(v => v.id === order.vendorId)?.name}</p>
                                                <p className="text-sm text-muted-foreground">{order.deliveryLocation} • {order.deliveryTimeSlot}</p>
                                                {order.verificationCode && (
                                                    <div className="mt-2 p-2 rounded-md bg-muted text-center">
                                                        <p className="text-xs text-muted-foreground">Verification Code</p>
                                                        <p className="text-xl font-bold tracking-widest text-primary">{order.verificationCode}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Button size="sm" onClick={() => handlePickUpOrder(order.id)}>
                                                <Bike className="mr-2 h-4 w-4"/>
                                                Pick Up
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-muted-foreground text-center py-8">No available orders right now. Check back soon!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
