'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/firebase/auth/use-user';
import type { PrintRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, FileText, Loader2, Printer } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { vendors } from '@/lib/data';
import GrabClubLoading from './layout/loading';

// Configure the worker source for pdf.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const printJobSchema = z.object({
  file: z.any().refine(file => file instanceof File, { message: "A PDF file is required." }),
  printType: z.enum(['bw', 'color']),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  pickupLocation: z.string({ required_error: 'Please select a pickup location.' }),
  pickupTimeSlot: z.string({ required_error: 'Please select a pickup time slot.' }),
});


export default function CyberCafePrintForm() {
    const { toast } = useToast();
    const { user, isLoading: isUserLoading } = useUser();
    const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [totalCost, setTotalCost] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vendorSettings, setVendorSettings] = useState<{deliveryLocations: string[], deliveryTimes: string[]}>({ deliveryLocations: [], deliveryTimes: [] });
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);

    const BW_COST = 5;
    const COLOR_COST = 12;
    const DELIVERY_FEE = 7;

    const form = useForm<z.infer<typeof printJobSchema>>({
      resolver: zodResolver(printJobSchema),
      defaultValues: {
        printType: 'bw',
      }
    });
    
    useEffect(() => {
        const VENDOR_ID = 'cyber-cafe-services';
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


    const watchedPrintType = form.watch('printType');

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            form.setValue('file', selectedFile);
            setPageCount(null);
            setTotalCost(null);
            setFileDataUrl(null);
            setIsProcessing(true);

            try {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                setPageCount(pdf.numPages);
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFileDataUrl(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);

            } catch (error) {
                console.error('Error parsing PDF:', error);
                toast({
                    variant: 'destructive',
                    title: 'PDF Error',
                    description: 'Could not read the PDF file. Please try another one.',
                });
                form.resetField('file');
            } finally {
                setIsProcessing(false);
            }
        } else {
            form.resetField('file');
            setPageCount(null);
            setTotalCost(null);
            setFileDataUrl(null);
            if (selectedFile) { // only toast if a file was selected but was invalid
              toast({
                  variant: 'destructive',
                  title: 'Invalid File',
                  description: 'Please upload a valid PDF file.',
              });
            }
        }
    };

    useEffect(() => {
        if (pageCount !== null) {
            const costPerPage = watchedPrintType === 'bw' ? BW_COST : COLOR_COST;
            setTotalCost(pageCount * costPerPage + DELIVERY_FEE);
        } else {
            setTotalCost(null);
        }
    }, [pageCount, watchedPrintType]);
    
    const onSubmit = (data: z.infer<typeof printJobSchema>) => {
        if (!data.file || pageCount === null || !user || !fileDataUrl || totalCost === null) {
           toast({ variant: 'destructive', title: 'Error', description: 'Please complete all fields.' });
           return;
        }

        setIsSubmitting(true);
        
        const newPrintRequest: PrintRequest = {
          id: `PRINT-${Date.now()}`,
          userId: user.uid,
          userName: user.displayName || "Unknown User",
          phone: data.phone,
          fileName: data.file.name,
          fileDataUrl: fileDataUrl,
          printType: data.printType,
          pageCount: pageCount,
          totalCost: totalCost,
          status: 'pending',
          createdAt: new Date(),
          pickupLocation: data.pickupLocation,
          pickupTimeSlot: data.pickupTimeSlot,
        };

        try {
          const existingJobsJSON = window.localStorage.getItem('grabclub-print-jobs');
          const existingJobs: PrintRequest[] = existingJobsJSON ? JSON.parse(existingJobsJSON) : [];
          const updatedJobs = [newPrintRequest, ...existingJobs];
          window.localStorage.setItem('grabclub-print-jobs', JSON.stringify(updatedJobs));

          setTimeout(() => {
              toast({
                  variant: 'success',
                  title: 'Print Job Submitted!',
                  description: `Your document has been sent for printing. Total cost: ₹${totalCost?.toFixed(2)}`,
              });
              setIsSubmitting(false);
              form.reset();
              setPageCount(null);
              setTotalCost(null);
              setFileDataUrl(null);
              const fileInput = document.getElementById('pdf-file') as HTMLInputElement;
              if(fileInput) fileInput.value = '';
          }, 1500);

        } catch (error) {
           console.error("Failed to save print job request", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Could not submit your request.",
            });
            setIsSubmitting(false);
        }
    };
    
    if (isUserLoading || isSettingsLoading) return <GrabClubLoading />;


    return (
        <div className="container py-12 sm:py-16">
            <div className="max-w-2xl mx-auto">
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
                        Cyber Services
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Upload your PDF to get it printed.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>New Print Job</CardTitle>
                        <CardDescription>Select a PDF and choose your print options.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                              control={form.control}
                              name="file"
                              render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Upload PDF</FormLabel>
                                    <FormControl>
                                      <Input id="pdf-file" type="file" onChange={handleFileChange} accept=".pdf" disabled={isProcessing || isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                              )}
                            />

                            {isProcessing && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processing PDF...</span>
                                </div>
                            )}

                            {form.getValues('file') && pageCount !== null && (
                                <div className="space-y-4 animate-[slideUpFade_0.3s_ease-out]">
                                    <div className="p-3 rounded-md border bg-muted/30 flex items-center gap-3">
                                       <FileText className="w-5 h-5 text-primary"/>
                                       <div className="flex-1">
                                            <p className="text-sm font-medium truncate">{form.getValues('file').name}</p>
                                            <p className="text-xs text-muted-foreground">{pageCount} {pageCount > 1 ? 'pages' : 'page'} detected</p>
                                       </div>
                                    </div>
                                    
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
                                      
                                    <FormField
                                        control={form.control}
                                        name="pickupLocation"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Pickup Location</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a pickup point" /></SelectTrigger></FormControl>
                                                <SelectContent>{vendorSettings.deliveryLocations.map((location) => (<SelectItem key={location} value={location}>{location}</SelectItem>))}</SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="pickupTimeSlot"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Preferred Pickup Time</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a time slot" /></SelectTrigger></FormControl>
                                                <SelectContent>{vendorSettings.deliveryTimes.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}</SelectContent>
                                            </Select>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />


                                    <FormField
                                      control={form.control}
                                      name="printType"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Print Type</FormLabel>
                                          <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4" disabled={isSubmitting}>
                                                <FormItem className="flex items-center space-x-2">
                                                    <FormControl><RadioGroupItem value="bw" id="bw" /></FormControl>
                                                    <Label htmlFor="bw">Black & White (₹{BW_COST}/page)</Label>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2">
                                                    <FormControl><RadioGroupItem value="color" id="color" /></FormControl>
                                                    <Label htmlFor="color">Color (₹{COLOR_COST}/page)</Label>
                                                </FormItem>
                                            </RadioGroup>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    
                                    {totalCost !== null && (
                                        <div className="p-4 rounded-lg bg-card border shadow-inner">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="font-medium text-lg">Total Cost:</span>
                                                    <p className="text-xs text-muted-foreground">Includes ₹{DELIVERY_FEE.toFixed(2)} delivery charge</p>
                                                </div>
                                                <span className="text-2xl font-bold font-headline text-primary">₹{totalCost.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isValid || isProcessing}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Printer className="mr-2 h-4 w-4" />Submit Print Job</> }
                            </Button>
                        </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
