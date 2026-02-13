'use client';

import { useMemo } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import type { Order, CartItem, Vendor, MedicineRequest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, RefreshCw, MoreHorizontal, Frown, AlertCircle, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import GrabClubLoading from '@/components/layout/loading';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/use-products';
import { useCartAnimation } from '@/context/cart-animation-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import BlockedUserGuard from '@/components/blocked-user-guard';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


function HistoryPageContent() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { products, isLoading: isProductsLoading } = useProducts();
  const { replaceCart } = useCartAnimation();
  const { toast } = useToast();

  const deliveredOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'orders'), where('customerEmail', '==', user.email), where('status', 'in', ['delivered', 'rejected', 'refunded']));
  }, [firestore, user]);
  const { data: userOrders, isLoading: ordersLoading } = useCollection<Order>(deliveredOrdersQuery);

  const rejectedRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'medicineRequests'), where('userEmail', '==', user.email), where('status', '==', 'rejected'));
  }, [firestore, user]);
  const { data: userMedicineRequests, isLoading: requestsLoading } = useCollection<MedicineRequest>(rejectedRequestsQuery);
  
  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors, isLoading: vendorsLoading } = useCollection<Vendor>(vendorsQuery);


  const allHistoryItems = useMemo(() => {
    const ordersWithMeta = (userOrders || []).map(o => ({ 
        ...o, 
        type: 'order' as const, 
        date: (o.orderTime as any)?.toDate ? (o.orderTime as any).toDate() : new Date(o.orderTime as any) 
    }));
    const requestsWithMeta = (userMedicineRequests || []).map(req => ({ 
        ...req, 
        type: 'request' as const, 
        date: (req.createdAt as any)?.toDate ? (req.createdAt as any).toDate() : new Date(req.createdAt as any) 
    }));

    const combined = [...ordersWithMeta, ...requestsWithMeta];
    return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [userOrders, userMedicineRequests]);


  const handleReorder = (order: Order) => {
    if (isProductsLoading || !products) {
      toast({
        variant: "destructive",
        title: "Please wait",
        description: "Products are still loading.",
      });
      return;
    }

    const newCartItems: CartItem[] = order.items
      .map(orderItem => {
        const product = products.find(p => p.id === orderItem.productId);
        if (!product) {
          return null;
        }
        return { product, quantity: orderItem.quantity };
      })
      .filter((item): item is CartItem => item !== null);

    if (newCartItems.length !== order.items.length) {
      toast({
        variant: "destructive",
        title: "Some items unavailable",
        description: "Some items from this order are no longer available and were not added to the cart.",
      });
    }

    if (newCartItems.length === 0) {
      toast({
        title: "No items to reorder",
        description: "All items from this order are currently unavailable.",
      });
      return;
    }
    
    replaceCart(newCartItems);
  };

  const handleRaiseComplaint = (code: string) => {
    router.push(`/profile?complaint_code=${code}`);
  };
  
  if (isUserLoading || isProductsLoading || ordersLoading || requestsLoading || vendorsLoading) {
    return <GrabClubLoading />;
  }
  
  if (allHistoryItems.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground" />
        <h1 className="mt-4 text-3xl font-headline font-bold">No Past Orders</h1>
        <p className="mt-2 text-muted-foreground">You haven't completed any orders yet.</p>
      </div>
    );
  }

  const getVendorName = (vendorId: string) => {
    const vendor = vendors?.find(v => v.id === vendorId);
    return vendor ? vendor.name : 'Unknown Vendor';
  };

  const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'rejected':
      case 'refunded':
        return 'destructive';
      case 'delivered':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container py-8 sm:py-12">
      <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl mb-8">
        Your Order History
      </h1>
      <div className="space-y-6">
        {allHistoryItems.map(item => {
          if (item.type === 'request') {
            const request = item as MedicineRequest & { date: Date };
            return (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-4 bg-muted/30">
                  <div>
                    <CardTitle className="text-lg">Medicine Request</CardTitle>
                    <CardDescription>
                      {request.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="destructive" className="capitalize">
                    Rejected
                  </Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-sm">
                    <p className="font-medium text-muted-foreground">From</p>
                    <p className="font-semibold">{getVendorName('pharmaplus')}</p>
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">Your Request:</p>
                    {request.submissionType === 'upload' ? (
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Prescription Uploaded</div>
                    ) : (
                      <p className="pl-4 border-l-2">{request.medicinesText}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-6 flex justify-end items-center">
                    <p className="text-sm text-muted-foreground">This request was rejected by the vendor.</p>
                </CardFooter>
              </Card>
            );
          }

          const order = item as Order & { date: Date };
          const isRefundableRejection = order.status === 'rejected' && (order.rejectionReason === 'vendor_unavailable' || order.rejectionReason === 'vendor_rejected');
          const rejectionMessage = order.rejectionReason === 'vendor_unavailable' 
              ? "Due to vendor unavailability, your order couldn't be confirmed." 
              : "The vendor was unable to fulfill your order at this time.";

          return (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between gap-4 bg-muted/30">
                <div>
                  <CardTitle className="text-lg">Order #{order.id.replace('ORD-', '')}</CardTitle>
                  <CardDescription>
                    {order.date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </CardDescription>
                </div>
                <div className="flex items-center">
                    <Badge
                        variant={isRefundableRejection ? 'secondary' : getStatusBadgeVariant(order.status)}
                        className={cn('capitalize', {
                        'bg-green-600 text-white border-transparent hover:bg-green-700': order.status === 'delivered',
                        'bg-yellow-400 text-yellow-900 border-transparent hover:bg-yellow-500': isRefundableRejection,
                        })}
                    >
                        {isRefundableRejection ? 'Refund Pending' : order.status}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleReorder(order)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reorder
                            </DropdownMenuItem>
                            {order.status === 'delivered' && (
                                <DropdownMenuItem onClick={() => handleRaiseComplaint(order.verificationCode || order.id)}>
                                    <Frown className="mr-2 h-4 w-4" />
                                    Raise Complaint
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 {isRefundableRejection ? (
                  <Alert variant="warning">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Order Cancelled & Refund Pending</AlertTitle>
                      <AlertDescription>
                          {rejectionMessage} A total of <strong>₹{order.total.toFixed(2)}</strong> will be refunded to your account in 4-5 working days. We are trying to make it ASAP.
                      </AlertDescription>
                  </Alert>
                ) : order.verificationCode && (
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
              </CardContent>
              <CardFooter className="bg-muted/30 p-6 flex justify-end items-center">
                <div className="text-right">
                  <span className="text-xl font-bold font-headline">₹{order.total.toFixed(2)}</span>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function HistoryPage() {
    return (
        <BlockedUserGuard>
            <HistoryPageContent />
        </BlockedUserGuard>
    )
}

    