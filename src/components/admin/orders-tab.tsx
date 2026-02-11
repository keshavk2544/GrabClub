'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Order, Vendor } from '@/lib/types';
import { vendors as initialVendors, categories } from '@/lib/data';

const ORDERS_STORAGE_KEY = 'grabclub-orders';
const VENDORS_STORAGE_KEY = 'grabclub-vendors';

export default function AdminOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  useEffect(() => {
    try {
      const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const allOrders = JSON.parse(storedOrders).map((o: any) => ({ ...o, orderTime: new Date(o.orderTime) }));
        setOrders(allOrders.sort((a: Order, b: Order) => b.orderTime.getTime() - a.orderTime.getTime()));
      }

      const storedVendors = window.localStorage.getItem(VENDORS_STORAGE_KEY);
      if (storedVendors) {
        setVendors(JSON.parse(storedVendors));
      } else {
        setVendors(initialVendors);
      }
    } catch (error) {
      console.error('Failed to load data for admin orders tab', error);
      setVendors(initialVendors);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getVendorInfo = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return { name: 'Unknown Vendor', category: 'Unknown' };
    const category = categories.find(c => c.id === vendor.category);
    return { name: vendor.name, category: category ? category.name : 'Unknown' };
  };

  const handleCardClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailViewOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const vendorInfo = getVendorInfo(order.vendorId);

      // Filter by status
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }
      
      // Filter by service/category
      if (serviceFilter && vendorInfo.category.toLowerCase() !== serviceFilter.toLowerCase()) {
        return false;
      }

      // Filter by search query
      if (filterQuery) {
        const query = filterQuery.toLowerCase();
        const matches =
          vendorInfo.name.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query) ||
          (order.verificationCode && order.verificationCode.includes(filterQuery));

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [orders, vendors, filterQuery, statusFilter, serviceFilter]);


  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input 
          placeholder="Search by Order ID, Code, Vendor, Customer..." 
          className="max-w-sm" 
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending payment">Pending Payment</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="out for delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
        </Select>
        <Select value={serviceFilter} onValueChange={(value) => setServiceFilter(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Service" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOrders.map((order) => {
            const vendorInfo = getVendorInfo(order.vendorId);
            return (
            <Card
                key={order.id}
                className="cursor-pointer hover:border-primary transition-colors flex flex-col"
                onClick={() => handleCardClick(order)}
            >
                <CardHeader>
                <CardTitle className="text-base font-bold flex justify-between items-center">
                    <span>Order #{order.id.split('-').pop()}</span>
                    <Badge variant={
                        order.status === 'rejected' ? 'destructive' :
                        (order.status === 'delivered' || order.status === 'accepted') ? 'default' : 'secondary'
                    } className={cn("capitalize", {
                        'bg-green-600 text-white border-transparent hover:bg-green-700': order.status === 'accepted' || order.status === 'delivered',
                        'bg-blue-600 text-white border-transparent hover:bg-blue-700': order.status === 'pending',
                        'bg-amber-500 text-white border-transparent hover:bg-amber-600': order.status === 'pending payment',
                    })}>{order.status}</Badge>
                </CardTitle>
                <CardDescription>{order.customerName}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm font-medium">{vendorInfo.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{vendorInfo.category}</p>
                    {order.verificationCode && (
                        <div className="pt-2">
                            <p className="text-xs text-muted-foreground">Code</p>
                            <p className="font-mono font-bold tracking-widest text-primary">{order.verificationCode}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>
                </CardFooter>
            </Card>
            )
        })}
      </div>
       {filteredOrders.length === 0 && !isLoading && (
         <div className="text-center py-16 col-span-full">
            <h3 className="text-xl font-headline font-bold">No Orders Found</h3>
            <p className="mt-2 text-muted-foreground">
                No orders match your current filters.
            </p>
        </div>
      )}

      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.id.split('-').pop()}</DialogTitle>
                <DialogDescription>
                    Placed on {selectedOrder.orderTime.toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                {selectedOrder.verificationCode && (
                  <div className="p-3 text-center bg-muted/50 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Verification Code</p>
                      <p className="text-3xl font-bold tracking-widest font-headline text-primary">{selectedOrder.verificationCode}</p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Status</p>
                     <Badge variant={
                        selectedOrder.status === 'rejected' ? 'destructive' :
                        (selectedOrder.status === 'delivered' || selectedOrder.status === 'accepted') ? 'default' : 'secondary'
                    } className={cn("capitalize", {
                        'bg-green-600 text-white border-transparent hover:bg-green-700': selectedOrder.status === 'accepted' || selectedOrder.status === 'delivered',
                        'bg-blue-600 text-white border-transparent hover:bg-blue-700': selectedOrder.status === 'pending',
                        'bg-amber-500 text-white border-transparent hover:bg-amber-600': selectedOrder.status === 'pending payment',
                    })}>{selectedOrder.status}</Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-medium">Customer</p>
                        <p className="text-muted-foreground">{selectedOrder.customerName}</p>
                        <p className="text-muted-foreground break-all">{selectedOrder.customerEmail}</p>
                    </div>
                    <div>
                        <p className="font-medium">Vendor</p>
                        <p className="text-muted-foreground">{getVendorInfo(selectedOrder.vendorId).name}</p>
                        <p className="text-muted-foreground capitalize">{getVendorInfo(selectedOrder.vendorId).category}</p>
                    </div>
                </div>
                <div className="text-sm">
                    <p className="font-medium">Delivery To</p>
                    <p className="text-muted-foreground">{selectedOrder.deliveryLocation}</p>
                    {selectedOrder.deliveryTimeSlot && <p className="text-muted-foreground">Time Slot: {selectedOrder.deliveryTimeSlot}</p>}
                </div>
                <Separator />
                <div>
                    <h4 className="font-medium mb-2">Items</h4>
                    <div className="space-y-2 text-sm">
                        {selectedOrder.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start">
                                <div className="pr-4">
                                    <p>{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.quantity} x ₹{item.price.toFixed(2)}
                                    </p>
                                </div>
                                <p className="text-right flex-shrink-0">₹{(item.quantity * item.price).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                    <p>Total</p>
                    <p>₹{selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
