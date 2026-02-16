'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Order, Vendor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bike } from 'lucide-react';
import { categories } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, updateDoc } from 'firebase/firestore';

export default function AvailableOrdersTab() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [deliveryPersonId, setDeliveryPersonId] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem('deliveryPersonId');
    setDeliveryPersonId(id);
  }, []);

  const ordersQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'orders'), where('status', '==', 'accepted')) : null
  , [firestore]);
  const { data: acceptedOrders } = useCollection<Order>(ordersQuery);

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<Vendor>(vendorsQuery);

  const ordersByService = useMemo(() => {
    if (!acceptedOrders || !vendors) return [];

    const availableOrders = acceptedOrders.filter(order => {
      const vendor = vendors.find(v => v.id === order.vendorId);
      return vendor?.deliveryType === 'grabclub' && !order.deliveryPersonId;
    });

    return categories.map(category => ({
        ...category,
        orders: availableOrders.filter(order => {
            const vendor = vendors.find(v => v.id === order.vendorId);
            return vendor?.category === category.id;
        }),
    })).filter(service => service.orders.length > 0);
  }, [acceptedOrders, vendors]);
  
  const handlePickUpOrder = async (orderId: string) => {
    if (!deliveryPersonId || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify delivery person." });
        return;
    }

    const orderRef = doc(firestore, 'orders', orderId);
    await updateDoc(orderRef, {
        status: 'out for delivery',
        deliveryPersonId: deliveryPersonId,
    });

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
                                                <p className="text-sm text-muted-foreground">From: {vendors?.find(v => v.id === order.vendorId)?.name}</p>
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
