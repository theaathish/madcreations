export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: 'poster' | 'polaroid' | 'bundle' | 'customizable' | 'split_poster';
  subcategory?: string;
  size?: string;
  theme?: string;
  inStock: boolean;
  featured: boolean;
  hidden?: boolean;
  ratings?: number;
  reviewCount?: number;
  createdAt?: any;
  updatedAt?: any;
  isMultiSize?: boolean;
  sizeOptions?: Array<{
    size: string;
    price: number;
    originalPrice?: number;
  }>;
}

export interface CartItem {
  product: Product;
  quantity: number;
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
  paymentStatus?: 'pending' | 'paid' | 'failed';
  orderDate: string;
  createdAt?: any;
  updatedAt?: any;
  shippingAddress: ShippingAddress;
  shippingMethod: 'standard' | 'express';
  notes?: string;
  deliveryLink?: string;
  trackingNumber?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  customizations: string; // JSON string to avoid nested entity errors
}