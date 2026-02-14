
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';
import type { Order, Vendor, MedicineRequest, Coupon } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, CreditCard, Ticket, CheckCircle, Clock } from 'lucide-react';
import GrabClubLoading from '@/components/layout/loading';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import BlockedUserGuard from '@/components/blocked-user-guard';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function OrdersPageContent() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [couponCodes, setCouponCodes] = useState<Record<string, string>>({});

  const userOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'orders'), where('customerEmail', '==', user.email), where('status', 'in', ['pending', 'pending payment', 'accepted', 'out for delivery']));
  }, [firestore, user]);
  const { data: userOrders, isLoading: ordersLoading } = useCollection<Order>(userOrdersQuery);

  const userRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'medicineRequests'), where('userEmail', '==', user.email), where('status', '==', 'pending-review'));
  }, [firestore, user]);
  const { data: userRequests, isLoading: requestsLoading } = useCollection<MedicineRequest>(userRequestsQuery);
  
  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors, isLoading: vendorsLoading } = useCollection<Vendor>(vendorsQuery);

  const allActiveItems = useMemo(() => {
    const ordersWithMeta = (userOrders || []).map(o => ({
      ...o,
      type: 'order' as const,
      date: (o.orderTime as any)?.toDate ? (o.orderTime as any).toDate() : new Date(o.orderTime),
    }));
    
    const requestsWithMeta = (userRequests || []).map(req => ({
      ...req,
      type: 'request' as const,
      date: (req.createdAt as any)?.toDate ? (req.createdAt as any).toDate() : new Date(req.createdAt),
    }));

    const combined = [...ordersWithMeta, ...requestsWithMeta];
    return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [userOrders, userRequests]);


  if (isUserLoading || ordersLoading || requestsLoading || vendorsLoading) {
    return <GrabClubLoading />;
  }

  const handleApplyCoupon = async (order: Order) => {
    const code = couponCodes[order.id]?.trim().toUpperCase();
    if (!code || !firestore) return;

    const couponsRef = collection(firestore, 'coupons');
    const q = query(couponsRef, where('code', '==', code));

    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ variant: 'destructive', title: "Invalid Coupon" });
            return;
        }

        const couponDoc = querySnapshot.docs[0];
        const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

        if (coupon.timesUsed >= coupon.usageLimit) {
            toast({ variant: 'destructive', title: "Coupon Expired" });
            return;
        }

        const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        // Only apply coupon if there's a delivery fee to waive
        if (order.total > subtotal) {
            const batch = writeBatch(firestore);

            const couponRef = doc(firestore, 'coupons', coupon.id);
            batch.update(couponRef, { timesUsed: coupon.timesUsed + 1 });

            const orderRef = doc(firestore, 'orders', order.id);
            batch.update(orderRef, {
                total: subtotal,
                couponApplied: true,
                couponCode: code,
            });

            await batch.commit();
            toast({ variant: 'success', title: "Coupon Applied!", description: "Free delivery unlocked." });
        } else {
             toast({ variant: 'default', title: "No Delivery Fee", description: "This order already has free delivery." });
        }

    } catch (error) {
        console.error("Error applying coupon:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not apply coupon." });
    }
  };
  
  if (allActiveItems.length === 0) {
    return (
      <div className="container py-16 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground" />
        <h1 className="mt-4 text-3xl font-headline font-bold">No Active Orders</h1>
        <p className="mt-2 text-muted-foreground">Your pending and active orders will appear here.</p>
      </div>
    );
  }

  const getVendorName = (vendorId: string) => {
    const vendor = vendors?.find(v => v.id === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  };

  const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'rejected': return 'destructive';
      case 'delivered': return 'default';
      case 'accepted': return 'default';
      default: return 'secondary';
    }
  };
  
  const getDisplayStatus = (status: Order['status']) => {
    if (status === 'pending') return 'Awaiting Confirmation';
    return status;
  }

  return (
    <div className="container py-8 sm:py-12">
      <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl mb-8">
        Your Active Orders
      </h1>
      <div className="space-y-6">
        {allActiveItems.map(item => {
          if (item.type === 'request') {
             return (
               <Card key={item.id} className="overflow-hidden">
                 <CardHeader className="flex flex-row items-start justify-between gap-4 bg-muted/30">
                    <div>
                        <CardTitle className="text-lg">Medicine Request</CardTitle>
                        <CardDescription>
                            Submitted on {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize bg-blue-600 text-white border-transparent hover:bg-blue-700">Pending Review</Badge>
                 </CardHeader>
                 <CardContent className="p-6 space-y-4">
                     <div className="text-sm">
                        <p className="font-medium text-muted-foreground">From</p>
                        <p className="font-semibold">{getVendorName('pharmaplus')}</p>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {item.submissionType === 'upload' ? 'Prescription uploaded for review.' : `You requested: "${item.medicinesText?.substring(0, 50)}..."`}
                    </div>
                 </CardContent>
                 <CardFooter className="bg-muted/30 p-6 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Awaiting vendor response...</span>
                 </CardFooter>
               </Card>
             );
           }

           const order = item as Order;
           const isActive = order.status === 'accepted' || order.status === 'out for delivery';
           const displayStatus = getDisplayStatus(order.status);
           const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
           const deliveryFee = order.couponApplied ? 0 : (order.total - subtotal);

          return (
            <Card key={order.id} className={cn(
              "overflow-hidden",
              isActive && "bg-destructive/10 border-destructive/30 animate-pulse"
            )}>
              <CardHeader className={cn(
                "flex flex-row items-start justify-between gap-4",
                isActive ? "bg-transparent" : "bg-muted/30"
              )}>
                <div>
                  <CardTitle className="text-lg">Order #{order.id.split('-').pop()}</CardTitle>
                  <CardDescription>
                    {item.date.toLocaleString()}
                  </CardDescription>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(order.status)}
                  className={cn('capitalize', {
                    'bg-green-600 text-white border-transparent hover:bg-green-700': order.status === 'delivered' || order.status === 'accepted',
                    'bg-amber-500 text-white border-transparent hover:bg-amber-600': order.status === 'pending payment',
                    'bg-sky-500 text-white border-transparent hover:bg-sky-600': order.status === 'out for delivery',
                    'bg-blue-600 text-white border-transparent hover:bg-blue-700': order.status === 'pending',
                  })}
                >
                  {displayStatus}
                </Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 {order.verificationCode && (
                  <div className="p-3 text-center bg-muted/50 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Show this code at delivery</p>
                      <p className="text-3xl font-bold tracking-widest font-headline text-primary">{order.verificationCode}</p>
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">From</p>
                  <p className="font-semibold">{getVendorName(order.vendorId)}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={`${item.productId || item.name}-${index}`} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name} x {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        {order.couponApplied ? (
                            <span className="text-green-500 font-semibold">FREE</span>
                        ) : (
                            <span>₹{deliveryFee.toFixed(2)}</span>
                        )}
                    </div>
                </div>
              </CardContent>
              <CardFooter className={cn(
                "p-6 flex flex-col items-stretch gap-4",
                isActive ? "bg-transparent" : "bg-muted/30"
              )}>
                {order.status === 'pending payment' ? (
                  <>
                    {!order.couponApplied && deliveryFee > 0 ? (
                        <div className="space-y-2">
                            <Label htmlFor={`coupon-${order.id}`} className="flex items-center gap-2 text-sm text-muted-foreground"><Ticket className="w-4 h-4" /> Apply Coupon</Label>
                            <div className="flex gap-2">
                                <Input id={`coupon-${order.id}`} placeholder="Enter coupon code" value={couponCodes[order.id] || ''} onChange={(e) => setCouponCodes(prev => ({...prev, [order.id]: e.target.value}))} />
                                <Button onClick={() => handleApplyCoupon(order)} disabled={!couponCodes[order.id]}>Apply</Button>
                            </div>
                        </div>
                    ) : (
                        order.couponApplied && <div className="text-center text-sm font-semibold text-green-500 flex items-center justify-center gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
                            <CheckCircle className="w-4 h-4" />
                            Coupon for Free Delivery Applied!
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                        <Button asChild size="sm">
                        <Link href={`/payment/${order.id}`}>
                            <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                        </Link>
                        </Button>
                        <div className="text-right">
                          <span className="text-xl font-bold font-headline">₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                  </>
                ) : (
                  <div className="flex w-full justify-between items-center">
                    <span className="text-sm text-muted-foreground">Awaiting vendor response...</span>
                    <div className="text-right">
                      <span className="text-xl font-bold font-headline">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
    return (
        <BlockedUserGuard>
            <OrdersPageContent />
        </BlockedUserGuard>
    )
}
