'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pie, PieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { vendors } from '@/lib/data';

const ORDERS_STORAGE_KEY = 'grabclub-orders';

export default function AdminHomeTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const allOrders = JSON.parse(storedOrders).map((o: any) => ({ ...o, orderTime: new Date(o.orderTime) }));
        const deliveredOrders = allOrders.filter((o: Order) => o.status === 'delivered');
        setOrders(deliveredOrders);
      }
    } catch (error) {
      console.error('Failed to load orders for analytics', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analytics = useMemo(() => {
    if (orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        salesByVendor: [],
        mostOrderedItems: [],
        dailyRevenue: [],
      };
    }

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const vendorSales = new Map<string, { name: string; total: number }>();
    orders.forEach(order => {
        const vendorName = vendors.find(v => v.id === order.vendorId)?.name || 'Unknown Vendor';
        vendorSales.set(vendorName, {
            name: vendorName,
            total: (vendorSales.get(vendorName)?.total || 0) + order.total,
        });
    });
    const salesByVendor = Array.from(vendorSales.values()).sort((a,b) => b.total - a.total).slice(0, 5);

    const itemCounts = new Map<string, { name: string; count: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemCounts.get(item.productId || item.name);
        if (existing) {
          itemCounts.set(item.productId || item.name, { ...existing, count: existing.count + item.quantity });
        } else {
          itemCounts.set(item.productId || item.name, { name: item.name, count: item.quantity });
        }
      });
    });
    const mostOrderedItems = Array.from(itemCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    const dailyRevenueMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MMM d');
        dailyRevenueMap.set(date, 0);
    }
    orders.forEach(order => {
        const day = format(order.orderTime, 'MMM d');
        if (dailyRevenueMap.has(day)) {
            dailyRevenueMap.set(day, dailyRevenueMap.get(day)! + order.total);
        }
    });
    const dailyRevenue = Array.from(dailyRevenueMap.entries()).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));

    return { totalRevenue, totalOrders, averageOrderValue, salesByVendor, mostOrderedItems, dailyRevenue };
  }, [orders]);

  const vendorChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    if (analytics.salesByVendor.length > 0) {
      analytics.salesByVendor.forEach((item, index) => {
        config[item.name] = {
          label: item.name,
          color: `hsl(var(--chart-${(index % 5) + 1}))`,
        };
      });
    }
    return config;
  }, [analytics.salesByVendor]);
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="lg:col-span-4 h-80" />
                <Skeleton className="lg:col-span-3 h-80" />
            </div>
        </div>
    );
  }
  
  if (orders.length === 0) {
      return (
        <div className="text-center py-16">
            <h3 className="text-xl font-headline font-bold">No Analytics Data</h3>
            <p className="mt-2 text-muted-foreground">
                There are no delivered orders yet to generate analytics.
            </p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{analytics.totalOrders}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{analytics.averageOrderValue.toFixed(2)}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Daily Revenue (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                     <ChartContainer config={{}} className="h-[300px] w-full">
                        <BarChart accessibilityLayer data={analytics.dailyRevenue}>
                           <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickFormatter={(value) => `₹${value}`} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4}>
                                 {analytics.dailyRevenue.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Top Vendors by Revenue</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-4">
                     <ChartContainer config={vendorChartConfig} className="mx-auto aspect-square h-[250px]">
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="total" />} />
                            <Pie data={analytics.salesByVendor} dataKey="total" nameKey="name" innerRadius={60} strokeWidth={5}>
                                {analytics.salesByVendor.map((entry) => (
                                    <Cell key={entry.name} fill={vendorChartConfig[entry.name]?.color} className="stroke-background" />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2" />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Most Ordered Items</CardTitle>
                <CardDescription>Top 5 best-selling items across all vendors.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity Sold</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {analytics.mostOrderedItems.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">{item.count}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
