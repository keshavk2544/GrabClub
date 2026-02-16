'use client';
import { useState, useMemo } from 'react';
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
import { MoreHorizontal, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Order } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

export default function AdminUsersTab() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<UserProfile | null>(null);
  
  const usersQuery = useMemoFirebase(() => 
    firestore ? collection(firestore, 'users') : null
  , [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !selectedUserForHistory) return null;
    return query(collection(firestore, 'orders'), where('customerEmail', '==', selectedUserForHistory.email));
  }, [firestore, selectedUserForHistory]);
  const { data: userOrders, isLoading: ordersLoading } = useCollection<Order>(ordersQuery);

  
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery) {
      return users;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return users.filter(user =>
      (user.displayName && user.displayName.toLowerCase().includes(lowercasedQuery)) ||
      (user.email && user.email.toLowerCase().includes(lowercasedQuery))
    );
  }, [users, searchQuery]);


  const handleStatusToggle = async (userId: string, currentStatus: 'active' | 'blocked') => {
    if (!firestore) return;
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const userRef = doc(firestore, 'users', userId);
    try {
      await updateDoc(userRef, { status: newStatus });
      toast({ title: 'Status Updated', description: `User has been ${newStatus}.` });
    } catch (error) {
      console.error('Failed to update user status', error);
      toast({
          variant: "destructive",
          title: "Error",
          description: "Could not update user status.",
      });
    }
  };

  const handleViewHistory = (user: UserProfile) => {
    setSelectedUserForHistory(user);
    setIsHistoryDialogOpen(true);
  };
  
  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
          />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersLoading && (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading users...</TableCell></TableRow>
            )}
            {!usersLoading && filteredUsers.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                    {user.status || 'active'}
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
                      <DropdownMenuItem onClick={() => handleViewHistory(user)}>View Order History</DropdownMenuItem>
                      {user.status !== 'blocked' ? (
                        <DropdownMenuItem onClick={() => handleStatusToggle(user.uid, 'active')} className="text-destructive">Block User</DropdownMenuItem>
                      ) : (
                         <DropdownMenuItem onClick={() => handleStatusToggle(user.uid, 'blocked')}>Unblock User</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!usersLoading && filteredUsers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No users found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Order History for {selectedUserForHistory?.displayName}</DialogTitle>
                <DialogDescription>{selectedUserForHistory?.email}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4 py-4">
                    {ordersLoading ? <p>Loading history...</p> : userOrders && userOrders.length > 0 ? userOrders.map(order => (
                        <div key={order.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-sm">Order #{order.id.split('-').pop()}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(order.orderTime as any).toLocaleString()}</p>
                                </div>
                                <Badge variant={order.status === 'rejected' ? 'destructive' : order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">{order.status}</Badge>
                            </div>
                            <Separator className="my-2" />
                            <div className="space-y-1 text-xs">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between">
                                        <span>{item.name} x{item.quantity}</span>
                                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-end font-bold text-sm">
                                Total: ₹{order.total.toFixed(2)}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-muted-foreground py-8">No orders found for this user.</p>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>
  );
}
