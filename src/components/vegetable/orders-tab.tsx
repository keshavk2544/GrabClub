'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { initialVegetableOrders, vendors as initialVendors } from '@/lib/data';
import type { Order, Vendor } from '@/lib/types';
import { Check, X, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const ORDERS_STORAGE_KEY = 'grabclub-orders';
const VENDORS_STORAGE_KEY = 'grabclub-vendors';
const VENDOR_ID = 'fresh-vegetables';

export default function VegetableOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
        const storedVendors = window.localStorage.getItem(VENDORS_STORAGE_KEY);
        const allVendors = storedVendors ? JSON.parse(storedVendors) : initialVendors;
        const currentVendor = allVendors.find((v: Vendor) => v.id === VENDOR_ID);
        setVendor(currentVendor || null);
    } catch (error) {
        console.error('Failed to load vendors, using initial data.', error);
        const currentVendor = initialVendors.find((v: Vendor) => v.id === VENDOR_ID);
        setVendor(currentVendor || null);
    }

    // Load initial data from localStorage or use initial mock data
    try {
        const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
        if (storedOrders) {
            // Dates are stored as strings in JSON, so we need to parse them back to Date objects
            const allOrders = JSON.parse(storedOrders).map((o: Order) => ({...o, orderTime: new Date(o.orderTime)}));
            const vendorOrders = allOrders.filter((o: Order) => o.vendorId === VENDOR_ID);
            
            // If this vendor has no orders yet, populate with initial data
            if (vendorOrders.length === 0) {
                setOrders(initialVegetableOrders);
                const updatedAllOrders = [...allOrders, ...initialVegetableOrders];
                window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedAllOrders));
            } else {
                setOrders(vendorOrders);
            }
        } else {
            // This case should ideally not happen if grocery vendor has placed orders, but as a fallback
            setOrders(initialVegetableOrders);
            window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initialVegetableOrders));
        }
    } catch (error) {
        console.error('Failed to load orders, using initial data.', error);
        setOrders(initialVegetableOrders);
    }
    
    // Listen for storage changes to sync across tabs
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === ORDERS_STORAGE_KEY && event.newValue) {
             try {
                const allOrders = JSON.parse(event.newValue).map((o: Order) => ({...o, orderTime: new Date(o.orderTime)}));
                const vendorOrders = allOrders.filter((o: Order) => o.vendorId === VENDOR_ID);
                setOrders(vendorOrders);
             } catch (error) {
                console.error('Failed to parse orders from storage event.', error);
             }
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    try {
        // When updating, we need to get all orders, modify ours, then save all back.
        const allStoredOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
        const allOrders = allStoredOrders ? JSON.parse(allStoredOrders).map((o: any) => ({...o, orderTime: new Date(o.orderTime)})) : [];
        const otherVendorOrders = allOrders.filter((o: Order) => o.vendorId !== VENDOR_ID);
        const updatedAllOrders = [...otherVendorOrders, ...newOrders];
        window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedAllOrders));
    } catch (error) {
        console.error('Failed to save orders to localStorage', error);
    }
  }


  const handleUpdateStatus = (orderId: string, status: Order['status']) => {
    const newOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder: Order = { ...order, status };
        if (status === 'accepted') {
          updatedOrder.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        }
        return updatedOrder;
      }
      return order;
    });
    updateOrders(newOrders);

    toast({
        title: `Order ${status}`,
        description: `Order ${orderId} has been marked as ${status}.`,
    });
  };

  // Sort orders to always show the newest first
  const sortedOrders = [...orders].sort((a, b) => b.orderTime.getTime() - a.orderTime.getTime());

  const pendingOrders = sortedOrders.filter(o => o.status === 'pending');
  const activeOrders = sortedOrders.filter(o => o.status === 'accepted');
  const pastOrders = sortedOrders.filter(o => o.status === 'delivered' || o.status === 'rejected');

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
