'use client';

import { useState, useMemo } from 'react';
import { categories } from '@/lib/data';
import type { Vendor } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Pencil, Eye, EyeOff, PlusCircle, Upload, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

const vendorFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  userId: z.string().min(1, { message: 'User ID cannot be empty.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
  imageSrc: z.string().min(1, { message: "An image is required." }),
  deliveryType: z.enum(['grabclub', 'self']),
  deliveryCharge: z.coerce.number().min(0, { message: "Delivery charge cannot be negative." }).optional(),
});

const addVendorFormSchema = vendorFormSchema;

const categoryColorClasses: { [key: string]: { trigger: string, item: string } } = {
  food:       { trigger: 'text-orange-500', item: 'border-orange-500/30' },
  grocery:    { trigger: 'text-green-500', item: 'border-green-500/30' },
  fruits:     { trigger: 'text-red-500', item: 'border-red-500/30' },
  vegetables: { trigger: 'text-lime-500', item: 'border-lime-500/30' },
  bakery:     { trigger: 'text-yellow-500', item: 'border-yellow-500/30' },
  sweets:     { trigger: 'text-fuchsia-500', item: 'border-fuchsia-500/30' },
  medicine:   { trigger: 'text-sky-500', item: 'border-sky-500/30' },
  'cyber-cafe': { trigger: 'text-indigo-500', item: 'border-indigo-500/30' },
};


export default function AdminVendorsTab() {
  const firestore = useFirestore();
  const vendorsQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'vendors') : null
  , [firestore]);
  const { data: vendors, isLoading } = useCollection<Vendor>(vendorsQuery);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  
  const editForm = useForm<z.infer<typeof vendorFormSchema>>({
    resolver: zodResolver(vendorFormSchema),
  });
  
  const addForm = useForm<z.infer<typeof addVendorFormSchema>>({
    resolver: zodResolver(addVendorFormSchema),
    defaultValues: {
      name: '',
      description: '',
      userId: '',
      password: '',
      imageSrc: '',
      deliveryType: 'grabclub',
      deliveryCharge: 50,
    },
  });

  const vendorsByCategory = useMemo(() => {
    if (!vendors) return categories.map(category => ({ ...category, vendors: [] }));
    return categories.map(category => ({
      ...category,
      vendors: vendors.filter(vendor => vendor.category === category.id),
    }));
  }, [vendors]);

  const handleAddFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setImagePreview(result);
            addForm.setValue('imageSrc', result, { shouldValidate: true });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setImagePreview(result);
            editForm.setValue('imageSrc', result, { shouldValidate: true });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleStatusToggle = async (vendorId: string, currentStatus: string) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const vendorRef = doc(firestore, 'vendors', vendorId);
    await updateDoc(vendorRef, { status: newStatus });
    toast({
      title: 'Vendor Updated',
      description: `Vendor has been set to ${newStatus}.`,
    });
  };

  const handleEditClick = (vendor: Vendor) => {
    setEditingVendor(vendor);
    editForm.reset({
      name: vendor.name,
      description: vendor.description,
      userId: vendor.userId || '',
      password: vendor.password || '',
      imageSrc: vendor.image.src,
      deliveryType: vendor.deliveryType || 'grabclub',
      deliveryCharge: vendor.deliveryCharge,
    });
    setImagePreview(vendor.image.src);
    setShowPassword(false);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteDialogOpen(true);
    setDeletePassword('');
  };

  const handleDeleteVendor = async () => {
    if (deletePassword !== 'keshav2544') {
        toast({
            variant: 'destructive',
            title: 'Incorrect Password',
            description: 'The password provided is incorrect.',
        });
        return;
    }
    if (!vendorToDelete || !firestore) return;
    
    await deleteDoc(doc(firestore, 'vendors', vendorToDelete.id));

    toast({
        title: 'Vendor Deleted',
        description: `"${vendorToDelete.name}" has been permanently removed.`,
    });

    setIsDeleteDialogOpen(false);
    setVendorToDelete(null);
  }

  const onEditSubmit = async (values: z.infer<typeof vendorFormSchema>) => {
    if (!editingVendor || !firestore) return;

    const vendorRef = doc(firestore, 'vendors', editingVendor.id);
    await updateDoc(vendorRef, { 
        name: values.name,
        description: values.description,
        userId: values.userId,
        password: values.password,
        deliveryType: values.deliveryType,
        deliveryCharge: values.deliveryCharge,
        image: {
            ...editingVendor.image,
            src: values.imageSrc,
            alt: values.name,
        }
    });

    toast({
      title: 'Vendor Saved',
      description: `${values.name} has been updated.`,
    });
    setIsEditDialogOpen(false);
    setEditingVendor(null);
  };
  
  const onAddSubmit = async (values: z.infer<typeof addVendorFormSchema>) => {
    if (!firestore) return;

    const newVendorData: Omit<Vendor, 'id'> = {
      name: values.name,
      description: values.description,
      userId: values.userId,
      password: values.password,
      category: 'food', // Hardcoded for now
      status: 'active',
      deliveryType: values.deliveryType,
      deliveryCharge: values.deliveryCharge,
      image: {
        src: values.imageSrc,
        width: 400,
        height: 300,
        alt: values.name,
        hint: values.name.toLowerCase().split(' ').slice(0, 2).join(' '),
      },
      openingTime: '09:00',
      closingTime: '22:00',
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      deliveryLocations: [],
      deliveryTimes: [],
    };

    await addDoc(collection(firestore, 'vendors'), newVendorData);

    toast({
      title: 'Vendor Added',
      description: `${values.name} has been added to Food Services.`,
    });
    setIsAddDialogOpen(false);
    addForm.reset();
    setImagePreview(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
          <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Food Vendor
          </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <Accordion type="multiple" className="w-full space-y-2">
            {vendorsByCategory.map(category => (
            <AccordionItem value={category.id} key={category.id} className={cn("bg-card/50 rounded-lg border", categoryColorClasses[category.id]?.item || 'border-border')}>
                <AccordionTrigger className={cn(
                    "text-xl font-bold hover:no-underline px-4",
                    categoryColorClasses[category.id]?.trigger
                )}>
                    <div className="flex items-center gap-3">
                        <category.icon className="w-6 h-6" />
                        {category.name} Services ({category.vendors.length})
                    </div>
                </AccordionTrigger>
                <AccordionContent className="border-t pt-4">
                {category.vendors.length > 0 ? (
                    <div className="space-y-3 px-4">
                    {category.vendors.map(vendor => (
                        <div key={vendor.id} className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
                        <div className="flex items-center gap-4">
                            <Image src={vendor.image.src} alt={vendor.name} width={48} height={48} className="rounded-md object-cover aspect-square" />
                            <div>
                            <p className="font-semibold">{vendor.name}</p>
                            <div className="flex items-center gap-2">
                                <Badge variant={vendor.status === 'active' ? 'default' : 'destructive'} className={vendor.status === 'active' ? 'bg-green-600' : ''}>
                                    {vendor.status}
                                </Badge>
                            </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-2">
                            <Switch
                                id={`status-${vendor.id}`}
                                checked={vendor.status === 'active'}
                                onCheckedChange={(checked) => handleStatusToggle(vendor.id, vendor.status)}
                                aria-label={`Toggle status for ${vendor.name}`}
                            />
                            <label htmlFor={`status-${vendor.id}`} className="text-sm font-medium hidden sm:block">{vendor.status === 'active' ? 'Active' : 'Inactive'}</label>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => handleEditClick(vendor)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit {vendor.name}</span>
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(vendor)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete {vendor.name}</span>
                            </Button>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center px-4">No vendors found in this category.</p>
                )}
                </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>
      )}

      {/* Dialogs remain the same */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
              setImagePreview(null);
          }
          setIsEditDialogOpen(open);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vendor: {editingVendor?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={editForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={editForm.control} name="userId" render={({ field }) => ( <FormItem><FormLabel>User ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
               <FormField control={editForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type={showPassword ? 'text' : 'password'} {...field} className="pr-10" />
                      </FormControl>
                      <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

              <FormField control={editForm.control} name="deliveryType" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Delivery Type</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="grabclub" /></FormControl>
                        <FormLabel className="font-normal">GrabClub Delivery</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="self" /></FormControl>
                        <FormLabel className="font-normal">Self Delivery</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={editForm.control} name="deliveryCharge" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Charge (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50.00" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="space-y-2">
                  <FormLabel>Vendor Image</FormLabel>
                  <div className="aspect-video rounded-md border border-dashed flex items-center justify-center bg-muted/40 relative overflow-hidden">
                  {imagePreview ? (
                      <Image src={imagePreview} alt="Vendor preview" fill className="object-contain" />
                  ) : (
                      <span className="text-sm text-muted-foreground">Image Preview</span>
                  )}
                  </div>
                  <Button variant="outline" type="button" onClick={() => document.getElementById('vendor-image-edit-upload')?.click()} className="w-full">
                      <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </Button>
                  <Input id="vendor-image-edit-upload" type="file" accept="image/*" className="hidden" onChange={handleEditFileChange} />
                  <FormField control={editForm.control} name="imageSrc" render={({ field }) => ( <FormItem><FormControl><Input type="hidden" {...field} /></FormControl><FormMessage className="mt-2" /></FormItem> )} />
              </div>

              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) {
              addForm.reset();
              setImagePreview(null);
          }
          setIsAddDialogOpen(open);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Food Vendor</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField control={addForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input {...field} placeholder="e.g., Spicy Spoon" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={addForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="e.g., Authentic Indian cuisine" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={addForm.control} name="userId" render={({ field }) => ( <FormItem><FormLabel>User ID</FormLabel><FormControl><Input {...field} placeholder="e.g., spon123" /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={addForm.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} placeholder="e.g., strongpassword" /></FormControl><FormMessage /></FormItem> )} />
              
              <FormField control={addForm.control} name="deliveryType" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Delivery Type</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="grabclub" /></FormControl>
                        <FormLabel className="font-normal">GrabClub Delivery</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="self" /></FormControl>
                        <FormLabel className="font-normal">Self Delivery</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
               <FormField control={addForm.control} name="deliveryCharge" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Charge (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50.00" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="space-y-2">
                  <FormLabel>Vendor Image</FormLabel>
                  <div className="aspect-video rounded-md border border-dashed flex items-center justify-center bg-muted/40 relative overflow-hidden">
                  {imagePreview ? (
                      <Image src={imagePreview} alt="Vendor preview" fill className="object-contain" />
                  ) : (
                      <span className="text-sm text-muted-foreground">Image Preview</span>
                  )}
                  </div>
                  <Button variant="outline" type="button" onClick={() => document.getElementById('vendor-image-upload')?.click()} className="w-full">
                      <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </Button>
                  <Input id="vendor-image-upload" type="file" accept="image/*" className="hidden" onChange={handleAddFileChange} />
                  <FormField control={addForm.control} name="imageSrc" render={({ field }) => ( <FormItem><FormControl><Input type="hidden" {...field} /></FormControl><FormMessage className="mt-2" /></FormItem> )} />
              </div>

              <Button type="submit" className="w-full">Add Vendor</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete {vendorToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
                This action is permanent. To confirm deletion, please type the admin password below.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <Input 
                id="delete-password"
                type="password"
                placeholder="Admin Password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="off"
            />
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVendorToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteVendor} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete Vendor
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
