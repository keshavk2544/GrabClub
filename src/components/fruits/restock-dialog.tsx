'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const restockSchema = z.object({
  newInventory: z.coerce.number().min(0, { message: "Inventory cannot be negative." }),
});

type RestockDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    product: Product | null;
};

export function RestockDialog({ isOpen, setIsOpen, product }: RestockDialogProps) {
    const { updateProduct } = useProducts();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof restockSchema>>({
        resolver: zodResolver(restockSchema),
        defaultValues: { newInventory: 0 }
    });

    useEffect(() => {
        if (product) {
            form.setValue('newInventory', product.inventory);
        }
    }, [product, isOpen, form]);

    const onSubmit = (data: z.infer<typeof restockSchema>) => {
        if (!product) return;
        setIsSubmitting(true);
        
        try {
            updateProduct(product.id, { inventory: data.newInventory });
            toast({ title: "Stock Updated", description: `${product.name} inventory is now ${data.newInventory}.` });
            setIsOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update stock." });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Stock for {product.name}</DialogTitle>
                    <DialogDescription>
                        Current stock: {product.inventory}. Enter the new total stock amount.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="newInventory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Stock Quantity</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} autoFocus />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)} type="button">Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Stock
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

    