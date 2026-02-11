'use client';
import { useState, useEffect, useMemo } from 'react';
import type { MedicineRequest, Order, Vendor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { FileText, Type, CheckCircle, Clock, Archive, Truck,ChevronDown, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateOrderDialog } from '@/components/medicine/create-order-dialog';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';


const VENDOR_ID = 'pharmaplus';

export default function MedicineOrdersTab() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCreateOrderOpen, setCreateOrderOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);

    const requestsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'medicineRequests')) : null
    , [firestore]);
    const { data: requests, isLoading: requestsLoading } = useCollection<MedicineRequest>(requestsQuery);
    
    const ordersQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'orders'), where('vendorId', '==', VENDOR_ID)) : null
    , [firestore]);
    const { data: orders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

    const isLoading = requestsLoading || ordersLoading;

    const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
        if (!firestore) return;
        
        const orderRef = doc(firestore, 'orders', orderId);
        
        const updateData: Partial<Order> = { status };
        if (status === 'accepted') {
          updateData.verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        }
        
        await updateDoc(orderRef, updateData);

        toast({
            title: `Order ${status}`,
            description: `Order has been marked as ${status}.`,
        });
    };

    const handleCreateOrder = (request: MedicineRequest) => {
        setSelectedRequest(request);
        setCreateOrderOpen(true);
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!firestore) return;
        const requestRef = doc(firestore, 'medicineRequests', requestId);
        await updateDoc(requestRef, { status: 'rejected' });
        toast({
            title: 'Request Rejected',
            variant: 'destructive',
        });
    };

    const handleOrderCreated = async (requestId: string) => {
        if(!firestore) return;
        const requestRef = doc(firestore, 'medicineRequests', requestId);
        await updateDoc(requestRef, { status: 'processed' });
        
        toast({ title: 'Order Created', description: 'Payment request has been sent to the user.' });
    };

    const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
        switch (status) {
            case 'rejected': return 'destructive';
            case 'delivered': return 'default';
            case 'accepted': return 'default';
            default: return 'secondary';
        }
    };
    
    const pendingRequests = useMemo(() => (requests || []).filter(r => r.status === 'pending-review').sort((a,b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()), [requests]);
    const activeOrders = useMemo(() => (orders || []).filter(o => ['accepted', 'out for delivery'].includes(o.status)).sort((a,b) => new Date(b.orderTime as any).getTime() - new Date(a.orderTime as any).getTime()), [orders]);
    const processedRequests = useMemo(() => (requests || []).filter(req => req.status === 'processed' || req.status === 'rejected').sort((a,b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()), [requests]);
    const pastOrders = useMemo(() => (orders || []).filter(o => ['delivered', 'rejected'].includes(o.status)).sort((a,b) => new Date(b.orderTime as any).getTime() - new Date(a.orderTime as any).getTime()), [orders]);
    const unpaidOrders = useMemo(() => (orders || []).filter(o => o.status === 'pending payment').sort((a,b) => new Date(b.orderTime as any).getTime() - new Date(a.orderTime as any).getTime()), [orders]);


    if (isLoading) {
        return <div className="container p-6">Loading requests...</div>;
    }

    return (
        <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>New Medicine Requests</CardTitle>
                        <CardDescription>Review and process incoming medicine requests.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingRequests.length > 0 ? (
                            pendingRequests.map(req => (
                                <Card key={req.id} className="bg-primary/10 border-primary/20">
                                    <CardHeader className="flex flex-row items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{req.receiverName}</CardTitle>
                                            <CardDescription>
                                                {req.userName}
                                            </CardDescription>
                                        </div>
                                        <Badge><Clock className="mr-1.5 h-3 w-3" /> {formatDistanceToNow(new Date(req.createdAt as any), { addSuffix: true })}</Badge>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-3 border rounded-md">
                                            <p className="font-semibold text-sm">Delivery Details</p>
                                            <p className="text-sm text-muted-foreground">{req.deliveryLocation}</p>
                                            <p className="text-sm text-muted-foreground">{req.deliveryTimeSlot}</p>
                                        </div>
                                        <div className="p-3 border rounded-md">
                                            {req.submissionType === 'upload' && req.prescriptionImage ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <div className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded-md">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                            <div>
                                                                <p className="font-semibold text-sm">View Prescription</p>
                                                                <p className="text-xs text-muted-foreground">Click to open image</p>
                                                            </div>
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Prescription for {req.receiverName}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="relative h-[80vh]">
                                                            <Image src={req.prescriptionImage} alt={`Prescription for ${req.receiverName}`} fill style={{ objectFit: 'contain' }} />
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <div className="flex items-start gap-3">
                                                    <Type className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-semibold text-sm">Manual Request</p>
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{req.medicinesText}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2">
                                        <Button variant="destructive" onClick={() => handleRejectRequest(req.id)}>
                                            <X className="mr-2 h-4 w-4" /> Reject
                                        </Button>
                                        <Button onClick={() => handleCreateOrder(req)}>Create Order</Button>
                                    </CardFooter>
                                </Card>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No new medicine requests.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Active Orders</CardTitle>
                        <CardDescription>Paid orders that are ready for processing and delivery.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {activeOrders.length > 0 ? (
                           activeOrders.map(order => (
                               <Card key={order.id} className="bg-card">
                                   <CardHeader>
                                       <div className="flex items-start justify-between">
                                           <div>
                                               <CardTitle className="text-lg">{order.receiverName}</CardTitle>
                                               <CardDescription>Order #{order.id.split('-').pop()}</CardDescription>
                                           </div>
                                            <Badge variant={getStatusBadgeVariant(order.status)} className={cn("capitalize", {'bg-green-600 text-white': order.status === 'accepted', 'bg-sky-500 text-white': order.status === 'out for delivery'})}>
                                                {order.status}
                                            </Badge>
                                       </div>
                                   </CardHeader>
                                   <CardContent>
                                        {order.verificationCode && (
                                            <div className="mb-4 p-2 rounded-md bg-muted text-center">
                                                <p className="text-xs text-muted-foreground">Verification Code</p>
                                                <p className="text-2xl font-bold tracking-widest">{order.verificationCode}</p>
                                            </div>
                                        )}
                                       <p className="text-sm text-muted-foreground">{order.deliveryLocation} - {order.deliveryTimeSlot}</p>
                                       <Separator className="my-3" />
                                       <div className="space-y-1 text-sm">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex justify-between">
                                                    <span>{item.name} x{item.quantity}</span>
                                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                       </div>
                                   </CardContent>
                               </Card>
                           ))
                       ) : (
                           <p className="text-muted-foreground text-center py-8">No active orders.</p>
                       )}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Order History</CardTitle>
                        <CardDescription>Requests awaiting payment and completed orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue={['unpaid']}>
                            <AccordionItem value="unpaid">
                                <AccordionTrigger>Awaiting Payment ({unpaidOrders.length})</AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2">
                                     {unpaidOrders.length > 0 ? (
                                        unpaidOrders.map(order => (
                                            <Collapsible key={order.id} className="p-3 border rounded-md bg-muted/50 group">
                                                <CollapsibleTrigger className="flex w-full items-start justify-between text-left">
                                                    <div>
                                                        <p className="font-semibold text-sm">{order.receiverName}</p>
                                                        <p className="text-xs text-muted-foreground">Order #{order.id.split('-').pop()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="bg-amber-500 text-white">Pending Payment</Badge>
                                                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="pt-2">
                                                    <Separator className="my-2" />
                                                    <div className="space-y-1 text-xs">
                                                        {order.items.map((item, index) => (
                                                            <div key={index} className="flex justify-between text-muted-foreground">
                                                                <span>{item.name} x {item.quantity}</span>
                                                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))
                                     ) : (
                                         <p className="text-sm text-muted-foreground text-center py-4">No orders are awaiting payment.</p>
                                     )}
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="past">
                                <AccordionTrigger>Completed & Rejected ({pastOrders.length})</AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2">
                                    {pastOrders.length > 0 ? (
                                        pastOrders.map(order => (
                                            <Collapsible key={order.id} className="p-3 border rounded-md bg-muted/50 group">
                                                <CollapsibleTrigger className="flex w-full items-start justify-between text-left">
                                                    <div>
                                                        <p className="font-semibold text-sm">{order.receiverName}</p>
                                                        <p className="text-xs text-muted-foreground">Order #{order.id.split('-').pop()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={getStatusBadgeVariant(order.status)} className={cn("capitalize", {'bg-green-600/80': order.status === 'delivered'})}>
                                                            {order.status}
                                                        </Badge>
                                                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="pt-2">
                                                    <Separator className="my-2" />
                                                    <div className="space-y-1 text-xs">
                                                        {order.items.map((item, index) => (
                                                            <div key={index} className="flex justify-between text-muted-foreground">
                                                                <span>{item.name} x {item.quantity}</span>
                                                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No completed orders yet.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="processed-requests">
                                <AccordionTrigger>Archived & Rejected Requests ({processedRequests.length})</AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2">
                                     {processedRequests.length > 0 ? (
                                         processedRequests.map(req => (
                                            <div key={req.id} className="p-3 border rounded-md bg-muted/50">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-semibold text-sm">{req.receiverName}</p>
                                                        <p className="text-xs text-muted-foreground">{req.orderId ? `Order #${req.orderId.split('-').pop()}` : `Req #${req.id.split('-').pop()}`}</p>
                                                    </div>
                                                    <Badge variant={req.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{req.status}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{req.userName}</p>
                                                {req.orderItems && req.orderItems.length > 0 && (
                                                    <div className="mt-2 text-xs border-t pt-2">
                                                        {req.orderItems.map((item: any, index: number) => (
                                                            <div key={index} className="text-muted-foreground">{item.name} x {item.quantity}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                         ))
                                     ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No archived requests.</p>
                                     )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
             <CreateOrderDialog
                isOpen={isCreateOrderOpen}
                setIsOpen={setCreateOrderOpen}
                request={selectedRequest}
                onOrderCreated={handleOrderCreated}
            />
        </div>
    );
}
