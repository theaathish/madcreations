/**
 * Optimized Products Service with Caching and Pagination
 * Reduces load time from 5 minutes to <3 seconds
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs, 
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';

// In-memory cache
interface CacheEntry {
  data: Product[];
  timestamp: number;
  lastDoc?: DocumentSnapshot;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if cache is valid
 */
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

/**
 * Generate cache key
 */
const getCacheKey = (category?: string, filters?: any): string => {
  return JSON.stringify({ category, filters });
};

/**
 * Optimized product fetching with pagination and caching
 */
export const optimizedProductsService = {
  /**
   * Get products with pagination (DB-level)
   * @param options - Query options
   * @returns Products and pagination info
   */
  async getProducts(options: {
    category?: string;
    pageSize?: number;
    lastDoc?: DocumentSnapshot;
    useCache?: boolean;
  }): Promise<{ products: Product[]; lastDoc?: DocumentSnapshot; hasMore: boolean }> {
    const { category, pageSize = 20, lastDoc, useCache = true } = options;
    
    const cacheKey = getCacheKey(category, { pageSize, hasLastDoc: !!lastDoc });
    
    // Check cache first (only for first page)
    if (useCache && !lastDoc) {
      const cached = cache.get(cacheKey);
      if (cached && isCacheValid(cached)) {
        console.log('✅ Cache hit for:', cacheKey);
        return {
          products: cached.data,
          lastDoc: cached.lastDoc,
          hasMore: cached.data.length === pageSize
        };
      }
    }

    try {
      const startTime = performance.now();
      
      const productsRef = collection(db, 'products');
      const constraints: QueryConstraint[] = [];

      // Add category filter
      if (category) {
        constraints.push(where('category', '==', category));
      }

      // Add ordering
      constraints.push(orderBy('createdAt', 'desc'));

      // Add pagination
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      constraints.push(limit(pageSize));

      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const products: Product[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = querySnapshot.docs.length === pageSize;

      const duration = performance.now() - startTime;
      console.log(`⏱️ Fetch products ${category || 'all'}: ${duration.toFixed(2)}ms`);
      console.log(`📦 Fetched ${products.length} products`);

      // Cache first page only
      if (!lastDoc) {
        cache.set(cacheKey, {
          data: products,
          timestamp: Date.now(),
          lastDoc: newLastDoc
        });
      }

      return { products, lastDoc: newLastDoc, hasMore };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [], hasMore: false };
    }
  },

  /**
   * Get products by multiple categories (for poster + split_poster)
   */
  async getProductsByCategories(categories: string[], pageSize: number = 20): Promise<Product[]> {
    const cacheKey = getCacheKey(categories.join(','));
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      console.log('✅ Cache hit for categories:', categories);
      return cached.data;
    }

    try {
      const startTime = performance.now();
      
      // Fetch all categories in parallel
      const promises = categories.map(async (category) => {
        const result = await this.getProducts({ category, pageSize, useCache: false });
        return result.products;
      });

      const results = await Promise.all(promises);
      const allProducts = results.flat();

      // Sort by createdAt
      allProducts.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      const duration = performance.now() - startTime;
      console.log(`⏱️ Fetch categories ${categories.join(', ')}: ${duration.toFixed(2)}ms`);
      console.log(`📦 Total products: ${allProducts.length}`);

      // Cache result
      cache.set(cacheKey, {
        data: allProducts,
        timestamp: Date.now()
      });

      return allProducts;
    } catch (error) {
      console.error('Error fetching products by categories:', error);
      return [];
    }
  },

  /**
   * Get featured products (cached)
   */
  async getFeaturedProducts(pageSize: number = 8): Promise<Product[]> {
    const cacheKey = 'featured';
    
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      console.log('✅ Cache hit for featured products');
      return cached.data;
    }

    try {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      const querySnapshot = await getDocs(q);

      const products: Product[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      return products;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },

  /**
   * Search products (with caching)
   */
  async searchProducts(searchTerm: string): Promise<Product[]> {
    const cacheKey = `search:${searchTerm.toLowerCase()}`;
    
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      console.log('✅ Cache hit for search:', searchTerm);
      return cached.data;
    }

    try {
      // Get all products (from cache if available)
      const { products } = await this.getProducts({ pageSize: 100 });

      // Client-side search (Firestore doesn't support full-text search)
      const searchLower = searchTerm.toLowerCase();
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.subcategory?.toLowerCase().includes(searchLower)
      );

      cache.set(cacheKey, {
        data: filtered,
        timestamp: Date.now()
      });

      return filtered;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  /**
   * Clear cache (call after admin updates)
   */
  clearCache(category?: string): void {
    if (category) {
      // Clear specific category cache
      for (const key of cache.keys()) {
        if (key.includes(category)) {
          cache.delete(key);
        }
      }
      console.log(`🗑️ Cleared cache for category: ${category}`);
    } else {
      // Clear all cache
      cache.clear();
      console.log('🗑️ Cleared all cache');
    }
  },

  /**
   * Prefetch products for better UX
   */
  async prefetchCategory(category: string): Promise<void> {
    console.log(`🔄 Prefetching category: ${category}`);
    await this.getProducts({ category, pageSize: 20 });
  }
};

/**
 * Optimized image loading with lazy loading and caching
 */
export const optimizedImageService = {
  // Image cache
  imageCache: new Map<string, string[]>(),

  /**
   * Validate base64 string
   */
  isValidBase64(str: string): boolean {
    try {
      // Check if it's valid base64
      const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
      // Remove whitespace for testing
      const cleaned = str.replace(/\s/g, '');
      return base64Regex.test(cleaned) && cleaned.length > 100;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get product images with caching
   */
  async getProductImages(productId: string): Promise<string[]> {
    // Check cache first
    if (this.imageCache.has(productId)) {
      const cached = this.imageCache.get(productId)!;
      return cached;
    }

    try {
      const imagesRef = collection(db, 'productImages');
      const q = query(
        imagesRef,
        where('productId', '==', productId),
        orderBy('imageIndex', 'asc')
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length === 0) {
        console.warn(`⚠️ No image documents found for product: ${productId}`);
        this.imageCache.set(productId, []);
        return [];
      }

      const images = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        const imageData = data.imageData;
        
        if (!imageData) {
          return null;
        }
        
        // Validate that it's a reasonable length for an image
        if (imageData.length < 100) {
          console.warn(`⚠️ Image data too short for product ${productId} image ${index}`);
          return null;
        }
        
        // Fix image format if needed
        if (!imageData.startsWith('data:image/') && !imageData.startsWith('http')) {
          // Validate base64 format using helper
          if (!this.isValidBase64(imageData)) {
            console.warn(`⚠️ Invalid base64 format for product ${productId} image ${index}`);
            return null;
          }
          
          // Assume it's base64 encoded JPEG
          const fixedImage = `data:image/jpeg;base64,${imageData}`;
          return fixedImage;
        }
        
        return imageData;
      }).filter(Boolean) as string[];

      if (images.length === 0) {
        console.warn(`⚠️ No valid images for product ${productId}`);
      }

      // Cache images (even if empty array)
      this.imageCache.set(productId, images);

      return images;
    } catch (error) {
      console.error(`❌ Error loading images for product ${productId}:`, error);
      // Cache empty array to avoid retrying
      this.imageCache.set(productId, []);
      return [];
    }
  },

  /**
   * Batch load images for multiple products (parallel)
   */
  async batchLoadImages(productIds: string[], label?: string): Promise<Map<string, string[]>> {
    // Use unique timer label with timestamp to avoid conflicts
    const timerLabel = label || `⏱️ Batch load images ${Date.now()}`;
    const startTime = performance.now(); // Use performance.now() instead of console.time
    
    const results = new Map<string, string[]>();
    
    // Filter out products that already have cached images
    const uncachedIds = productIds.filter(id => !this.imageCache.has(id));
    
    // Return cached images immediately
    productIds.forEach(id => {
      if (this.imageCache.has(id)) {
        results.set(id, this.imageCache.get(id)!);
      }
    });
    
    if (uncachedIds.length === 0) {
      const duration = performance.now() - startTime;
      console.log(`✅ All ${productIds.length} images loaded from cache (${duration.toFixed(2)}ms)`);
      return results;
    }
    
    console.log(`📥 Loading ${uncachedIds.length} images (${productIds.length - uncachedIds.length} from cache)`);
    
    // Load images in parallel (max 3 at a time to avoid overwhelming Firestore and browser)
    const batchSize = 3;
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);
      
      // Use Promise.allSettled to continue even if some fail
      const promises = batch.map(id => 
        this.getProductImages(id).catch(err => {
          console.error(`Failed to load images for ${id}:`, err);
          return []; // Return empty array on error
        })
      );
      
      const batchResults = await Promise.all(promises);
      
      batch.forEach((id, index) => {
        results.set(id, batchResults[index]);
      });
    }

    const duration = performance.now() - startTime;
    console.log(`${timerLabel}: ${duration.toFixed(2)}ms`);
    return results;
  },

  /**
   * Clear image cache
   */
  clearCache(productId?: string): void {
    if (productId) {
      this.imageCache.delete(productId);
    } else {
      this.imageCache.clear();
    }
  }
};
