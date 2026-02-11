'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import type { Complaint, Coupon } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';


const couponSchema = z.object({
  code: z.string().min(4, "Code must be at least 4 characters long.").refine(s => !/\s/.test(s), "Code cannot contain spaces."),
  usageLimit: z.coerce.number().int().min(1, "Usage limit must be at least 1."),
});


export default function AdminSettingsTab() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const complaintsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'complaints')) : null
    , [firestore]);
    const { data: complaints, isLoading: complaintsLoading } = useCollection<Complaint>(complaintsQuery);

    const sortedComplaints = useMemo(() => {
        if (!complaints) return [];
        return [...complaints].sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    }, [complaints]);

    const couponsQuery = useMemoFirebase(() =>
        firestore ? collection(firestore, 'coupons') : null
    , [firestore]);
    const { data: coupons, isLoading: couponsLoading } = useCollection<Coupon>(couponsQuery);
    
    const [isComplaintsDialogOpen, setIsComplaintsDialogOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Complaint | null>(null);
    const [replyMessage, setReplyMessage] = useState('');

    const couponForm = useForm<z.infer<typeof couponSchema>>({
      resolver: zodResolver(couponSchema),
      defaultValues: {
        code: "",
        usageLimit: 1,
      },
    });

    const handleMarkAsResolved = async (complaintId: string) => {
        if (!firestore) return;
        const complaintRef = doc(firestore, 'complaints', complaintId);
        await updateDoc(complaintRef, { status: 'resolved' });
        toast({
            title: 'Complaint Resolved',
            description: 'The complaint has been marked as resolved.',
        });
    };

    const handleSendMessageClick = (complaint: Complaint) => {
        setReplyingTo(complaint);
        setReplyMessage(complaint.adminReply || '');
    };

    const handleSendReply = async () => {
        if (!replyingTo || !replyMessage.trim() || !firestore) return;
        const complaintRef = doc(firestore, 'complaints', replyingTo.id);
        await updateDoc(complaintRef, { adminReply: replyMessage.trim() });
        
        toast({
            title: 'Reply Sent',
            description: 'The user will see your message on their profile page.',
        });

        setReplyingTo(null);
        setReplyMessage('');
    };

    const handleCreateCoupon = async (values: z.infer<typeof couponSchema>) => {
      if (!firestore) return;

      const newCoupon = {
          code: values.code.toUpperCase(),
          usageLimit: values.usageLimit,
          timesUsed: 0,
      };

      await addDoc(collection(firestore, 'coupons'), newCoupon);
      
      toast({
          title: "Coupon Created",
          description: `Code "${newCoupon.code}" created with ${newCoupon.usageLimit} uses.`,
      });
      couponForm.reset();
    };

    const handleDeleteCoupon = async (couponId: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, 'coupons', couponId));
        toast({
            title: "Coupon Deleted",
            description: "The coupon has been removed.",
        });
    };
  
    return (
        <>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Support</CardTitle>
                        <CardDescription>Manage complaints and support issues.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <h3 className="text-base font-semibold mb-2">Complaints Panel</h3>
                            <Button variant="secondary" className="w-full" onClick={() => setIsComplaintsDialogOpen(true)}>
                                {complaintsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                View Complaints
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Coupon Management</CardTitle>
                        <CardDescription>Create and manage discount codes for free delivery.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Form {...couponForm}>
                            <form onSubmit={couponForm.handleSubmit(handleCreateCoupon)} className="flex items-end gap-2">
                                <FormField control={couponForm.control} name="code" render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Code</FormLabel><FormControl><Input placeholder="e.g., FREEDEL" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={couponForm.control} name="usageLimit" render={({ field }) => ( <FormItem className="w-24"><FormLabel>Uses</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <Button type="submit" disabled={couponForm.formState.isSubmitting}>
                                    {couponForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Create
                                </Button>
                            </form>
                        </Form>
                        <Separator />
                        <div className="space-y-2">
                            <h3 className="text-base font-semibold">Existing Coupons</h3>
                             <div className="rounded-md border max-h-60 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Usage</TableHead>
                                            <TableHead className="text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {couponsLoading ? (
                                            <TableRow><TableCell colSpan={3} className="text-center h-24">Loading coupons...</TableCell></TableRow>
                                        ) : coupons && coupons.length > 0 ? coupons.map((coupon) => (
                                            <TableRow key={coupon.id}>
                                                <TableCell className="font-mono">{coupon.code}</TableCell>
                                                <TableCell>{coupon.timesUsed} / {coupon.usageLimit}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCoupon(coupon.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={3} className="text-center h-24">No coupons created yet.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isComplaintsDialogOpen} onOpenChange={setIsComplaintsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Customer Complaints</DialogTitle>
                        <DialogDescription>
                            Review and resolve customer issues.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 overflow-y-auto pr-4">
                        {sortedComplaints && sortedComplaints.length > 0 ? sortedComplaints.map(complaint => (
                            <div key={complaint.id} className="p-4 border rounded-lg bg-card shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{complaint.userName}</p>
                                        <p className="text-sm text-muted-foreground">{complaint.userEmail}</p>
                                        <p className="text-sm text-muted-foreground">Order: {complaint.orderCode}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={complaint.status === 'open' ? 'destructive' : 'default'} className="capitalize">{complaint.status}</Badge>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(complaint.createdAt as any), { addSuffix: true })}</p>
                                    </div>
                                </div>
                                <Separator className="my-3" />
                                <p className="text-sm">{complaint.complaint}</p>
                                
                                {complaint.adminReply && (
                                    <div className="mt-3 border-t pt-3">
                                        <p className="text-xs font-semibold text-primary">Your Reply:</p>
                                        <p className="text-sm text-muted-foreground">{complaint.adminReply}</p>
                                    </div>
                                )}

                                {complaint.status === 'open' && (
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleSendMessageClick(complaint)}>
                                            {complaint.adminReply ? 'Edit Reply' : 'Send Message'}
                                        </Button>
                                        <Button size="sm" onClick={() => handleMarkAsResolved(complaint.id)}>Mark as Resolved</Button>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">No complaints found.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!replyingTo} onOpenChange={(open) => !open && setReplyingTo(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reply to {replyingTo?.userName}</DialogTitle>
                        <DialogDescription>
                            Your message will be visible to the user on their profile page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <p className="text-sm font-semibold">Original Complaint:</p>
                        <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">{replyingTo?.complaint}</p>
                    </div>
                    <Textarea
                        placeholder="Type your reply here..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={4}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
                        <Button onClick={handleSendReply}>Send Message</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
