'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';

import type { MedicineRequest, Order, Vendor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Loader2, FileText, Type } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

const lineItemSchema = z.object({
  name: z.string().min(1, "Name is required."),
  quantity: z.coerce.number().int().min(1, "Must be at least 1."),
  price: z.coerce.number().positive("Price must be positive."),
});

const createOrderSchema = z.object({
  items: z.array(lineItemSchema).min(1, "At least one item is required."),
  couponCode: z.string().optional(),
});

type CreateOrderDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  request: MedicineRequest | null;
  onOrderCreated: (requestId: string) => void;
};

export function CreateOrderDialog({ isOpen, setIsOpen, request, onOrderCreated }: CreateOrderDialogProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Fetch the pharmacy vendor details to get the dynamic delivery charge
    const vendorRef = useMemoFirebase(() => firestore ? doc(firestore, 'vendors', 'pharmaplus') : null, [firestore]);
    const { data: vendor } = useDoc<Vendor>(vendorRef);

    const form = useForm<z.infer<typeof createOrderSchema>>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            items: [{ name: '', quantity: 1, price: 0 }],
            couponCode: '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedItems = form.watch('items');
    
    // Use the delivery charge from the fetched vendor, with a fallback
    const deliveryFee = vendor?.deliveryCharge ?? 50.00;
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
    const total = subtotal + deliveryFee;

    useEffect(() => {
        if (!isOpen) {
            form.reset({ items: [{ name: '', quantity: 1, price: 0 }], couponCode: '' });
        } else if (request) {
            form.setValue('couponCode', request.couponCode || '');
        }
    }, [isOpen, form, request]);

    const onSubmit = async (data: z.infer<typeof createOrderSchema>) => {
        if (!request || !firestore) return;
        setIsSubmitting(true);
        
        const newOrder: Order = {
            id: `ORD-MED-${Date.now()}`,
            requestId: request.id,
            vendorId: 'pharmaplus',
            customerName: request.userName,
            customerEmail: request.userEmail,
            customerPhone: request.phone,
            receiverName: request.receiverName,
            status: 'pending payment',
            items: data.items.map(item => ({ ...item, productId: `med-${item.name.replace(/\s+/g, '-').toLowerCase()}` })),
            total: total,
            deliveryLocation: request.deliveryLocation,
            deliveryTimeSlot: request.deliveryTimeSlot,
            orderTime: new Date(),
        };

        if (data.couponCode) {
            newOrder.couponCode = data.couponCode;
        }

        try {
            const orderRef = doc(firestore, 'orders', newOrder.id);
            await setDoc(orderRef, newOrder);
            
            onOrderCreated(request.id);
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to save order", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Could not create the order.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!request) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] grid grid-rows-[auto_1fr_auto]">
            <DialogHeader>
                <DialogTitle>Create Order for {request.receiverName}</DialogTitle>
                <DialogDescription>
                    Review the user's request and add items to generate an order and request payment.
                </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6 py-4 overflow-y-auto pr-4">
                <div className="space-y-4">
                     <h3 className="font-semibold">User Request</h3>
                    {request.submissionType === 'upload' && request.prescriptionImage ? (
                        <div className="relative aspect-auto h-96 w-full rounded-md border">
                             <Image src={request.prescriptionImage} alt={`Prescription for ${request.receiverName}`} fill style={{ objectFit: 'contain' }} />
                        </div>
                    ) : (
                        <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-wrap text-sm">
                            {request.medicinesText}
                        </div>
                    )}
                    {request.couponCode && (
                        <div className="p-3 border rounded-md bg-amber-500/10 border-amber-500/20">
                            <p className="text-sm font-semibold text-amber-500">User Submitted Coupon</p>
                            <p className="font-mono text-amber-600">{request.couponCode}</p>
                        </div>
                    )}
                </div>

                <Form {...form}>
                    <form className="space-y-4 overflow-y-auto">
                        <h3 className="font-semibold">Order Items</h3>
                        <div className="space-y-3">
                             {fields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                                    <div className="grid grid-cols-[1fr_80px_80px] gap-2 flex-1">
                                        <FormField control={form.control} name={`items.${index}.name`} render={({ field }) => ( <FormItem><FormLabel>Medicine</FormLabel><FormControl><Input placeholder="e.g., Crocin" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => ( <FormItem><FormLabel>Qty</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                        <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => ( <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" className="w-full" onClick={() => append({ name: '', quantity: 1, price: 0 })}>
                            <Plus className="mr-2 h-4 w-4"/> Add Item
                        </Button>
                    </form>
                </Form>
            </div>
            <DialogFooter>
                <div className="w-full flex justify-between items-center">
                    <div>
                        <div className="text-lg font-bold">
                            Item Total: ₹{subtotal.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Delivery fee (₹{deliveryFee.toFixed(2)}) will be added for the customer.</p>
                    </div>
                     <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate & Request Payment
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
