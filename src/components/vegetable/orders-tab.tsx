'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Order, Vendor } from '@/lib/types';
import { Check, X, Loader2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, updateDoc } from 'firebase/firestore';

export default function VegetableOrdersTab() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem('vendorId');
    setVendorId(id);
  }, []);

  const vendorRef = useMemoFirebase(() => 
    firestore && vendorId ? doc(firestore, 'vendors', vendorId) : null
  , [firestore, vendorId]);
  const { data: vendor, isLoading: vendorIsLoading } = useDoc<Vendor>(vendorRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !vendorId) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', vendorId));
  }, [firestore, vendorId]);
  const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  const isLoading = vendorIsLoading || ordersLoading;

  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    if (!firestore) return;
    
    const orderRef = doc(firestore, 'orders', orderId);
    
    const updateData: Partial<Order> = { status };
    if (status === 'accepted') {
      updateData.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    } else if (status === 'rejected') {
      updateData.rejectionReason = 'vendor_rejected';
    }
    
    await updateDoc(orderRef, updateData);

    toast({
        title: `Order ${status}`,
        description: `Order has been marked as ${status}.`,
    });
  };

  const sortedOrders = useMemo(() => orders ? [...orders].sort((a, b) => new Date(b.orderTime as any).getTime() - new Date(a.orderTime as any).getTime()) : [], [orders]);

  const pendingOrders = useMemo(() => sortedOrders.filter(o => o.status === 'pending'), [sortedOrders]);
  const activeOrders = useMemo(() => sortedOrders.filter(o => o.status === 'accepted'), [sortedOrders]);
  const pastOrders = useMemo(() => sortedOrders.filter(o => o.status === 'delivered' || o.status === 'rejected'), [sortedOrders]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-2 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Orders</CardTitle>
            <CardDescription>Review and accept incoming orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingOrders.length > 0 ? (
              pendingOrders.map(order => (
                <div key={order.id} className="p-4 border rounded-lg bg-card shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold">{order.receiverName || order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.deliveryLocation}</p>
                        {order.deliveryTimeSlot && <p className="text-sm font-medium text-primary">{order.deliveryTimeSlot}</p>}
                    </div>
                    <Badge variant="default" className="bg-blue-600 text-white border-transparent hover:bg-blue-700 capitalize">{order.status}</Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2 text-sm">
                    {order.items.map(item => (
                        <div key={item.productId} className="flex justify-between">
                            <span>{item.name} x {item.quantity}</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-lg">Total: ₹{order.total.toFixed(2)}</p>
                    <div className="flex gap-2">
                       <Button asChild size="sm" variant="outline" disabled={!order.customerPhone}>
                            <a href={order.customerPhone ? `tel:${order.customerPhone}` : undefined}>
                                <Phone className="mr-1 h-4 w-4"/> Call
                            </a>
                        </Button>
                      <Button size="sm" variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20" onClick={() => handleUpdateStatus(order.id, 'rejected')}><X className="mr-1 h-4 w-4"/> Reject</Button>
                      <Button size="sm" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" onClick={() => handleUpdateStatus(order.id, 'accepted')}><Check className="mr-1 h-4 w-4"/> Accept</Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No new orders.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Active Orders</CardTitle>
                <CardDescription>Orders being prepared for delivery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {activeOrders.length > 0 ? (
                    activeOrders.map(order => (
                        <div key={order.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold">{order.receiverName || order.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{order.id}</p>
                                </div>
                                <Badge className="capitalize bg-green-600 text-white border-transparent hover:bg-green-700">
                                    {order.status}
                                </Badge>
                            </div>
                            {order.verificationCode && (
                                <div className="my-2 p-2 rounded-md bg-muted text-center">
                                    <p className="text-xs text-muted-foreground">Verification Code</p>
                                    <p className="text-2xl font-bold tracking-widest">{order.verificationCode}</p>
                                </div>
                            )}
                            <Separator className="my-2" />
                            <div className="space-y-1 text-sm my-2">
                                {order.items.map(item => (
                                    <div key={item.productId} className="flex justify-between text-muted-foreground">
                                        <span>{item.name}</span>
                                        <span>x {item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            {vendor?.deliveryType === 'self' && (
                                <>
                                    <Separator className="my-2" />
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Mark as Delivered
                                    </Button>
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No active orders.</p>
                )}
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Past Orders</CardTitle>
            <CardDescription>Completed or rejected orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             {pastOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No past orders.</p>}
            {pastOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                       <p className="font-semibold">{order.receiverName || order.customerName}</p>
                       <p className="text-xs text-muted-foreground">{order.id}</p>
                  </div>
                  <Badge variant={order.status === 'rejected' ? 'destructive' : 'default'} className={cn("capitalize", {'bg-green-600 text-white border-transparent hover:bg-green-700': order.status === 'delivered'})}>
                    {order.status}
                  </Badge>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
