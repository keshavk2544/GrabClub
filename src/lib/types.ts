export type Category = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

type ImageType = {
  src: string;
  width: number;
  height: number;
  alt: string;
  hint: string;
};

export type Vendor = {
  id: string;
  name: string;
  description: string;
  image: ImageType;
  shopImage?: ImageType;
  category: string;
  userId?: string;
  password?: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string[];
  deliveryLocations?: string[];
  deliveryTimes?: string[];
  status: 'active' | 'inactive';
  deliveryType: 'grabclub' | 'self';
};

export type Product = {
  id: string;
  name: string;
  vendorId: string;
  price: number;
  quantityUnit: string;
  image: ImageType;
  category: string;
  subCategory?: string;
  emoji: string;
  inventory: number;
  keywords?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  vendorId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  receiverName?: string;
  requestId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'out for delivery' | 'delivered' | 'pending payment' | 'refunded';
  items: OrderItem[];
  total: number;
  deliveryLocation: string;
  deliveryTimeSlot?: string;
  orderTime: Date;
  verificationCode?: string;
  deliveryPersonId?: string;
  rejectionReason?: 'vendor_unavailable' | 'vendor_rejected' | 'payment_timed_out';
  couponApplied?: boolean;
  couponCode?: string;
};

export type CartItem = { product: Product; quantity: number };

export type MedicineRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  submissionType: 'upload' | 'manual';
  prescriptionImage?: string; // data URL
  medicinesText?: string;
  deliveryLocation: string;
  deliveryTimeSlot: string;
  receiverName: string;
  status: 'pending-review' | 'processed' | 'rejected';
  createdAt: Date;
  orderId?: string;
  orderItems?: OrderItem[];
  couponCode?: string;
};

export type PrintRequest = {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  fileDataUrl: string; // The PDF file as a data URL
  fileName: string;
  printType: 'bw' | 'color';
  pageCount: number;
  totalCost: number;
  status: 'pending' | 'printing' | 'completed' | 'rejected';
  createdAt: Date;
  pickupLocation: string;
  pickupTimeSlot: string;
};

export type CommonMedicineItem = {
    name: string;
    imageId: string;
};

export type CommonMedicineCategory = {
    name: string;
    items: CommonMedicineItem[];
};

export type DeliveryPerson = {
    id: string;
    userId: string;
    name: string;
    contactNumber: string;
    altContactNumber?: string;
    address?: string;
    aadharPhotoUrl?: string;
    vehicleNumber?: string;
    paymentDetails?: string;
    status: 'active' | 'inactive';
    password?: string;
};

export type Complaint = {
  id: string;
  orderCode: string;
  complaint: string;
  userEmail: string;
  userName: string;
  createdAt: Date;
  status: 'open' | 'resolved';
  adminReply?: string;
};

export type Coupon = {
  id: string;
  code: string;
  usageLimit: number;
  timesUsed: number;
};
