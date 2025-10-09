import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Order } from '../types';

// Image Tree Structure for Free Tier
export interface ProductImage {
  id: string;
  productId: string;
  imageData: string; // base64 encoded image
  imageIndex: number; // order of the image
  createdAt: any;
  updatedAt: any;
}

// Products Service
export const productsService = {
  // Get all products
  async getAllProducts(): Promise<Product[]> {
    try {
      console.log('Firebase service: Getting all products...');
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      console.log('Firebase service: Found', querySnapshot.size, 'products');

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
    } catch (error) {
      console.error('Firebase service: Error fetching products:', error);
      return [];
    }
  },

  // Get featured products
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(8)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      console.log('Firebase service: Getting products for category:', category);
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      console.log('Firebase service: Found', querySnapshot.size, 'products for category', category);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
    } catch (error) {
      console.error('Firebase service: Error fetching products by category:', error);
      return [];
    }
  },

  // Get single product
  async getProduct(id: string): Promise<Product | null> {
    try {
      const productRef = doc(db, 'products', id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        return {
          id: productSnap.id,
          ...productSnap.data()
        } as Product;
      }
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Create product (admin only)
  async createProduct(productData: Omit<Product, 'id'>): Promise<string> {
    try {
      const productsRef = collection(db, 'products');
      
      // Cast to any to access optional properties safely
      const data = productData as any;
      
      // Clean the product data to remove undefined values
      const cleanedData: any = {
        name: data.name,
        description: data.description,
        price: data.price,
        images: data.images || [],
        category: data.category,
        inStock: data.inStock ?? true,
        featured: data.featured ?? false,
        hidden: data.hidden ?? false,
        ratings: data.ratings ?? 0,
        reviewCount: data.reviewCount ?? 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Only add optional fields if they have defined values
      if (data.originalPrice !== undefined && data.originalPrice !== null) {
        cleanedData.originalPrice = data.originalPrice;
      }
      if (data.subcategory !== undefined && data.subcategory !== null && data.subcategory !== '') {
        cleanedData.subcategory = data.subcategory;
      }
      if (data.size !== undefined && data.size !== null && data.size !== '') {
        cleanedData.size = data.size;
      }
      if (data.theme !== undefined && data.theme !== null && data.theme !== '') {
        cleanedData.theme = data.theme;
      }

      const docRef = await addDoc(productsRef, cleanedData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product (admin only)
  async updateProduct(id: string, productData: Partial<Product>): Promise<void> {
    try {
      const productRef = doc(db, 'products', id);
      
      // Clean the update data to remove undefined values
      const cleanedData: any = {
        updatedAt: Timestamp.now(),
      };

      // Only add fields that are not undefined
      Object.keys(productData).forEach(key => {
        const value = (productData as any)[key];
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });

      await updateDoc(productRef, cleanedData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product (admin only)
  async deleteProduct(id: string): Promise<void> {
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};

// Orders Service
export const ordersService = {
  // Create order
  async createOrder(orderData: Omit<Order, 'id' | 'orderDate' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        orderDate: Timestamp.now(),
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get user orders
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      console.log('Fetching orders for user:', userId);
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      console.log(`Found ${querySnapshot.size} orders for user ${userId}`);

      const orders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const order = {
          id: doc.id,
          userId: data.userId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          items: data.items || [],
          subtotal: data.subtotal || 0,
          shippingCost: data.shippingCost || 0,
          total: data.total || 0,
          status: data.status || 'pending',
          shippingAddress: data.shippingAddress || {},
          shippingMethod: data.shippingMethod || 'standard',
          paymentMethod: data.paymentMethod || 'cod',
          paymentStatus: data.paymentStatus || 'pending',
          orderDate: data.orderDate || data.createdAt || new Date(),
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
          notes: data.notes || '',
          deliveryLink: data.deliveryLink || '',
          trackingNumber: data.trackingNumber || ''
        } as Order;

        console.log(`Order ${order.id} data:`, {
          status: order.status,
          deliveryLink: order.deliveryLink,
          trackingNumber: order.trackingNumber,
          hasDeliveryInfo: !!(order.deliveryLink || order.trackingNumber)
        });

        return order;
      });

      return orders;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('Error fetching user orders:', {
        message: errorMessage,
        stack: errorStack,
        error: String(error)
      });
      return [];
    }
  },

  // Get all orders (admin only)
  async getAllOrders(): Promise<Order[]> {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  },

  // Get order by ID
  async getOrder(id: string): Promise<Order | null> {
    try {
      const orderRef = doc(db, 'orders', id);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        return {
          id: orderSnap.id,
          ...orderSnap.data()
        } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  // Update order status (admin only)
  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Update delivery link and tracking (admin only)
  async updateDeliveryInfo(id: string, deliveryLink?: string, trackingNumber?: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', id);
      const updateData: any = {
        updatedAt: Timestamp.now(),
      };
      
      if (deliveryLink !== undefined) {
        updateData.deliveryLink = deliveryLink;
      }
      
      if (trackingNumber !== undefined) {
        updateData.trackingNumber = trackingNumber;
      }
      
      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error('Error updating delivery info:', error);
      throw error;
    }
  },

  // Update order (admin only)
  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  },

  // Delete order (admin only)
  async deleteOrder(id: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', id);
      await deleteDoc(orderRef);
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },
};

// Categories Service
export const categoriesService = {
  // Get all categories
  async getCategories(): Promise<string[]> {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef);
      const querySnapshot = await getDocs(q);

      const categories = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });

      return Array.from(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Get products count by category
  async getCategoryCounts(): Promise<Record<string, number>> {
    try {
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);

      const categoryCounts: Record<string, number> = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1;
        }
      });

      return categoryCounts;
    } catch (error) {
      console.error('Error fetching category counts:', error);
      return {};
    }
  },
};

// Search Service
export const searchService = {
  // Search products
  async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const searchTermLower = searchTerm.toLowerCase();
      const filteredProducts = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product))
        .filter(product => {
          const productData = product as any;
          return (
            product.name.toLowerCase().includes(searchTermLower) ||
            product.description.toLowerCase().includes(searchTermLower) ||
            product.category.toLowerCase().includes(searchTermLower) ||
            (productData.subcategory && productData.subcategory.toLowerCase().includes(searchTermLower)) ||
            (productData.theme && productData.theme.toLowerCase().includes(searchTermLower))
          );
        });

      return filteredProducts;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },
};

// Image Service - Tree Structure for Free Tier
export const imageService = {
  // Upload image to separate document (tree structure)
  async uploadProductImage(productId: string, imageData: string, imageIndex: number = 0): Promise<string> {
    try {
      const imagesRef = collection(db, 'productImages');
      const docRef = await addDoc(imagesRef, {
        productId,
        imageData,
        imageIndex,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log('Image uploaded to tree structure:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error uploading image to tree:', error);
      throw error;
    }
  },

  // Get images for a product
  async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      const imagesRef = collection(db, 'productImages');
      const q = query(
        imagesRef,
        where('productId', '==', productId),
        orderBy('imageIndex', 'asc')
      );
      const querySnapshot = await getDocs(q);

      const images = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProductImage));

      console.log(`Found ${images.length} images for product ${productId}`);
      images.forEach((img, index) => {
        console.log(`Image ${index}: ID=${img.id}, Size=${img.imageData ? (img.imageData.length / 1024 / 1024).toFixed(2) + 'MB' : '0MB'}, Valid=${img.imageData?.startsWith('data:image/')}`);
      });

      return images;
    } catch (error) {
      console.error('Error fetching product images:', error);
      return [];
    }
  },

  // Delete image from tree
  async deleteProductImage(imageId: string): Promise<void> {
    try {
      const imageRef = doc(db, 'productImages', imageId);
      await deleteDoc(imageRef);
      console.log('Image deleted from tree:', imageId);
    } catch (error) {
      console.error('Error deleting image from tree:', error);
      throw error;
    }
  },

  // Delete all images for a product
  async deleteAllProductImages(productId: string): Promise<void> {
    try {
      const imagesRef = collection(db, 'productImages');
      const q = query(imagesRef, where('productId', '==', productId));
      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('All images deleted for product:', productId);
    } catch (error) {
      console.error('Error deleting all product images:', error);
      throw error;
    }
  },

  // Update image index (for reordering)
  async updateImageIndex(imageId: string, newIndex: number): Promise<void> {
    try {
      const imageRef = doc(db, 'productImages', imageId);
      await updateDoc(imageRef, {
        imageIndex: newIndex,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating image index:', error);
      throw error;
    }
  },
};
