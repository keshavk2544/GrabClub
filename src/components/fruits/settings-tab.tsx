'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Vendor } from '@/lib/types';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';


const allWeekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function FruitsSettingsTab() {
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();
    const [vendorId, setVendorId] = useState<string | null>(null);

    const vendorRef = useMemoFirebase(() => 
        firestore && vendorId ? doc(firestore, 'vendors', vendorId) : null
    , [firestore, vendorId]);
    const { data: vendor, isLoading: vendorLoading } = useDoc<Vendor>(vendorRef);
    
    const [openingTime, setOpeningTime] = useState('08:00');
    const [closingTime, setClosingTime] = useState('18:00');
    const [workingDays, setWorkingDays] = useState<string[]>([]);
    const [deliveryLocations, setDeliveryLocations] = useState<string[]>([]);
    const [deliveryTimes, setDeliveryTimes] = useState<string[]>([]);
    const [deliveryType, setDeliveryType] = useState<'grabclub' | 'self'>('grabclub');

     useEffect(() => {
        const id = sessionStorage.getItem('vendorId');
        setVendorId(id);
    }, []);

    useEffect(() => {
        if (vendor) {
            setOpeningTime(vendor.openingTime || '08:00');
            setClosingTime(vendor.closingTime || '18:00');
            setWorkingDays(vendor.workingDays || []);
            setDeliveryLocations(vendor.deliveryLocations || []);
            setDeliveryTimes(vendor.deliveryTimes || []);
            setDeliveryType(vendor.deliveryType || 'grabclub');
        }
    }, [vendor]);

    const handleSave = async () => {
        if (!vendorId || !firestore) return;
        const settings = {
            openingTime,
            closingTime,
            workingDays,
            deliveryLocations: deliveryLocations.filter(l => l && l.trim() !== ''),
            deliveryTimes: deliveryTimes.filter(t => t && t.trim() !== ''),
            deliveryType,
        };
        
        const vendorDocRef = doc(firestore, 'vendors', vendorId);
        await updateDoc(vendorDocRef, settings);

        toast({
            title: "Settings Saved",
            description: "Your operational settings have been updated.",
        });
    };
    
    const handleWorkingDayChange = (day: string, checked: boolean | string) => {
        setWorkingDays(prev => 
            checked ? [...prev, day] : prev.filter(item => item !== day)
        );
    };

    const handleDynamicListChange = (index: number, value: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const newList = [...list];
        newList[index] = value;
        setter(newList);
    };

    const addDynamicListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => [...prev, '']);
    };

    const removeDynamicListItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };

    const handleSignOut = () => {
        sessionStorage.removeItem('isFruitsVendor');
        sessionStorage.removeItem('vendorId');
        router.push('/login');
        toast({ title: 'Signed out successfully.' });
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Operational Hours</CardTitle>
                    <CardDescription>Set your store's opening times and working days.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="open-time">Opening Time</Label>
                            <Input id="open-time" type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="close-time">Closing Time</Label>
                            <Input id="close-time" type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <Label className="mb-2 block font-medium">Working Days</Label>
                        <div className="space-y-2">
                            {allWeekDays.map(day => (
                                <div key={day} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`day-${day}`} 
                                        checked={workingDays.includes(day)}
                                        onCheckedChange={(checked) => handleWorkingDayChange(day, checked)}
                                    />
                                    <label htmlFor={`day-${day}`} className="text-sm font-normal">{day}</label>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">If a day is unchecked, your store will show as "offline".</p>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Delivery Options</CardTitle>
                    <CardDescription>Choose delivery type and configure locations if applicable.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <Label className="mb-3 block font-medium">Delivery Type</Label>
                        <RadioGroup onValueChange={(value: 'grabclub' | 'self') => setDeliveryType(value)} value={deliveryType} className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="self" id="self-delivery" />
                                <Label htmlFor="self-delivery">Instant Delivery (Self)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="grabclub" id="grabclub-delivery" />
                                <Label htmlFor="grabclub-delivery">Scheduled Delivery (GrabClub)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    
                    <div>
                        <Label className="mb-3 block font-medium">Delivery Locations</Label>
                         <p className="text-xs text-muted-foreground mb-2">
                            {deliveryType === 'grabclub'
                                ? 'Pre-defined locations for scheduled drop-offs.'
                                : 'Define the areas/hostels you provide instant delivery to.'}
                        </p>
                        <div className="space-y-2">
                        {deliveryLocations.map((location, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input value={location} onChange={e => handleDynamicListChange(index, e.target.value, deliveryLocations, setDeliveryLocations)} placeholder="Enter a location..."/>
                                    <Button variant="ghost" size="icon" onClick={() => removeDynamicListItem(index, setDeliveryLocations)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full" onClick={() => addDynamicListItem(setDeliveryLocations)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Location
                            </Button>
                        </div>
                    </div>
                    
                    {deliveryType === 'grabclub' && (
                        <div>
                            <Label className="mb-3 block font-medium">Delivery Time Slots</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                The specific times you will deliver to the locations above.
                            </p>
                            <div className="space-y-2">
                                {deliveryTimes.map((time, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input value={time} onChange={e => handleDynamicListChange(index, e.target.value, deliveryTimes, setDeliveryTimes)} placeholder="e.g., 9:00 AM - 10:00 AM"/>
                                        <Button variant="ghost" size="icon" onClick={() => removeDynamicListItem(index, setDeliveryTimes)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" className="w-full" onClick={() => addDynamicListItem(setDeliveryTimes)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Time Slot
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="md:col-span-2">
                <Button onClick={handleSave} className="w-full">Save All Settings</Button>
            </div>
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Log out of your vendor account.</CardDescription>
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
