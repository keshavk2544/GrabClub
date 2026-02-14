'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { useUser } from '@/firebase/auth/use-user';
import { useCartAnimation } from '@/context/cart-animation-context';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Truck, Clock, Store, MapPin, Calendar, User, Info, Building, ShoppingCart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Order, Vendor } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import GrabClubLoading from '@/components/layout/loading';
import { useProducts } from '@/hooks/use-products';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import BlockedUserGuard from '@/components/blocked-user-guard';

const PLATFORM_FEE = 1.69;

const checkoutSchema = z.object({
  address: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  paymentMethod: z.enum(['cod', 'online'], { required_error: 'You need to select a payment method.' }),
  deliveryLocation: z.string().optional(),
  deliveryTimeSlot: z.string().optional(),
  receiverName: z.string().min(2, { message: "Please enter the receiver's name." }),
});


export default function CheckoutPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { cartItems, getCartTotal, clearCart } = useCartAnimation();
  const { decrementInventory } = useProducts();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isNamePreFilled, setIsNamePreFilled] = useState(false);

  const vendorIdInCart = useMemo(() => cartItems.length > 0 ? cartItems[0].product.vendorId : null, [cartItems]);
  
  const vendorRef = useMemoFirebase(() => vendorIdInCart ? doc(firestore, 'vendors', vendorIdInCart) : null, [vendorIdInCart, firestore]);
  const { data: vendor, isLoading: isVendorLoading, error: vendorError } = useDoc<Vendor>(vendorRef);

  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    if (!vendor || !vendor.openingTime || !vendor.closingTime || !vendor.workingDays || vendor.workingDays.length === 0) {
        setIsStoreOpen(true); // Default to open if settings are incomplete
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

        if (!vendor.workingDays!.includes(dayOfWeek)) {
            setIsStoreOpen(false);
            return;
        }

        const [openHour, openMinute] = vendor.openingTime!.split(':').map(Number);
        const [closeHour, closeMinute] = vendor.closingTime!.split(':').map(Number);
        
        const openTimeInMinutes = openHour * 60 + openMinute;
        const closeTimeInMinutes = closeHour * 60 + closeMinute;

        if (closeTimeInMinutes <= openTimeInMinutes) {
            setIsStoreOpen(currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes);
        } else {
            setIsStoreOpen(currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes);
        }
    };

    checkOpenStatus();
    const intervalId = setInterval(checkOpenStatus, 60000);

    return () => clearInterval(intervalId);
  }, [vendor]);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: '', receiverName: '', phone: '', paymentMethod: 'online',
      deliveryLocation: undefined, deliveryTimeSlot: undefined,
    }
  });

  useEffect(() => {
    const discount = window.localStorage.getItem('grabclub-discount') === 'true';
    setDiscountApplied(discount);
  }, []);

  useEffect(() => {
    // Pre-fill the receiver's name only once when the user data is available.
    if (user && !isNamePreFilled) {
      form.setValue('receiverName', user.displayName || '', { shouldValidate: true });
      setIsNamePreFilled(true);
    }
  }, [user, isNamePreFilled, form.setValue]);

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
    if (!isUserLoading && cartItems.length === 0) router.replace('/cart');
  }, [user, isUserLoading, cartItems, router]);

  const subtotal = getCartTotal();
  const deliveryFee = discountApplied ? 0 : (vendor?.deliveryCharge ?? 50.00);
  const total = subtotal + deliveryFee + (subtotal > 0 ? PLATFORM_FEE : 0);

  const showLocationDropdown = vendor && (vendor.deliveryLocations && vendor.deliveryLocations.length > 0);

  async function onSubmit(data: z.infer<typeof checkoutSchema>) {
    if (!vendor || !firestore || !user) {
        toast({ variant: "destructive", title: "Order failed", description: "Could not place your order. Please try again." });
        return;
    }
    
    let isFormValid = true;
    if (showLocationDropdown) {
        if (!data.deliveryLocation) {
            form.setError("deliveryLocation", { type: "manual", message: "Please select a delivery location." });
            isFormValid = false;
        }
    } else { 
        if (!data.address || data.address.length < 10) {
            form.setError("address", { type: "manual", message: "Address must be at least 10 characters long." });
            isFormValid = false;
        }
    }
    
    if (vendor.deliveryType === 'grabclub' && data.deliveryTimeSlot) {
        if (!data.deliveryTimeSlot) {
            form.setError("deliveryTimeSlot", { type: "manual", message: "Please select a delivery time slot." });
            isFormValid = false;
        }
    }

    if (!isFormValid) return;

    setIsSubmitting(true);

    const createOrderObject = () => {
      const baseOrder: Omit<Order, 'id' | 'orderTime' | 'deliveryTimeSlot'> & { deliveryTimeSlot?: string } = {
          vendorId: vendor.id,
          customerName: user!.displayName || 'Anonymous',
          customerEmail: user!.email!,
          customerPhone: data.phone,
          receiverName: data.receiverName,
          status: 'pending',
          items: cartItems.map(item => ({ productId: item.product.id, name: item.product.name, quantity: item.quantity, price: item.product.price })),
          total: total,
          platformFee: subtotal > 0 ? PLATFORM_FEE : 0,
          deliveryLocation: showLocationDropdown ? data.deliveryLocation! : data.address!,
      };
      if (vendor.deliveryType === 'grabclub' && data.deliveryTimeSlot) {
        baseOrder.deliveryTimeSlot = data.deliveryTimeSlot;
      }
      return baseOrder;
    };
    
    if (data.paymentMethod === 'cod') {
        const newOrderData = createOrderObject();
        const newOrder: Order = {
            ...newOrderData,
            id: `ORD-${Date.now()}`,
            orderTime: new Date(),
        };

        try {
            const orderRef = doc(firestore, 'orders', newOrder.id);
            await setDoc(orderRef, newOrder);

            const itemsToDecrement = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity }));
            decrementInventory(itemsToDecrement);
            clearCart();
            window.localStorage.removeItem('grabclub-discount');
            
            toast({ variant: 'success', title: 'Order Sent!', description: 'Waiting for the vendor to confirm your order.' });
            router.push('/orders');
        } catch(e) {
            console.error('COD Order placement failed:', e);
            toast({ variant: "destructive", title: "Error", description: "Could not place your order." });
            setIsSubmitting(false);
        }

        return;
    }

    const loadScript = (src: string) => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

    if (!res) {
        toast({
            variant: 'destructive',
            title: 'Payment Gateway Error',
            description: 'Could not load the payment script. Please check your internet connection.',
        });
        setIsSubmitting(false);
        return;
    }

    try {
        const response = await fetch('/api/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: total }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not connect to payment gateway.');
        }

        const razorpayOrder = await response.json();

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            amount: razorpayOrder.amount.toString(),
            currency: "INR",
            name: "GrabClub",
            description: `Payment for order from ${vendor.name}`,
            order_id: razorpayOrder.id,
            handler: async function (paymentResponse: any) {
                const verifyRes = await fetch('/api/razorpay/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: paymentResponse.razorpay_order_id,
                        razorpay_payment_id: paymentResponse.razorpay_payment_id,
                        razorpay_signature: paymentResponse.razorpay_signature,
                    }),
                });

                if (!verifyRes.ok) {
                    const errorData = await verifyRes.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Payment verification failed.');
                }
                
                const newOrderData = createOrderObject();
                const newOrder: Order = {
                    ...newOrderData,
                    id: `ORD-${Date.now()}`,
                    orderTime: new Date(),
                    verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
                };

                const orderRef = doc(firestore, 'orders', newOrder.id);
                await setDoc(orderRef, newOrder);

                const itemsToDecrement = cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity }));
                decrementInventory(itemsToDecrement);
                clearCart();
                window.localStorage.removeItem('grabclub-discount');

                toast({ variant: 'success', title: 'Payment Successful!', description: 'Your order is awaiting vendor confirmation.' });
                router.push('/orders');
            },
            prefill: {
                name: user.displayName || '',
                email: user.email || '',
                contact: data.phone
            },
            theme: {
                color: "#FE9D15"
            },
            modal: {
                ondismiss: function() {
                    setIsSubmitting(false);
                    toast({ variant: 'destructive', title: 'Payment Cancelled', description: 'Your order was not placed.' });
                }
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (paymentResponse: any) {
            toast({
                variant: 'destructive',
                title: 'Payment Failed',
                description: paymentResponse.error.description || 'Please try again.',
            });
            setIsSubmitting(false);
        });
        rzp.open();

    } catch (error) {
        console.error('Payment process failed:', error);
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
        setIsSubmitting(false);
    }
  }

  if (isUserLoading || !user || cartItems.length === 0 || isVendorLoading) {
    return <GrabClubLoading />;
  }
  
  if (vendorError) {
    return <div className="container py-8"><Alert variant="destructive"><AlertTitle>Error Loading Vendor</AlertTitle><AlertDescription>Could not load vendor information for this order. Please try again.</AlertDescription></Alert></div>;
  }
  
  if (!vendor) {
    return <div className="container py-8"><Alert variant="destructive"><AlertTitle>Vendor Not Found</AlertTitle><AlertDescription>The vendor for the items in your cart could not be found. They may no longer be on the platform.</AlertDescription></Alert></div>;
  }

  const isVendorInactive = vendor.status === 'inactive';

  return (
    <BlockedUserGuard>
        <div className="checkout-page-container">
            <div className="blob-container">
                <div className="blob"></div>
                <div className="blob"></div>
            </div>
            <div className="checkout-container">
                <div className="page-header">
                    <h1 className="page-title">
                      {vendor?.category === 'food' ? 'Complete Your Food Order' : 'Checkout'}
                    </h1>
                    <p className="page-subtitle">
                      {vendor?.category === 'food' && vendor.name ? `Finalize your order from ${vendor.name}` : 'Complete your order in just a few steps'}
                    </p>
                </div>

                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="checkout-grid">
                    
                    {/* --- Left Column --- */}
                    <div className="space-y-[30px]">
                        <div className="card">
                             <h2 className="card-title"><MapPin className="card-icon" /> Delivery Details</h2>
                             <div className="form-section">
                                {showLocationDropdown ? (
                                    <FormField control={form.control} name="deliveryLocation" render={({ field }) => (
                                        <FormItem className="input-group">
                                        <FormLabel className="input-label">Delivery Location</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="input-field"><SelectValue placeholder="Select a drop-off point" /></SelectTrigger></FormControl>
                                            <SelectContent>{vendor.deliveryLocations?.map((location) => (<SelectItem key={location} value={location}>{location}</SelectItem>))}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                ) : (
                                    <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem className="input-group">
                                        <FormLabel className="input-label">Full Delivery Address</FormLabel>
                                        <FormControl><Textarea placeholder="Enter your hall, room number, and any landmarks" className="input-field min-h-[100px]" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                                {vendor.deliveryType === 'grabclub' && (
                                    <FormField control={form.control} name="deliveryTimeSlot" render={({ field }) => (
                                        <FormItem className="input-group">
                                        <FormLabel className="input-label">Delivery Time Slot</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="input-field"><SelectValue placeholder="Select a time slot" /></SelectTrigger></FormControl>
                                            <SelectContent>{vendor.deliveryTimes?.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                )}

                                <FormField control={form.control} name="receiverName" render={({ field }) => (
                                    <FormItem className="input-group">
                                    <FormLabel className="input-label">Receiver's Name</FormLabel>
                                    <FormControl><Input placeholder="Enter the name of the person receiving the order" {...field} className="input-field"/></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem className="input-group">
                                    <FormLabel className="input-label">Contact Number</FormLabel>
                                    <FormControl>
                                        <InputOTP maxLength={10} {...field}>
                                            <InputOTPGroup className="w-full justify-between">
                                                {[...Array(10)].map((_, i) => <InputOTPSlot key={i} index={i} className="bg-background border-input" />)}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                             </div>
                        </div>

                        <div className="card">
                            <h2 className="card-title"><CreditCard className="card-icon" /> Payment Method</h2>
                             <div className="form-section">
                                 <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="payment-options">
                                            <div className="payment-option relative rounded-xl overflow-hidden">
                                                <FormControl><RadioGroupItem value="cod" id="cod" disabled /></FormControl>
                                                <label htmlFor="cod" className="opacity-40 cursor-not-allowed">
                                                    <div className="payment-icon">💵</div>
                                                    <div className="payment-details">
                                                        <div className="payment-name">Cash on Delivery</div>
                                                        <div className="payment-desc">Pay when you receive</div>
                                                    </div>
                                                </label>
                                                <div className="absolute inset-0 bg-card/60 backdrop-blur-sm flex items-center justify-center">
                                                    <span className="font-semibold text-sm">Currently Unavailable</span>
                                                </div>
                                            </div>
                                            <div className="payment-option">
                                                <FormControl><RadioGroupItem value="online" id="online" /></FormControl>
                                                <label htmlFor="online">
                                                    <div className="payment-icon">📱</div>
                                                    <div className="payment-details">
                                                        <div className="payment-name">Online Payment</div>
                                                        <div className="payment-desc">Pay with Razorpay</div>
                                                    </div>
                                                </label>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    </div>

                    {/* --- Right Column --- */}
                    <div>
                      <div className="card">
                        <h2 className="card-title"><ShoppingCart className="card-icon" /> Order Summary</h2>
                         <div className="mb-4 space-y-3">
                            {cartItems.map(({product, quantity}) => (
                                <div key={product.id} className="flex items-center gap-3 summary-item">
                                    <Image src={product.image.src} alt={product.image.alt} width={48} height={48} className="aspect-square rounded-md object-cover" />
                                    <div className="flex-1"><p className="text-sm font-medium leading-tight text-white">{product.name}</p><p className="text-xs text-muted-foreground">Qty: {quantity}</p></div>
                                    <p className="text-sm font-medium text-white">₹{(product.price * quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="summary-item"><span className="item-name">Subtotal</span><span className="item-value">₹{subtotal.toFixed(2)}</span></div>
                            <div className="summary-item"><span className="item-name">Delivery Fee</span><span className="item-value">{discountApplied ? <span className="text-green-500 font-semibold">FREE</span> : `₹${deliveryFee.toFixed(2)}`}</span></div>
                             {subtotal > 0 && (
                                <div className="summary-item">
                                    <span className="item-name">Platform Fee</span>
                                    <span className="item-value">₹{PLATFORM_FEE.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                        <div className="total-section">
                            <div className="total-row">
                                <span className="total-label">Total</span>
                                <span className="total-amount">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        {!isStoreOpen && (
                          <Alert variant="destructive" className="mt-4">
                              <Clock className="h-4 w-4" /><AlertTitle>Store is Currently Closed</AlertTitle>
                              <AlertDescription>This store is not accepting orders right now. Please try again during their business hours.</AlertDescription>
                          </Alert>
                        )}
                        {isVendorInactive && (
                          <Alert variant="destructive" className="mt-4">
                              <Store className="h-4 w-4" /><AlertTitle>Vendor Not Operating</AlertTitle>
                              <AlertDescription>This vendor is not currently taking orders.</AlertDescription>
                          </Alert>
                        )}

                        <Button type="submit" disabled={isSubmitting || !isStoreOpen || isVendorInactive} className="place-order-btn">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <span>{isSubmitting ? 'Processing...' : 'Place Order'}</span>
                        </Button>
                      </div>
                    </div>

                </form>
                </Form>
            </div>
        </div>
    </BlockedUserGuard>
  );
}
