'use client';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Camera, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { useGroceryCategories } from '@/context/grocery-categories-context';

const productSchema = z.object({
    name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
    price: z.coerce.number().positive({ message: "Price must be a positive number." }),
    inventory: z.coerce.number().min(0, { message: "Inventory cannot be negative." }),
    quantityUnit: z.string().min(1, { message: "Quantity unit is required (e.g., '1 pc', '500 gm')." }),
    imageSrc: z.string().min(1, { message: "An image is required." }),
    subCategory: z.string().min(1, { message: "Category is required." }),
    keywords: z.string().optional(),
});

type AddProductDialogProps = {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    product: Product | null;
};

export function AddProductDialog({ isOpen, setIsOpen, product }: AddProductDialogProps) {
    const { addProduct, updateProduct } = useProducts();
    const { toast } = useToast();
    const { categories, addCategory } = useGroceryCategories();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageMode, setImageMode] = useState<'upload' | 'camera' | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: { name: '', price: 0, inventory: 0, quantityUnit: '', imageSrc: '', subCategory: '', keywords: '' }
    });

    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                price: product.price,
                inventory: product.inventory,
                quantityUnit: product.quantityUnit,
                imageSrc: product.image.src,
                subCategory: product.subCategory || '',
                keywords: product.keywords || '',
            });
            setImagePreview(product.image.src);
        } else {
            form.reset({ name: '', price: 0, inventory: 0, quantityUnit: '', imageSrc: '', subCategory: '', keywords: '' });
            setImagePreview(null);
        }
        setImageMode(null);
    }, [product, isOpen, form]);

    useEffect(() => {
        const getCameraPermission = async () => {
            if (imageMode !== 'camera') return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings.',
                });
            }
        };
        getCameraPermission();

        return () => {
            // Cleanup: stop video stream
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [imageMode, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                form.setValue('imageSrc', result, { shouldValidate: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImagePreview(dataUrl);
            form.setValue('imageSrc', dataUrl, { shouldValidate: true });
            setImageMode(null); // Go back to preview
        }
    };

    const onSubmit = async (data: z.infer<typeof productSchema>) => {
        setIsSubmitting(true);
        
        const categoryValue = data.subCategory.trim().toLowerCase();
        if (categoryValue && !categories.map(c => c.toLowerCase()).includes(categoryValue)) {
            addCategory(categoryValue);
        }

        const productData = {
            name: data.name,
            price: data.price,
            inventory: data.inventory,
            quantityUnit: data.quantityUnit,
            vendorId: 'general-store', // Hardcoded for this dashboard
            category: 'grocery', // Hardcoded for this dashboard
            subCategory: categoryValue,
            image: { 
                src: data.imageSrc, 
                alt: data.name,
                width: 400,
                height: 300,
                hint: data.name.toLowerCase().split(' ').slice(0, 2).join(' ')
            },
            keywords: data.keywords,
        };

        try {
            if (product) {
                await updateProduct(product.id, productData);
                toast({ title: "Product Updated", description: `${data.name} has been updated.` });
            } else {
                await addProduct(productData);
                toast({ title: "Product Added", description: `${data.name} has been added to the store.` });
            }
            setIsOpen(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save product." });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) setIsOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Fresh Milk" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        
                        <div className="flex gap-4">
                            <FormField control={form.control} name="price" render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="inventory" render={({ field }) => ( <FormItem className="w-24"><FormLabel>In Stock</FormLabel><FormControl><Input type="number" placeholder="e.g., 10" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        
                        <FormField control={form.control} name="quantityUnit" render={({ field }) => ( <FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g., 1 litre, 1 pc" {...field} /></FormControl><FormMessage /></FormItem> )} />

                        <FormField
                            control={form.control}
                            name="subCategory"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                    <Input
                                    placeholder="e.g., dairy, snacks, or a new category"
                                    {...field}
                                    list="grocery-categories-datalist"
                                    />
                                </FormControl>
                                <datalist id="grocery-categories-datalist">
                                    {categories.map((cat) => (
                                    <option key={cat} value={cat.charAt(0).toUpperCase() + cat.slice(1)} />
                                    ))}
                                </datalist>
                                <FormDescription>
                                    To add, rename, or delete categories, click the "Manage Categories" button on the products page.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="keywords"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Keywords</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., dairy, fresh, breakfast" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Add search keywords, separated by commas.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                         <Label>Product Image</Label>
                         <div className="aspect-video rounded-md border border-dashed flex items-center justify-center bg-muted/40 relative overflow-hidden">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Product preview" fill className="object-contain" />
                            ) : (
                                <span className="text-sm text-muted-foreground">Image Preview</span>
                            )}
                         </div>
                         {imageMode === 'camera' ? (
                            <div className="space-y-2">
                                 <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                                 {hasCameraPermission === false && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Camera Error</AlertTitle><AlertDescription>Could not access camera. Please check permissions.</AlertDescription></Alert>}
                                 <Button onClick={handleCapture} type="button" className="w-full" disabled={!hasCameraPermission}>Capture Image</Button>
                                 <Button variant="outline" type="button" onClick={() => setImageMode(null)} className="w-full">Back</Button>
                            </div>
                         ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" type="button" onClick={() => document.getElementById('file-upload')?.click()}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                                <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                <Button variant="outline" type="button" onClick={() => setImageMode('camera')}><Camera className="mr-2 h-4 w-4" /> Use Camera</Button>
                            </div>
                        )}
                         <FormField control={form.control} name="imageSrc" render={({ field }) => ( <FormItem><FormControl><Input type="hidden" {...field} /></FormControl><FormMessage className="mt-2" /></FormItem> )} />
                    </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{product ? 'Save Changes' : 'Add Product'}</Button>
            </form>
            </Form>
        </DialogContent>
        </Dialog>
    );
}
