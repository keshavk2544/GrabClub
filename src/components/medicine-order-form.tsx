'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Type, CheckCircle, ArrowRight, Plus, Clock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MedicineRequest } from '@/lib/types';
import GrabClubLoading from './layout/loading';
import { vendors, commonMedicineCategories } from '@/lib/data';
import imageData from '@/lib/placeholder-images.json';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const formSchema = z.object({
    submissionType: z.enum(['upload', 'manual']),
    prescriptionFile: z.any().optional(),
    medicinesText: z.string().optional(),
    deliveryLocation: z.string({ required_error: 'Please select a delivery location.' }),
    deliveryTimeSlot: z.string({ required_error: 'Please select a delivery time slot.' }),
    receiverName: z.string().min(2, { message: "Please enter the receiver's name." }),
    phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
}).refine(data => {
    if (data.submissionType === 'upload') {
        return !!data.prescriptionFile;
    }
    if (data.submissionType === 'manual') {
        return !!data.medicinesText && data.medicinesText.trim().length > 0;
    }
    return false;
}, {
    message: 'Please either upload a prescription or enter medicine names.',
    path: ['submissionType'],
});

const triggerColors = [
    "data-[state=open]:bg-sky-500/20 text-sky-400 hover:bg-sky-500/10",
    "data-[state=open]:bg-lime-500/20 text-lime-400 hover:bg-lime-500/10",
    "data-[state=open]:bg-amber-500/20 text-amber-400 hover:bg-amber-500/10",
    "data-[state=open]:bg-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500/10",
    "data-[state=open]:bg-rose-500/20 text-rose-400 hover:bg-rose-500/10",
    "data-[state=open]:bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10",
];

export default function MedicineOrderForm() {
    const { toast } = useToast();
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    
    const [step, setStep] = useState(1);
    const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'submitted'>('idle');
    const [fileName, setFileName] = useState<string | null>(null);
    const [vendorSettings, setVendorSettings] = useState<{deliveryLocations: string[], deliveryTimes: string[]}>({ deliveryLocations: [], deliveryTimes: [] });
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upload');
    const [isOpen, setIsOpen] = useState(true);


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            submissionType: 'upload',
            medicinesText: '',
            receiverName: '',
            phone: '',
        },
    });
    
    useEffect(() => {
        const VENDOR_ID = 'pharmaplus';
        const SETTINGS_KEY = `grabclub-vendor-settings-${VENDOR_ID}`;
        const defaultVendor = vendors.find(v => v.id === VENDOR_ID);

        try {
            const savedSettingsJSON = window.localStorage.getItem(SETTINGS_KEY);
            if (savedSettingsJSON) {
                const settings = JSON.parse(savedSettingsJSON);
                setVendorSettings({
                    deliveryLocations: settings.deliveryLocations || defaultVendor?.deliveryLocations || [],
                    deliveryTimes: settings.deliveryTimes || defaultVendor?.deliveryTimes || [],
                });
            } else if (defaultVendor) {
                setVendorSettings({
                    deliveryLocations: defaultVendor.deliveryLocations || [],
                    deliveryTimes: defaultVendor.deliveryTimes || [],
                });
            }
        } catch (error) {
            console.error("Failed to load vendor settings", error);
            if (defaultVendor) {
                setVendorSettings({
                    deliveryLocations: defaultVendor.deliveryLocations || [],
                    deliveryTimes: defaultVendor.deliveryTimes || [],
                });
            }
        } finally {
            setIsSettingsLoading(false);
        }
    }, []);

    useEffect(() => {
        const VENDOR_ID = 'pharmaplus';
        const defaultVendor = vendors.find(v => v.id === VENDOR_ID);

        if (isSettingsLoading) return;

        let settings = {
            openingTime: vendorSettings.openingTime || defaultVendor?.openingTime,
            closingTime: vendorSettings.closingTime || defaultVendor?.closingTime,
            workingDays: vendorSettings.workingDays || defaultVendor?.workingDays,
        };

        if (!settings.openingTime || !settings.closingTime || !settings.workingDays || settings.workingDays.length === 0) {
            setIsOpen(true);
            return;
        }

        const checkOpenStatus = () => {
            const now = new Date();
            const timeZone = 'Asia/Kolkata';

            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone,
                weekday: 'long',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false,
            });

            const parts = formatter.formatToParts(now);
            const partsMap = parts.reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {} as Record<string, string>);

            const dayOfWeek = partsMap.weekday;
            const currentHour = parseInt(partsMap.hour, 10);
            const currentMinute = parseInt(partsMap.minute, 10);
            const currentTimeInMinutes = currentHour * 60 + currentMinute;

            if (!settings.workingDays!.includes(dayOfWeek)) {
                setIsOpen(false);
                return;
            }

            const [openHour, openMinute] = settings.openingTime!.split(':').map(Number);
            const [closeHour, closeMinute] = settings.closingTime!.split(':').map(Number);
            
            const openTimeInMinutes = openHour * 60 + openMinute;
            const closeTimeInMinutes = closeHour * 60 + closeMinute;

            if (closeTimeInMinutes <= openTimeInMinutes) {
                setIsOpen(currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes);
            } else {
                setIsOpen(currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes);
            }
        };

        checkOpenStatus();
        const intervalId = setInterval(checkOpenStatus, 60000);

        return () => clearInterval(intervalId);
    }, [isSettingsLoading, vendorSettings]);


    useEffect(() => {
      if (!isUserLoading && !user) {
        router.replace('/login');
      }
      if (user && !form.getValues('receiverName')) {
        form.setValue('receiverName', user.displayName || '');
      }
    }, [user, isUserLoading, router, form]);
    
    const handleNext = async () => {
        await form.trigger(['submissionType', 'prescriptionFile', 'medicinesText']);

        const values = form.getValues();
        const submissionType = values.submissionType;
        const medicinesText = values.medicinesText;
        const prescriptionFile = values.prescriptionFile;

        const isStep1Valid = (submissionType === 'upload' && !!prescriptionFile) || (submissionType === 'manual' && !!medicinesText && medicinesText.trim().length > 0);

        if (isStep1Valid) {
            form.clearErrors("submissionType");
            setStep(2);
        } else {
            form.setError("submissionType", {
                type: "manual",
                message: "Please either upload a prescription or enter medicine names.",
            });
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                form.setValue('prescriptionFile', reader.result, { shouldValidate: true });
            };
            reader.readAsDataURL(file);
        } else {
            setFileName(null);
            form.setValue('prescriptionFile', null);
        }
    };

    const handleAddItem = useCallback((itemName: string) => {
        setActiveTab('manual');
        form.setValue('submissionType', 'manual');
        const currentText = form.getValues('medicinesText') || '';
        const newText = currentText ? `${currentText}\n${itemName}` : itemName;
        form.setValue('medicinesText', newText, { shouldValidate: true });
        toast({
            title: "Item Added",
            description: `"${itemName}" has been added to your manual list.`,
        });
    }, [form, toast]);

    const getImageSrc = (id: string) => {
        return imageData.placeholderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/default/400/300';
    };


    const onSubmit = (data: z.infer<typeof formSchema>) => {
        if (!user || !user.email) {
            toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to submit a request.' });
            return;
        }

        setSubmissionState('submitting');
        
        const newRequest: MedicineRequest = {
            id: `MED-${Date.now()}`,
            userId: user.uid,
            userName: user.displayName || 'Unknown User',
            userEmail: user.email,
            phone: data.phone,
            submissionType: data.submissionType,
            prescriptionImage: data.prescriptionFile,
            medicinesText: data.medicinesText,
            deliveryLocation: data.deliveryLocation,
            deliveryTimeSlot: data.deliveryTimeSlot,
            receiverName: data.receiverName,
            status: 'pending-review',
            createdAt: new Date(),
        };

        console.log("New Medicine Request:", newRequest);
        
        try {
            const existingRequestsJSON = window.localStorage.getItem('grabclub-medicine-requests');
            const existingRequests: MedicineRequest[] = existingRequestsJSON ? JSON.parse(existingRequestsJSON) : [];
            const updatedRequests = [newRequest, ...existingRequests];
            window.localStorage.setItem('grabclub-medicine-requests', JSON.stringify(updatedRequests));

            setTimeout(() => {
                setSubmissionState('submitted');
            }, 1500);

        } catch (error) {
            console.error("Failed to save medicine request", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Could not submit your request.",
            });
            setSubmissionState('idle');
        }
    };
    
    if (isUserLoading || isSettingsLoading) return <GrabClubLoading />;
    
    if (submissionState === 'submitted') {
        return (
             <div className="container py-12 sm:py-16">
                <div className="max-w-2xl mx-auto text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
                        Request Submitted
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        A pharmacist will review your request and contact you shortly to confirm the order and payment details.
                    </p>
                    <Button onClick={() => {
                        setSubmissionState('idle');
                        setStep(1); // Reset to first step
                        form.reset();
                        setFileName(null);
                        if (user) form.setValue('receiverName', user.displayName || '');
                    }} className="mt-8">
                        Submit Another Request
                    </Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container py-12 sm:py-16">
            <div className="max-w-2xl mx-auto">
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
                        Order Medicines
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Upload a prescription or type the medicine names below.
                    </p>
                </div>
                 {!isOpen && (
                    <Alert variant="destructive" className="mb-6">
                        <Clock className="h-4 w-4" />
                        <AlertTitle>Pharmacy is Currently Closed</AlertTitle>
                        <AlertDescription>
                            You can prepare your request, but you won't be able to submit it until the pharmacy re-opens.
                        </AlertDescription>
                    </Alert>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Provide Medicine Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); form.setValue('submissionType', value as 'upload' | 'manual'); }} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4" /> Upload Prescription</TabsTrigger>
                                                <TabsTrigger value="manual"><Type className="mr-2 h-4 w-4" /> Type Manually</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="upload" className="pt-4">
                                                <FormField
                                                    control={form.control}
                                                    name="prescriptionFile"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input id="prescription-file" type="file" onChange={handleFileChange} accept="image/*,.pdf" disabled={submissionState === 'submitting'} />
                                                            </FormControl>
                                                            {fileName && <FormDescription>Selected: {fileName}</FormDescription>}
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                            </TabsContent>
                                            <TabsContent value="manual" className="pt-4">
                                                <FormField
                                                    control={form.control}
                                                    name="medicinesText"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="describe your problem or type the name of you required medicine"
                                                                    rows={4}
                                                                    {...field}
                                                                    disabled={submissionState === 'submitting'}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                            </TabsContent>
                                        </Tabs>
                                        <FormMessage className="pt-2">{form.formState.errors.submissionType?.message}</FormMessage>
                                    </CardContent>
                                </Card>

                                <Button type="button" onClick={handleNext} className="w-full mt-4" disabled={!isOpen}>
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>

                                <div>
                                    <h3 className="text-lg font-semibold text-center mb-4">Or select from common items</h3>
                                    <Accordion type="multiple" className="w-full space-y-2">
                                        {commonMedicineCategories.map((category, index) => (
                                            <AccordionItem value={category.name} key={category.name} className="border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm border-white/10">
                                                <AccordionTrigger className={cn("hover:no-underline px-4", triggerColors[index % triggerColors.length])}>{category.name}</AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-3 p-4 pt-2">
                                                        {category.items.map(item => (
                                                            <div key={item.name} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                                                                <div className="flex items-center gap-3">
                                                                    <Image src={getImageSrc(item.imageId)} alt={item.name} width={40} height={40} className="rounded-md object-cover" />
                                                                    <span>{item.name}</span>
                                                                </div>
                                                                <Button size="sm" variant="outline" onClick={() => handleAddItem(item.name)}>
                                                                    <Plus className="mr-2 h-4 w-4" /> Add
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Delivery Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="deliveryLocation"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Delivery Location</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={submissionState === 'submitting'}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a drop-off point" /></SelectTrigger></FormControl>
                                                    <SelectContent>{vendorSettings.deliveryLocations.map((location) => (<SelectItem key={location} value={location}>{location}</SelectItem>))}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="deliveryTimeSlot"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Preferred Delivery Time</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={submissionState === 'submitting'}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a time slot" /></SelectTrigger></FormControl>
                                                    <SelectContent>{vendorSettings.deliveryTimes.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="receiverName"
                                            render={({ field }) => (
                                                <FormItem><FormLabel>Receiver's Name</FormLabel><FormControl><Input placeholder="Enter the name of the person receiving the order" {...field} disabled={submissionState === 'submitting'} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Contact Number</FormLabel>
                                                <FormControl>
                                                    <InputOTP maxLength={10} {...field}>
                                                        <InputOTPGroup className="flex-wrap justify-center">
                                                            <InputOTPSlot index={0} />
                                                            <InputOTPSlot index={1} />
                                                            <InputOTPSlot index={2} />
                                                            <InputOTPSlot index={3} />
                                                            <InputOTPSlot index={4} />
                                                            <InputOTPSlot index={5} />
                                                            <InputOTPSlot index={6} />
                                                            <InputOTPSlot index={7} />
                                                            <InputOTPSlot index={8} />
                                                            <InputOTPSlot index={9} />
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                                
                                <div className="flex flex-col-reverse sm:flex-row gap-4">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>
                                        Back
                                    </Button>
                                    <Button type="submit" className="w-full" disabled={submissionState === 'submitting' || isSettingsLoading || !isOpen}>
                                        {submissionState === 'submitting' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting Request...</> : 'Submit Request' }
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </Form>
            </div>
        </div>
    );
}
