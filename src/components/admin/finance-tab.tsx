'use client';

import { useState, useMemo } from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, RefreshCw, AlertTriangle, Users } from 'lucide-react';
import { subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const PROFIT_COMMISSION = 0.15; // 15% commission

export default function AdminFinanceTab() {
  const firestore = useFirestore();
  const { data: orders, isLoading } = useCollection<Order>(useMemoFirebase(() => firestore ? collection(firestore, 'orders') : null, [firestore]));
  const [timeFilter, setTimeFilter] = useState('week'); // 'week', 'month', 'year'

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      case 'week':
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        break;
    }
    
    return orders.filter(order => new Date(order.orderTime as any) >= startDate);
  }, [orders, timeFilter]);

  const financialSummary = useMemo(() => {
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
    const estimatedProfit = totalRevenue * PROFIT_COMMISSION;

    const pendingRefunds = filteredOrders.filter(o => o.status === 'rejected' && o.rejectionReason === 'vendor_unavailable');
    const totalRefundAmount = pendingRefunds.reduce((sum, order) => sum + order.total, 0);

    const pendingPaymentOrders = filteredOrders.filter(o => o.status === 'pending payment');
    const rejectedOrders = filteredOrders.filter(o => o.status === 'rejected' && o.rejectionReason !== 'vendor_unavailable');

    return {
      totalRevenue,
      estimatedProfit,
      pendingRefunds,
      totalRefundAmount,
      pendingPaymentOrders,
      rejectedOrders,
      totalDeliveredOrders: deliveredOrders.length,
    };
  }, [filteredOrders]);
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold">Financial Overview</h2>
                <p className="text-muted-foreground">Summary of your marketplace's financial activity.</p>
            </div>
             <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by time" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{financialSummary.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">from {financialSummary.totalDeliveredOrders} delivered orders</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estimated Profit ({PROFIT_COMMISSION * 100}%)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{financialSummary.estimatedProfit.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Based on total revenue</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{financialSummary.totalRefundAmount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">from {financialSummary.pendingRefunds.length} auto-rejected orders</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-500" /> Orders Requiring Refund</CardTitle>
                    <CardDescription>Orders automatically rejected due to vendor unavailability.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {financialSummary.pendingRefunds.length > 0 ? financialSummary.pendingRefunds.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell className="text-right font-medium">₹{order.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={3} className="text-center h-24">No pending refunds for this period.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="text-blue-500"/> Orders Awaiting Payment</CardTitle>
                    <CardDescription>Orders where payment has been requested but not completed by the user.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="rounded-md border max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {financialSummary.pendingPaymentOrders.length > 0 ? financialSummary.pendingPaymentOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell className="text-right font-medium">₹{order.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={3} className="text-center h-24">No orders awaiting payment.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
