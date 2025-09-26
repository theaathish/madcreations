export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  featured?: boolean;
  inStock: boolean;
  createdAt?: any;
  updatedAt?: any;
  // Add any other product fields you need
}

export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: Record<string, any>;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  customizations?: Record<string, any>;
}

export interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: ShippingAddress;
  shippingMethod: 'standard' | 'express';
  notes?: string;
  orderDate?: any;
  createdAt?: any;
  updatedAt?: any;
  deliveryLink?: string;
  trackingNumber?: string;
  // Add any other order fields you need
}

export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  // Add any other user profile fields you need
}
