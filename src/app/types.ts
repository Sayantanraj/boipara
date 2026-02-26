export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  storeName?: string;
  phone?: string;
  location?: string;
  gtin?: string; // Global Trade Item Number for sellers
  businessRegistration?: string; // Business registration number
  gst?: string; // GST number for sellers
  storeAddress?: string; // Detailed store address for sellers
  yearsInBusiness?: number; // Years in business for sellers
  specialties?: string; // Specialties for sellers
  supportEmail?: string; // Platform support email (for admin)
}

export interface Seller {
  id: string;
  name: string;
  storeName: string;
  yearsInBusiness: number;
  rating: number;
  totalBooks: number;
  location: string;
  description?: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  sellerId: string;
  sellerName: string;
  seller?: Seller;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  condition: 'new' | 'like-new' | 'used';
  isBuyback?: boolean;
  originalBookId?: string;
  bestseller?: boolean;
  featured?: boolean;
  language?: string;
  edition?: string;
  publisher?: string;
  deliveryDays: number;
}

export interface CartItem {
  bookId: string;
  quantity: number;
  book: Book;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  shipping?: number;
  status: 'new' | 'accepted' | 'packed' | 'shipped' | 'rejected' | 'delivered' | 'pending' | 'processing' | 'cancelled';
  date: string;
  shippingAddress: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
}

export interface BuybackRequest {
  id: string;
  userId: string;
  isbn: string;
  bookTitle: string;
  author?: string;
  condition: 'like-new' | 'good' | 'fair';
  offeredPrice: number;
  sellingPrice?: number; // Price at which platform will sell to sellers
  priceChangeReason?: string; // Reason for price adjustment by admin
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'sold';
  date: string;
  image?: string;
  category?: string;
  publisher?: string;
  language?: string;
  stock?: number;
}

export interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'wishlist' | 'system' | 'buyback';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  orderId?: string;
}

export interface TrackingUpdate {
  status: string;
  timestamp: string;
  location: string;
  description: string;
  completed: boolean;
}

export interface PendingBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  sellerId: string;
  sellerName: string;
  image: string;
  images: string[];
  condition: 'new' | 'like-new' | 'used';
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  language?: string;
  edition?: string;
  publisher?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  sellerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  sellerName: string;
  items: CartItem[]; // Items being returned
  reason: string;
  description: string; // Detailed explanation from customer
  images?: string[]; // Photos of the books for proof
  status: 'pending-admin' | 'approved-by-admin' | 'rejected-by-admin' | 'seller-processing' | 'refund-issued' | 'completed';
  requestDate: string;
  adminApprovedDate?: string;
  adminRejectedDate?: string;
  sellerProcessedDate?: string;
  completedDate?: string;
  adminNotes?: string; // Admin's notes when approving/rejecting
  sellerNotes?: string; // Seller's notes during processing
  refundAmount?: number;
  refundMethod?: string;
}