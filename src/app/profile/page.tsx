'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import GrabClubLoading from '@/components/layout/loading';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Order, Complaint } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import BlockedUserGuard from '@/components/blocked-user-guard';

const complaintSchema = z.object({
  orderCode: z.string().min(1, { message: "Please enter the order code." }),
  complaint: z.string().min(10, {
    message: "Please describe your issue in at least 10 characters.",
  }),
});

function ProfilePageContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth();
  const { toast } = useToast();
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const complaintForm = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      orderCode: "",
      complaint: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    
    // Load orders from localStorage for complaint validation
    try {
        const storedOrders = window.localStorage.getItem('grabclub-orders');
        if (storedOrders) {
            setOrders(JSON.parse(storedOrders));
        }
    } catch (error) {
        console.error("Failed to load orders for complaint validation.", error);
    }

    // Load user's complaints from localStorage
    try {
        const storedComplaints = window.localStorage.getItem('grabclub-complaints');
        if (storedComplaints) {
            const allComplaints: Complaint[] = JSON.parse(storedComplaints).map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt),
            }));
            setUserComplaints(
                allComplaints
                    .filter(c => c.userEmail === user.email)
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            );
        }
    } catch (error) {
        console.error("Failed to load user complaints.", error);
    }

    const complaintCode = searchParams.get('complaint_code');
    if (complaintCode) {
        setShowComplaintForm(true);
        complaintForm.setValue('orderCode', complaintCode);
    }
  }, [user, searchParams, complaintForm]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  function onComplaintSubmit(data: z.infer<typeof complaintSchema>) {
    // Validate order code
    const orderExists = orders.some(order => order.verificationCode === data.orderCode || order.id === data.orderCode);

    if (!orderExists) {
        toast({
            variant: "destructive",
            title: "Invalid Order Code",
            description: "No order found with that code. Please check the code and try again.",
        });
        return;
    }

    const newComplaint: Complaint = {
        id: `COMP-${Date.now()}`,
        orderCode: data.orderCode,
        complaint: data.complaint,
        userEmail: user!.email!,
        userName: user!.displayName || 'Anonymous User',
        createdAt: new Date(),
        status: 'open',
    };

    try {
        const existingComplaintsJSON = window.localStorage.getItem('grabclub-complaints');
        const existingComplaints: Complaint[] = existingComplaintsJSON ? JSON.parse(existingComplaintsJSON) : [];
        const updatedComplaints = [newComplaint, ...existingComplaints];
        window.localStorage.setItem('grabclub-complaints', JSON.stringify(updatedComplaints));
        
        setUserComplaints(prev => [newComplaint, ...prev].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

        toast({
          title: "Complaint Submitted",
          description: "We have received your complaint and will look into it shortly.",
          variant: 'success',
        });
        complaintForm.reset();
        setShowComplaintForm(false);

    } catch (error) {
        console.error("Failed to save complaint", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not submit your complaint.",
        });
    }
  }

  if (!user) {
    // This state should be brief as the guard handles the main loading.
    return <GrabClubLoading />;
  }

  const userInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?');

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-headline font-bold">{user.displayName}</h1>
            <p className="mt-2 text-muted-foreground">{user.email}</p>
            <Button onClick={handleSignOut} variant="outline" className="mt-6">
                Sign Out
            </Button>
        </div>

        {showComplaintForm ? (
          <Card>
              <CardHeader>
                  <CardTitle>Raise a Complaint</CardTitle>
                  <CardDescription>Having an issue with an order? Let us know.</CardDescription>
              </CardHeader>
              <Form {...complaintForm}>
                  <form onSubmit={complaintForm.handleSubmit(onComplaintSubmit)}>
                      <CardContent className="space-y-6">
                          <FormField
                              control={complaintForm.control}
                              name="orderCode"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Order Code</FormLabel>
                                  <FormControl>
                                      <Input placeholder="Enter order ID or 4-digit verification code" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                      You can find this code in your order history.
                                  </FormDescription>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={complaintForm.control}
                              name="complaint"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Explain the Problem</FormLabel>
                                  <FormControl>
                                      <Textarea
                                          placeholder="Please provide details about the issue..."
                                          rows={5}
                                          {...field}
                                      />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </CardContent>
                      <CardFooter className="flex justify-between">
                           <Button type="submit" disabled={complaintForm.formState.isSubmitting}>
                              {complaintForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Submit Complaint
                          </Button>
                          <Button variant="ghost" onClick={() => setShowComplaintForm(false)}>Cancel</Button>
                      </CardFooter>
                  </form>
              </Form>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <Button onClick={() => {setShowComplaintForm(true);}} className="w-full">
                Raise a Complaint
            </Button>
          </div>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Complaint History</CardTitle>
                <CardDescription>View your past complaints and their status.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" variant="secondary" onClick={() => setIsHistoryDialogOpen(true)}>
                    View Complaint History
                </Button>
            </CardContent>
        </Card>
      </div>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
                <DialogTitle>Your Complaint History</DialogTitle>
                <DialogDescription>
                    Here you can see the status of your complaints and any replies from our team.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto pr-4">
                {userComplaints.length > 0 ? (
                    userComplaints.map(complaint => (
                        <div key={complaint.id} className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">Order: #{complaint.orderCode}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(complaint.createdAt).toLocaleString()}</p>
                                </div>
                                <Badge variant={complaint.status === 'resolved' ? 'default' : 'destructive'} className="capitalize">{complaint.status}</Badge>
                            </div>
                            <Separator className="my-3" />
                            <p className="text-sm font-medium">Your complaint:</p>
                            <p className="text-sm text-muted-foreground mb-3">{complaint.complaint}</p>
                            
                            {complaint.adminReply && (
                                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                                    <p className="text-sm font-semibold text-primary">Admin Reply:</p>
                                    <p className="text-sm text-primary/80">{complaint.adminReply}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground py-8">You have not submitted any complaints.</p>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
    return (
        <BlockedUserGuard>
            <ProfilePageContent />
        </BlockedUserGuard>
    );
}
