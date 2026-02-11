'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Order, OrderItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const ORDERS_STORAGE_KEY = 'grabclub-orders';
const VENDOR_ID = 'pharmaplus';

export default function MedicineProductsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const allOrders = JSON.parse(storedOrders).map((o: any) => ({ ...o, orderTime: new Date(o.orderTime) }));
        const vendorOrders = allOrders.filter((o: Order) => o.vendorId === VENDOR_ID);
        setOrders(vendorOrders);
      }
    } catch (error) {
      console.error('Failed to load orders for products tab', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uniqueProducts = useMemo(() => {
    const productMap = new Map<string, { name: string; totalSold: number; lastPrice: number }>();
    
    orders.forEach(order => {
        if (order.status === 'delivered' || order.status === 'accepted' || order.status === 'out for delivery') {
            order.items.forEach(item => {
                const existing = productMap.get(item.name.toLowerCase());
                if (existing) {
                    productMap.set(item.name.toLowerCase(), {
                        name: item.name,
                        totalSold: existing.totalSold + item.quantity,
                        lastPrice: item.price,
                    });
                } else {
                    productMap.set(item.name.toLowerCase(), {
                        name: item.name,
                        totalSold: item.quantity,
                        lastPrice: item.price,
                    });
                }
            });
        }
    });

    return Array.from(productMap.values()).sort((a,b) => b.totalSold - a.totalSold);
  }, [orders]);
  
  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medicine Log</CardTitle>
        <CardDescription>
          This is a log of all medicines that have been ordered through the system. Products are added here automatically when you create an order.
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Total Quantity Sold</TableHead>
                    <TableHead className="text-right">Last Recorded Price</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {uniqueProducts.length > 0 ? (
                        uniqueProducts.map(product => (
                            <TableRow key={product.name}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.totalSold}</TableCell>
                                <TableCell className="text-right">₹{product.lastPrice.toFixed(2)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                                No products have been ordered yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
         </div>
      </CardContent>
    </Card>
  );
}
