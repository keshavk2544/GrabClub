import { NextResponse, NextRequest } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const baseUrl = req.nextUrl.clone().origin;
  const failureUrl = new URL('/orders', baseUrl);
  failureUrl.searchParams.set('payment_status', 'failed');

  if (!keySecret) {
    console.error("Razorpay key secret not configured on server.");
    failureUrl.searchParams.set('error', 'server_config_error');
    return NextResponse.redirect(failureUrl);
  }

  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    
    const razorpay_order_id = params.get('razorpay_order_id');
    const razorpay_payment_id = params.get('razorpay_payment_id');
    const razorpay_signature = params.get('razorpay_signature');
    const internal_order_id = req.nextUrl.searchParams.get('order_id');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !internal_order_id) {
       // Fallback for old client-side handler if it's still being used
       try {
           const jsonBody = JSON.parse(body);
            const isValid = verifyRazorpaySignature({
               orderId: jsonBody.razorpay_order_id,
               paymentId: jsonBody.razorpay_payment_id,
               signature: jsonBody.razorpay_signature,
               keySecret,
           });
           if (!isValid) {
                return NextResponse.json({ ok: false, error: "Payment signature verification failed." }, { status: 400 });
           }
           return NextResponse.json({ ok: true });
       } catch (e) {
           throw new Error("Missing required parameters from Razorpay callback.");
       }
    }

    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      keySecret,
    });
    
    if (!isValid) {
        failureUrl.searchParams.set('error', 'signature_mismatch');
        return NextResponse.redirect(failureUrl);
    }

    // On success, redirect to a success page with our internal order ID.
    const successUrl = new URL('/payment-success', baseUrl);
    successUrl.searchParams.set('order_id', internal_order_id);
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error("Razorpay verify callback error:", error);
    failureUrl.searchParams.set('error', 'internal_server_error');
    return NextResponse.redirect(failureUrl);
  }
}
