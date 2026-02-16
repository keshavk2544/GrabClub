import { UtensilsCrossed, ShoppingBasket, Grape, Carrot, Cake, Candy, Pill, Monitor } from 'lucide-react';
import type { Category, Product, Vendor, Order, CommonMedicineItem, CommonMedicineCategory } from '@/lib/types';
import imageData from './placeholder-images.json';

const getImage = (id: string) => {
  const image = imageData.placeholderImages.find(img => img.id === id);
  if (!image) {
    // Fallback for safety, though this shouldn't happen if IDs are correct
    return {
      src: 'https://picsum.photos/seed/default/400/300',
      width: 400,
      height: 300,
      alt: 'Placeholder image',
      hint: 'placeholder',
    };
  }

  let width = 400;
  let height = 300;

  // For picsum, dimensions are in the URL.
  if (image.imageUrl.startsWith('https://picsum.photos')) {
    const urlParts = image.imageUrl.split('/');
    width = parseInt(urlParts[urlParts.length - 2], 10);
    height = parseInt(urlParts[urlParts.length - 1], 10);
  }
  // For Unsplash, we can't reliably get dimensions from the URL, so we default.
  else if (image.imageUrl.startsWith('https://images.unsplash.com')) {
    width = 400;
    height = 300;
  }
  
  return {
    src: image.imageUrl,
    width: isNaN(width) ? 400 : width,
    height: isNaN(height) ? 300 : height,
    alt: image.description,
    hint: image.imageHint,
  };
};

export const commonMedicineCategories: CommonMedicineCategory[] = [
  {
    name: '🩹 First Aid & Injury Care',
    items: [
      { name: 'Band-Aid / adhesive bandages', imageId: 'band-aids' },
      { name: 'Crepe bandage (for sprains)', imageId: 'crepe-bandage' },
      { name: 'Cotton & gauze', imageId: 'cotton-gauze' },
      { name: 'Medical tape', imageId: 'medical-tape' },
      { name: 'Antiseptic liquid (Dettol/Savlon)', imageId: 'antiseptic-liquid' },
      { name: 'Antiseptic cream (Boroline/Soframycin type)', imageId: 'antiseptic-cream' },
      { name: 'Burn cream', imageId: 'burn-cream' },
      { name: 'Pain relief spray (Volini/Move)', imageId: 'pain-relief-spray' },
      { name: 'Pain balm (Iodex/Amrutanjan)', imageId: 'pain-balm' },
    ],
  },
  {
    name: '🤒 Cold, Headache & Body Pain',
    items: [
      { name: 'Vicks VapoRub', imageId: 'vicks-vaporub' },
      { name: 'Vicks inhaler', imageId: 'vicks-inhaler' },
      { name: 'Balm for headache', imageId: 'headache-balm' },
      { name: 'Steam capsules', imageId: 'steam-capsules' },
      { name: 'Hot water bag / heating pad', imageId: 'hot-water-bag' },
    ],
  },
  {
    name: '🤧 Fever & Common Illness Support',
    items: [
      { name: 'Thermometer', imageId: 'thermometer' },
      { name: 'ORS packets', imageId: 'ors-packets' },
      { name: 'Glucose powder (Energy drink mix)', imageId: 'glucose-powder' },
      { name: 'Hand sanitizer', imageId: 'hand-sanitizer' },
      { name: 'Face masks', imageId: 'face-masks' },
    ],
  },
  {
    name: '🧴 Skin & Hygiene',
    items: [
      { name: 'Handwash / antiseptic handwash', imageId: 'handwash' },
      { name: 'Wet wipes / antiseptic wipes', imageId: 'wet-wipes' },
      { name: 'Calamine lotion (itching, rashes)', imageId: 'calamine-lotion' },
      { name: 'Antifungal dusting powder', imageId: 'antifungal-powder' },
      { name: 'Lip balm (for cracked lips)', imageId: 'lip-balm' },
    ],
  },
  {
    name: '🚺 Personal & Sexual Health',
    items: [
      { name: 'Sanitary pads', imageId: 'sanitary-pads' },
      { name: 'Tampons / menstrual cup', imageId: 'tampons' },
      { name: 'Condoms', imageId: 'condoms' },
      { name: 'Pregnancy test kit', imageId: 'pregnancy-test-kit' },
      { name: 'Intimate hygiene wash', imageId: 'intimate-wash' },
    ],
  },
  {
    name: '💊 Daily Wellness',
    items: [
      { name: 'Multivitamin tablets', imageId: 'multivitamin-tablets' },
      { name: 'Vitamin C tablets', imageId: 'vitamin-c-tablets' },
      { name: 'Vitamin D sachets', imageId: 'vitamin-d-sachets' },
      { name: 'Electrolyte drinks', imageId: 'electrolyte-drinks' },
    ],
  },
];

export const categories: Category[] = [
  { id: 'food', name: 'Food', icon: UtensilsCrossed },
  { id: 'grocery', name: 'Grocery', icon: ShoppingBasket },
  { id: 'fruits', name: 'Fruits', icon: Grape },
  { id: 'vegetables', name: 'Vegetables', icon: Carrot },
  { id: 'bakery', name: 'Bakery', icon: Cake },
  { id: 'sweets', name: 'Sweets', icon: Candy },
  { id: 'medicine', name: 'Medicine', icon: Pill },
  { id: 'cyber-cafe', name: 'Cyber', icon: Monitor },
];

export const vendors: Vendor[] = [
  { id: 'pizzaplace', name: 'Pizza Place', description: 'Authentic Italian pizzas fired to perfection.', image: getImage('vendor-pizza-place'), category: 'food', status: 'active', openingTime: '12:00', closingTime: '23:00', workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], userId: 'pizzaplace@123', password: 'password', deliveryType: 'grabclub', deliveryCharge: 50 },
  { id: 'burgerbarn', name: 'Burger Barn', description: 'Gourmet burgers, shakes, and crispy fries.', image: getImage('vendor-burger-barn'), category: 'food', status: 'active', openingTime: '11:00', closingTime: '22:00', workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], userId: 'burgerbarn@123', password: 'password', deliveryType: 'grabclub', deliveryCharge: 50 },
  { id: 'sushicentral', name: 'Sushi Central', description: 'The freshest, most delicious sushi in town.', image: getImage('vendor-sushi-central'), category: 'food', status: 'inactive', userId: 'sushi@123', password: 'password', deliveryType: 'grabclub', deliveryCharge: 50 },
  { id: 'healthybites', name: 'Healthy Bites', description: 'Nutritious salads, bowls, and smoothies.', image: getImage('vendor-healthy-bites'), category: 'food', status: 'active', openingTime: '09:00', closingTime: '20:00', workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], userId: 'healthybites@123', password: 'password', deliveryType: 'self', deliveryCharge: 50 },
  { 
    id: 'general-store', 
    name: 'General Store', 
    description: 'Your one-stop shop for daily essentials.', 
    image: getImage('vendor-general-store'), 
    category: 'grocery',
    openingTime: '09:00',
    closingTime: '22:00',
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    deliveryLocations: ["Quantum Gate", "Near Shivam Dhaba", "Radha Valley", "Near Pundir"],
    deliveryTimes: ["10:00 AM – 11:00 AM", "8:00 PM – 9:00 PM"],
    status: 'active',
    userId: 'grocery@123',
    password: 'password',
    deliveryType: 'grabclub',
    deliveryCharge: 50,
  },
  { 
    id: 'fresh-fruits', 
    name: 'Fresh Fruits Co.', 
    description: 'The freshest fruits, delivered daily.', 
    image: getImage('vendor-fresh-fruits'), 
    category: 'fruits',
    openingTime: '08:00',
    closingTime: '18:00',
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    deliveryLocations: ["Quantum Gate", "Radha Valley"],
    deliveryTimes: ["9:00 AM – 10:00 AM"],
    status: 'active',
    userId: 'fruits@123',
    password: 'password',
    deliveryType: 'grabclub',
    deliveryCharge: 50,
  },
  { 
    id: 'fresh-vegetables', 
    name: 'Green Grocer', 
    description: 'Farm-fresh vegetables for your kitchen.', 
    image: getImage('vendor-vegetables'),
    category: 'vegetables',
    openingTime: '08:00',
    closingTime: '19:00',
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    deliveryLocations: ["Quantum Gate", "Near Shivam Dhaba", "Radha Valley"],
    deliveryTimes: ["11:00 AM – 12:00 PM", "6:00 PM - 7:00 PM"],
    status: 'active',
    userId: 'vegetable@123',
    password: 'password',
    deliveryType: 'grabclub',
    deliveryCharge: 50,
  },
  {
    id: 'sweet-treats-bakery',
    name: 'Sweet Treats Bakery',
    description: 'Delicious cakes, pastries, and breads.',
    image: getImage('vendor-bakery'),
    category: 'bakery',
    openingTime: '07:00',
    closingTime: '20:00',
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    deliveryLocations: ["Quantum Gate", "Near Shivam Dhaba"],
    deliveryTimes: ["8:00 AM – 9:00 AM", "4:00 PM - 5:00 PM"],
    status: 'active',
    userId: 'bakery@123',
    password: 'password',
    deliveryType: 'self',
    deliveryCharge: 50,
  },
  {
    id: 'sweets-shop',
    name: 'Sweet Delights',
    description: 'A variety of traditional and modern sweets.',
    image: getImage('vendor-sweets-shop'),
    category: 'sweets',
    openingTime: '10:00',
    closingTime: '21:00',
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    deliveryLocations: ["Quantum Gate", "Radha Valley", "Near Pundir"],
    deliveryTimes: ["12:00 PM – 1:00 PM", "7:00 PM - 8:00 PM"],
    status: 'active',
    userId: 'sweets@123',
    password: 'password',
    deliveryType: 'grabclub',
    deliveryCharge: 50,
  },
  { 
    id: 'pharmaplus', 
    name: 'PharmaPlus', 
    description: 'Your trusted campus pharmacy.', 
    image: getImage('vendor-pharmacy'), 
    category: 'medicine', 
    status: 'active',
    openingTime: '09:00',
    closingTime: '23:00',
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    deliveryLocations: ["Quantum Gate", "Near Shivam Dhaba", "Radha Valley", "Near Pundir"],
    deliveryTimes: ["10:00 AM – 1:00 PM", "5:00 PM – 9:00 PM"],
    userId: 'pharma@123',
    password: 'password',
    deliveryType: 'self',
    deliveryCharge: 50,
  },
  { 
    id: 'cyber-cafe-services', 
    name: 'Cyber Services', 
    description: 'Printing, scanning, and other digital services.', 
    image: getImage('internet-cafe'), 
    category: 'cyber-cafe', 
    status: 'active',
    openingTime: '09:00',
    closingTime: '21:00',
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    deliveryLocations: ["Cyber Cafe Counter"],
    deliveryTimes: ["10:00 AM – 7:00 PM"],
    userId: 'cyber@123',
    password: 'password',
    deliveryType: 'self',
    deliveryCharge: 50,
  },
  {
    id: "vendor-1718012345",
    name: "Kiya chasma wali",
    description: "best fhootha hua chasma",
    userId: "kiya@123",
    password: "password",
    category: "food",
    status: "active",
    image: {
      src: "https://picsum.photos/seed/kiya-chasma-wali/400/300",
      width: 400,
      height: 300,
      alt: "Kiya chasma wali",
      hint: "kiya chasma"
    },
    openingTime: "09:00",
    closingTime: "22:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    deliveryLocations: [],
    deliveryTimes: [],
    deliveryType: "grabclub",
    deliveryCharge: 50,
  }
];

export const products: Product[] = [
  { id: '1', name: 'Cheese Pizza', vendorId: 'pizzaplace', price: 12.99, quantityUnit: '1 pc', image: getImage('pizza'), category: 'food', subCategory: 'pizza', emoji: '🍕', inventory: 20 },
  { id: '24', name: 'Veggie Pizza', vendorId: 'pizzaplace', price: 14.99, quantityUnit: '1 pc', image: getImage('veggie-pizza'), category: 'food', subCategory: 'pizza', emoji: '🍕', inventory: 15 },
  { id: '25', name: 'Garlic Bread', vendorId: 'pizzaplace', price: 5.99, quantityUnit: '4 pcs', image: getImage('garlic-bread'), category: 'food', subCategory: 'sides', emoji: '🍞', inventory: 30 },
  { id: 'veg-club-sandwich', name: 'Veg Club Sandwich', price: 90, quantityUnit: '1 piece', image: getImage('veg-club-sandwich'), category: 'food', vendorId: 'pizzaplace', emoji: '🥪', inventory: 10, subCategory: 'sandwiches' },
  { id: '2', name: 'Beef Burger', vendorId: 'burgerbarn', price: 8.99, quantityUnit: '1 pc', image: getImage('burger'), category: 'food', subCategory: 'burgers', emoji: '🍔', inventory: 15 },
  { id: '26', name: 'Chicken Burger', vendorId: 'burgerbarn', price: 9.99, quantityUnit: '1 pc', image: getImage('chicken-burger'), category: 'food', subCategory: 'burgers', emoji: '🍔', inventory: 20 },
  { id: 'garlic-bread-with-cheese', name: 'Garlic Bread with Cheese', price: 200, quantityUnit: '6 slices', image: getImage('garlic-bread-with-cheese'), category: 'food', vendorId: 'burgerbarn', emoji: '🍞', inventory: 15, subCategory: 'sides' },
  { id: '3', name: 'Assorted Sushi', vendorId: 'sushicentral', price: 15.50, quantityUnit: '8 pcs', image: getImage('sushi'), category: 'food', subCategory: 'sushi', emoji: '🍣', inventory: 0 },
  { id: 'sushi-central-edamame', name: 'Edamame', vendorId: 'sushicentral', price: 5.00, quantityUnit: '1 bowl', image: getImage('edamame'), category: 'food', subCategory: 'appetizers', emoji: '🌱', inventory: 20 },
  { id: '9', name: 'Chicken Salad', vendorId: 'healthybites', price: 9.75, quantityUnit: '1 bowl', image: getImage('salad'), category: 'food', subCategory: 'salads', emoji: '🥗', inventory: 12 },
  { id: '27', name: 'Quinoa Bowl', vendorId: 'healthybites', price: 10.50, quantityUnit: '1 bowl', image: getImage('quinoa-bowl'), category: 'food', subCategory: 'bowls', emoji: '🥗', inventory: 10 },
  { id: '7', name: 'Fresh Milk', vendorId: 'general-store', price: 3.49, quantityUnit: '1 litre', image: getImage('milk'), category: 'grocery', subCategory: 'dairy', emoji: '🥛', inventory: 24, keywords: 'dairy, drink, breakfast' },
  { id: '8', name: 'Loaf of Bread', vendorId: 'general-store', price: 4.25, quantityUnit: '1 loaf', image: getImage('bread'), category: 'grocery', subCategory: 'bread', emoji: '🍞', inventory: 30, keywords: 'bakery, breakfast, toast' },
  { id: '13', name: 'Carton of Eggs', vendorId: 'general-store', price: 3.99, quantityUnit: '1 dozen', image: getImage('eggs'), category: 'grocery', subCategory: 'dairy', emoji: '🥚', inventory: 18, keywords: 'protein, breakfast' },
  { id: '21', name: 'Red Lentils', vendorId: 'general-store', price: 5.00, quantityUnit: '1 kg', image: getImage('lentils'), category: 'grocery', subCategory: 'pulses', emoji: '🫘', inventory: 40, keywords: 'dal, protein, indian' },
  { id: '22', name: 'Basmati Rice', vendorId: 'general-store', price: 8.00, quantityUnit: '1 kg', image: getImage('rice'), category: 'grocery', subCategory: 'rice', emoji: '🍚', inventory: 35, keywords: 'carbs, staple, indian' },
  { id: '23', name: 'Turmeric Powder', vendorId: 'general-store', price: 2.50, quantityUnit: '100 gm', image: getImage('turmeric'), category: 'grocery', subCategory: 'spices', emoji: '🌶️', inventory: 50, keywords: 'haldi, spice, indian' },
  { id: '5', name: 'Red Apples', vendorId: 'fresh-fruits', price: 2.99, quantityUnit: '1 kg', image: getImage('apples'), category: 'fruits', subCategory: 'pome', emoji: '🍎', inventory: 25, keywords: 'fruit, healthy, snack' },
  { id: '10', name: 'Fresh Bananas', vendorId: 'fresh-fruits', price: 1.99, quantityUnit: '1 dozen', image: getImage('bananas'), category: 'fruits', subCategory: 'tropical', emoji: '🍌', inventory: 30, keywords: 'fruit, energy, potassium' },
  { id: '14', name: 'Oranges', vendorId: 'fresh-fruits', price: 2.49, quantityUnit: '1 kg', image: getImage('oranges'), category: 'fruits', subCategory: 'citrus', emoji: '🍊', inventory: 20, keywords: 'fruit, vitamin c, juicy' },
  { id: '15', name: 'Carrots', vendorId: 'fresh-vegetables', price: 1.49, quantityUnit: '500 gm', image: getImage('carrots'), category: 'vegetables', subCategory: 'root', emoji: '🥕', inventory: 40, keywords: 'vegetable, healthy, orange' },
  { id: '16', name: 'Broccoli', vendorId: 'fresh-vegetables', price: 2.29, quantityUnit: '1 pc', image: getImage('broccoli'), category: 'vegetables', subCategory: 'cruciferous', emoji: '🥦', inventory: 15, keywords: 'vegetable, green, healthy' },
  { id: '11', name: 'Butter Croissant', vendorId: 'sweet-treats-bakery', price: 2.50, quantityUnit: '1 pc', image: getImage('croissant'), category: 'bakery', subCategory: 'pastries', emoji: '🥐', inventory: 20, keywords: 'french, pastry, breakfast' },
  { id: '17', name: 'Chocolate Cupcake', vendorId: 'sweet-treats-bakery', price: 3.00, quantityUnit: '1 pc', image: getImage('cupcake'), category: 'bakery', subCategory: 'cakes', emoji: '🧁', inventory: 24, keywords: 'dessert, cake, sweet' },
  { id: '12', name: 'Gulab Jamun', vendorId: 'sweets-shop', price: 7.50, quantityUnit: '250 gm', image: getImage('gulab-jamun'), category: 'sweets', subCategory: 'indian', emoji: '🍮', inventory: 30, keywords: 'mithai, indian, dessert' },
  { id: '18', name: 'Dark Chocolate Bar', vendorId: 'sweets-shop', price: 4.50, quantityUnit: '100 gm', image: getImage('chocolate'), category: 'sweets', subCategory: 'chocolate', emoji: '🍫', inventory: 50, keywords: 'candy, dessert, sweet' },
  { id: '19', name: 'Painkillers', vendorId: 'pharmaplus', price: 5.99, quantityUnit: '1 strip', image: getImage('painkillers'), category: 'medicine', emoji: '💊', inventory: 100, keywords: 'health, pain, medicine' },
  { id: '20', name: 'Band-Aids', vendorId: 'pharmaplus', price: 3.29, quantityUnit: '1 box', image: getImage('band-aids'), category: 'medicine', emoji: '🩹', inventory: 80, keywords: 'first aid, injury, health' },
];

export const heroImage = getImage('hero-image');

export const initialGroceryOrders: Order[] = [
  {
    id: 'ORD001',
    vendorId: 'general-store',
    customerName: 'Alex Johnson',
    receiverName: 'Alex Johnson',
    status: 'pending',
    items: [
      { productId: '7', name: 'Fresh Milk', quantity: 2, price: 3.49 },
      { productId: '8', name: 'Loaf of Bread', quantity: 1, price: 4.25 },
      { productId: '13', name: 'Carton of Eggs', quantity: 1, price: 3.99 },
    ],
    total: 15.22,
    deliveryLocation: 'Quantum Gate',
    deliveryTimeSlot: '10:00 AM – 11:00 AM',
    orderTime: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
  },
  {
    id: 'ORD002',
    vendorId: 'general-store',
    customerName: 'Maria Garcia',
    receiverName: 'Maria Garcia',
    status: 'pending',
    items: [
      { productId: '21', name: 'Red Lentils', quantity: 1, price: 5.00 },
      { productId: '22', name: 'Basmati Rice', quantity: 2, price: 8.00 },
    ],
    total: 21.00,
    deliveryLocation: 'Radha Valley',
    deliveryTimeSlot: '8:00 PM – 9:00 PM',
    orderTime: new Date(Date.now() - 35 * 60 * 1000), // 35 mins ago
  },
  {
    id: 'ORD003',
    vendorId: 'general-store',
    customerName: 'Chen Wei',
    receiverName: 'Chen Wei',
    status: 'accepted',
    items: [
      { productId: '15', name: 'Carrots', quantity: 1, price: 1.49 },
      { productId: '16', name: 'Broccoli', quantity: 2, price: 2.29 },
    ],
    total: 6.07,
    deliveryLocation: 'Near Shivam Dhaba',
    deliveryTimeSlot: '10:00 AM – 11:00 AM',
    orderTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
   {
    id: 'ORD004',
    vendorId: 'general-store',
    customerName: 'Spam User',
    receiverName: 'Spam User',
    status: 'rejected',
    items: [{ productId: '21', name: 'Red Lentils', quantity: 10, price: 5.00 }],
    total: 50.00,
    deliveryLocation: 'Pundir',
    deliveryTimeSlot: '8:00 PM – 9:00 PM',
    orderTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
];

export const initialFruitsOrders: Order[] = [
    {
        id: 'ORD-FR-001',
        vendorId: 'fresh-fruits',
        customerName: 'John Doe',
        receiverName: 'John Doe',
        status: 'pending',
        items: [
            { productId: '5', name: 'Red Apples', quantity: 2, price: 2.99 },
            { productId: '10', name: 'Fresh Bananas', quantity: 1, price: 1.99 },
        ],
        total: 7.97,
        deliveryLocation: 'Quantum Gate',
        deliveryTimeSlot: '9:00 AM – 10:00 AM',
        orderTime: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    },
    {
        id: 'ORD-FR-002',
        vendorId: 'fresh-fruits',
        customerName: 'Jane Smith',
        receiverName: 'Jane Smith',
        status: 'delivered',
        items: [
            { productId: '14', name: 'Oranges', quantity: 3, price: 2.49 },
        ],
        total: 7.47,
        deliveryLocation: 'Radha Valley',
        deliveryTimeSlot: '9:00 AM – 10:00 AM',
        orderTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    }
];

export const initialVegetableOrders: Order[] = [
    {
        id: 'ORD-VEG-001',
        vendorId: 'fresh-vegetables',
        customerName: 'Sita Sharma',
        receiverName: 'Sita Sharma',
        status: 'pending',
        items: [
            { productId: '15', name: 'Carrots', quantity: 1, price: 1.49 },
            { productId: '16', name: 'Broccoli', quantity: 1, price: 2.29 },
        ],
        total: 3.78,
        deliveryLocation: 'Quantum Gate',
        deliveryTimeSlot: '11:00 AM – 12:00 PM',
        orderTime: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
    },
    {
        id: 'ORD-VEG-002',
        vendorId: 'fresh-vegetables',
        customerName: 'Ravi Kumar',
        receiverName: 'Ravi Kumar',
        status: 'delivered',
        items: [
            { productId: '15', name: 'Carrots', quantity: 2, price: 1.49 },
        ],
        total: 2.98,
        deliveryLocation: 'Radha Valley',
        deliveryTimeSlot: '6:00 PM - 7:00 PM',
        orderTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    }
];

export const initialBakeryOrders: Order[] = [
    {
        id: 'ORD-BK-001',
        vendorId: 'sweet-treats-bakery',
        customerName: 'Priya Singh',
        receiverName: 'Priya Singh',
        status: 'pending',
        items: [
            { productId: '11', name: 'Butter Croissant', quantity: 4, price: 2.50 },
        ],
        total: 10.00,
        deliveryLocation: 'Quantum Gate',
        deliveryTimeSlot: '8:00 AM – 9:00 AM',
        orderTime: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
    },
    {
        id: 'ORD-BK-002',
        vendorId: 'sweet-treats-bakery',
        customerName: 'Amit Patel',
        receiverName: 'Amit Patel',
        status: 'delivered',
        items: [
            { productId: '17', name: 'Chocolate Cupcake', quantity: 6, price: 3.00 },
        ],
        total: 18.00,
        deliveryLocation: 'Near Shivam Dhaba',
        deliveryTimeSlot: '4:00 PM - 5:00 PM',
        orderTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    }
];

export const initialSweetsOrders: Order[] = [
    {
        id: 'ORD-SW-001',
        vendorId: 'sweets-shop',
        customerName: 'Priya Singh',
        receiverName: 'Priya Singh',
        status: 'pending',
        items: [
            { productId: '12', name: 'Gulab Jamun', quantity: 1, price: 7.50 },
        ],
        total: 7.50,
        deliveryLocation: 'Quantum Gate',
        deliveryTimeSlot: '12:00 PM – 1:00 PM',
        orderTime: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    },
    {
        id: 'ORD-SW-002',
        vendorId: 'sweets-shop',
        customerName: 'Amit Patel',
        receiverName: 'Amit Patel',
        status: 'delivered',
        items: [
            { productId: '18', name: 'Dark Chocolate Bar', quantity: 4, price: 4.50 },
        ],
        total: 18.00,
        deliveryLocation: 'Radha Valley',
        deliveryTimeSlot: '7:00 PM - 8:00 PM',
        orderTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    }
];

export const initialFoodOrders: Order[] = [
    {
        id: 'ORD-FOOD-001',
        vendorId: 'pizzaplace',
        customerName: 'John Doe',
        status: 'pending',
        items: [
            { productId: '1', name: 'Cheese Pizza', quantity: 1, price: 12.99 },
        ],
        total: 12.99,
        deliveryLocation: 'Quantum Gate',
        orderTime: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    },
    {
        id: 'ORD-FOOD-002',
        vendorId: 'burgerbarn',
        customerName: 'Jane Smith',
        status: 'accepted',
        items: [
            { productId: '2', name: 'Beef Burger', quantity: 2, price: 8.99 },
        ],
        total: 17.98,
        deliveryLocation: 'Radha Valley',
        orderTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    },
    {
        id: 'ORD-FOOD-003',
        vendorId: 'healthybites',
        customerName: 'Alex Johnson',
        status: 'delivered',
        items: [
            { productId: '9', name: 'Chicken Salad', quantity: 1, price: 9.75 },
        ],
        total: 9.75,
        deliveryLocation: 'Near Shivam Dhaba',
        orderTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
];
