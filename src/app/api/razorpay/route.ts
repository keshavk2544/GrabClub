import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";

const orderSchema = z.object({
  amount: z.number().positive(),
});

export async function POST(req: Request) {

  // IMPORTANT: You must add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env.local file.
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay API keys not configured on the server." }, { status: 500 });
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  
  const body = await req.json();
  const validation = orderSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const { amount } = validation.data;

  const options = {
    amount: Math.round(amount * 100), // Amount in the smallest currency unit (paise)
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }
}
