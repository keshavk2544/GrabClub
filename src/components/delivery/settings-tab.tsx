'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function DeliverySettingsTab() {
    const { toast } = useToast();
    const router = useRouter();

    const handleSignOut = () => {
        sessionStorage.removeItem('isDeliveryPerson');
        sessionStorage.removeItem('deliveryPersonId');
        router.push('/login');
        toast({ title: 'Signed out successfully.' });
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Log out of your delivery account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
