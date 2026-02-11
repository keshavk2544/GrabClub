'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { DeliveryPerson } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const deliveryPersonSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  contactNumber: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number."),
  userId: z.string().min(3, "User ID must be at least 3 characters long."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

const editDeliveryPersonSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  contactNumber: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number."),
  userId: z.string().min(3, "User ID must be at least 3 characters long."),
  password: z.string().optional(),
}).refine(data => !data.password || data.password.length >= 6, {
    message: "Password must be at least 6 characters if provided.",
    path: ["password"],
});


export default function AdminDeliveryTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DeliveryPerson | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const deliveryPeopleQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'deliveryPeople') : null
  , [firestore]);
  const { data: deliveryPeople, isLoading } = useCollection<DeliveryPerson>(deliveryPeopleQuery);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<DeliveryPerson | null>(null);
  const [deletePassword, setDeletePassword] = useState('');

  const form = useForm<z.infer<typeof deliveryPersonSchema>>({
    resolver: zodResolver(deliveryPersonSchema),
    defaultValues: {
      name: "",
      contactNumber: "",
      userId: "",
      password: "",
    },
  });

  const editForm = useForm<z.infer<typeof editDeliveryPersonSchema>>({
    resolver: zodResolver(editDeliveryPersonSchema),
  });

  const handleStatusToggle = async (person: DeliveryPerson) => {
      if (!firestore) return;
      const newStatus = person.status === 'active' ? 'inactive' : 'active';
      const personRef = doc(firestore, 'deliveryPeople', person.id);
      await updateDoc(personRef, { status: newStatus });
      toast({
          title: 'Status Updated',
          description: `${person.name}'s status has been changed to ${newStatus}.`,
      });
  };
  
  const onAddPersonSubmit = async (values: z.infer<typeof deliveryPersonSchema>) => {
    if (!firestore) return;

    const newPerson = {
        name: values.name,
        contactNumber: values.contactNumber,
        userId: values.userId,
        password: values.password, // Note: Storing plaintext passwords is not secure for production.
        status: 'active' as const,
    };
    
    await addDoc(collection(firestore, 'deliveryPeople'), newPerson);

    toast({
        title: "Delivery Person Added",
        description: `${values.name} can now log in using the created credentials.`,
    });

    setIsAddDialogOpen(false);
    form.reset();
  };

  const handleEditClick = (person: DeliveryPerson) => {
    setEditingPerson(person);
    editForm.reset({
        name: person.name,
        contactNumber: person.contactNumber,
        userId: person.userId,
        password: '',
    });
    setIsEditDialogOpen(true);
  };

  const onEditPersonSubmit = async (values: z.infer<typeof editDeliveryPersonSchema>) => {
    if (!editingPerson || !firestore) return;

    const personRef = doc(firestore, 'deliveryPeople', editingPerson.id);
    
    const updatedData: Partial<DeliveryPerson> = {
        name: values.name,
        contactNumber: values.contactNumber,
        userId: values.userId,
    };

    if (values.password && values.password.length > 0) {
        updatedData.password = values.password;
    }

    await updateDoc(personRef, updatedData);

    toast({
        title: "Delivery Person Updated",
        description: `${values.name}'s details have been updated.`,
    });

    setIsEditDialogOpen(false);
    setEditingPerson(null);
  };
  
  const handleDeleteClick = (person: DeliveryPerson) => {
    setPersonToDelete(person);
    setIsDeleteDialogOpen(true);
    setDeletePassword('');
  };

  const handleDeletePerson = async () => {
    if (deletePassword !== 'keshav2544') {
        toast({
            variant: 'destructive',
            title: 'Incorrect Password',
            description: 'The password provided is incorrect.',
        });
        return;
    }
    if (!personToDelete || !firestore) return;
    
    await deleteDoc(doc(firestore, 'deliveryPeople', personToDelete.id));

    toast({
        title: 'Delivery Person Deleted',
        description: `"${personToDelete.name}" has been permanently removed.`,
    });

    setIsDeleteDialogOpen(false);
    setPersonToDelete(null);
  }


  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold">Delivery Personnel</h2>
                <p className="text-muted-foreground">Manage your delivery team.</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Person
            </Button>
        </div>
        <div className="rounded-md border">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
            {!isLoading && deliveryPeople?.map((person) => (
                <TableRow key={person.id}>
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell>{person.contactNumber}</TableCell>
                <TableCell>{person.userId}</TableCell>
                <TableCell>
                    <Badge variant={person.status === 'active' ? 'default' : 'destructive'} className={person.status === 'active' ? 'bg-green-600' : ''}>
                    {person.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(person)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusToggle(person)}>
                            {person.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(person)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (!open) {
                form.reset();
            }
            setIsAddDialogOpen(open);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Delivery Person</DialogTitle>
                    <DialogDescription>
                        Create a new account for a delivery person. They will use the User ID and Password to log in.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onAddPersonSubmit)} className="space-y-4 py-2">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Rohan Sharma" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="contactNumber" render={({ field }) => ( <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="10-digit mobile number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="userId" render={({ field }) => ( <FormItem><FormLabel>User ID</FormLabel><FormControl><Input placeholder="e.g., rohan@delivery" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Create a strong password" {...field} /></FormControl><FormMessage /></FormItem> )} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Add Person
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            if (!open) {
                editForm.reset();
                setEditingPerson(null);
            }
            setIsEditDialogOpen(open);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Delivery Person</DialogTitle>
                    <DialogDescription>
                        Update the details for {editingPerson?.name}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditPersonSubmit)} className="space-y-4 py-2">
                        <FormField control={editForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Rohan Sharma" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={editForm.control} name="contactNumber" render={({ field }) => ( <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="10-digit mobile number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={editForm.control} name="userId" render={({ field }) => ( <FormItem><FormLabel>User ID</FormLabel><FormControl><Input placeholder="e.g., rohan@delivery" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={editForm.control} name="password" render={({ field }) => ( <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" placeholder="Leave blank to keep current password" {...field} /></FormControl><FormMessage /></FormItem> )} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.formState.isSubmitting}>
                                {editForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete {personToDelete?.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action is permanent and cannot be undone. To confirm deletion, please type the admin password below.
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
                <AlertDialogCancel onClick={() => setPersonToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                onClick={handleDeletePerson} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    Delete Permanently
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    