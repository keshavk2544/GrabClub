'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pie, PieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const ORDERS_STORAGE_KEY = 'grabclub-orders';
const VENDOR_ID = 'fresh-vegetables';

export default function VegetableAnalyticsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const allOrders = JSON.parse(storedOrders).map((o: any) => ({ ...o, orderTime: new Date(o.orderTime) }));
        const vendorOrders = allOrders.filter((o: Order) => o.vendorId === VENDOR_ID && o.status === 'delivered');
        setOrders(vendorOrders);
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
        dailyIncome: [],
        mostOrderedItems: [],
      };
    }

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const dailyIncomeMap = new Map<string, number>();
    orders.forEach(order => {
      const day = format(order.orderTime, 'yyyy-MM-dd');
      dailyIncomeMap.set(day, (dailyIncomeMap.get(day) || 0) + order.total);
    });

    const dailyIncome = Array.from(dailyIncomeMap.entries())
        .map(([date, total]) => ({ date, total: Math.round(total) })) // Pie chart works better with integers
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7); // Pie chart with 30 slices is too much. Let's limit to 7 days.

    const itemCounts = new Map<string, { name: string; count: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemCounts.get(item.productId);
        if (existing) {
          itemCounts.set(item.productId, { ...existing, count: existing.count + item.quantity });
        } else {
          itemCounts.set(item.productId, { name: item.name, count: item.quantity });
        }
      });
    });

    const mostOrderedItems = Array.from(itemCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalRevenue, totalOrders, averageOrderValue, dailyIncome, mostOrderedItems };
  }, [orders]);

  const dailyIncomeChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    if (analytics.dailyIncome.length > 0) {
      analytics.dailyIncome.forEach((item, index) => {
        config[item.date] = {
          label: format(new Date(item.date), "MMM d"),
          color: `hsl(var(--chart-${(index % 5) + 1}))`,
        };
      });
    }
    return config;
  }, [analytics.dailyIncome]);

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
                    <CardTitle>Daily Income</CardTitle>
                    <CardDescription>Revenue from delivered orders over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center p-4">
                    <ChartContainer config={dailyIncomeChartConfig} className="mx-auto aspect-square h-[250px]">
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="total" />} />
                            <Pie data={analytics.dailyIncome} dataKey="total" nameKey="date" innerRadius={60} strokeWidth={5}>
                                {analytics.dailyIncome.map((entry) => (
                                    <Cell key={entry.date} fill={dailyIncomeChartConfig[entry.date]?.color} className="stroke-background" />
                                ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="date" />} className="-translate-y-2 flex-wrap gap-2" />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Most Ordered Items</CardTitle>
                    <CardDescription>Top 5 best-selling items.</CardDescription>
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
    </div>
  );
}
