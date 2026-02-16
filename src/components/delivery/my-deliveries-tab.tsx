'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Order, Vendor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Phone, CheckCircle } from 'lucide-react';
import { categories } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, updateDoc } from 'firebase/firestore';


// Helper to parse time slots like "9:00 AM – 10:00 AM" for sorting
const parseTimeSlot = (timeSlot: string): number => {
    const timePart = timeSlot.split('–')[0].trim(); // "9:00 AM"
    const [time, modifier] = timePart.split(' '); // ["9:00", "AM"]
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) {
        hours += 12;
    }
    if (modifier === 'AM' && hours === 12) { // Handle 12 AM (midnight)
        hours = 0;
    }
    return hours * 60 + (isNaN(minutes) ? 0 : minutes);
};

export default function MyDeliveriesTab() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [deliveryPersonId, setDeliveryPersonId] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem('deliveryPersonId');
    setDeliveryPersonId(id);
  }, []);

  const myOrdersQuery = useMemoFirebase(() => 
    firestore && deliveryPersonId 
      ? query(
          collection(firestore, 'orders'), 
          where('deliveryPersonId', '==', deliveryPersonId)
        ) 
      : null
  , [firestore, deliveryPersonId]);
  const { data: myOrders } = useCollection<Order>(myOrdersQuery);

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<Vendor>(vendorsQuery);

  const ordersByService = useMemo(() => {
    if (!myOrders || !vendors) return [];
    
    const myActiveDeliveries = myOrders.filter(order => order.status === 'out for delivery');
    
    return categories.map(category => {
        const serviceOrders = myActiveDeliveries
            .filter(order => {
                const vendor = vendors.find(v => v.id === order.vendorId);
                return vendor?.category === category.id;
            })
            .sort((a, b) => {
                if (!a.deliveryTimeSlot) return 1;
                if (!b.deliveryTimeSlot) return -1;
                return parseTimeSlot(a.deliveryTimeSlot) - parseTimeSlot(b.deliveryTimeSlot);
            });

        return {
            ...category,
            orders: serviceOrders,
        };
    }).filter(service => service.orders.length > 0);
  }, [myOrders, vendors]);
  
  const handleMarkAsDelivered = async (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    await updateDoc(orderRef, { status: 'delivered' });
    toast({ title: 'Order Delivered!', description: 'Great job!' });
  };

  return (
    <div className="space-y-6">
        <Accordion type="multiple" className="w-full space-y-2">
            {ordersByService.length > 0 ? (
                ordersByService.map(service => (
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
                                    <div className="p-2 text-center bg-muted rounded-md mb-3">
                                        <p className="text-sm text-muted-foreground">Verification Code</p>
                                        <p className="text-2xl font-bold tracking-widest font-headline text-primary">{order.verificationCode}</p>
                                    </div>
                                    <div className="space-y-2 text-sm mb-3">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">To:</span>
                                            <span className="font-semibold">{order.receiverName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Location:</span>
                                            <span className="font-semibold">{order.deliveryLocation}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Time:</span>
                                            <span className="font-semibold">{order.deliveryTimeSlot}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild variant="outline" className="flex-1">
                                            <a href={`tel:${order.customerPhone}`}>
                                                <Phone className="mr-2 h-4 w-4" />
                                                Call
                                            </a>
                                        </Button>
                                        <Button className="flex-1" onClick={() => handleMarkAsDelivered(order.id)}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Mark as Delivered
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                ))
            ) : (
                <div className="text-center py-16 text-muted-foreground">You have no active deliveries. Pick up an order from the "Available" tab.</div>
            )}
        </Accordion>
    </div>
  );
}
