/**
 * SEO Utilities for MadCreations
 * Dynamic meta tags, schema markup, and SEO optimization
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
  category?: string;
  location?: string;
}

/**
 * Update document meta tags dynamically
 */
export const updateMetaTags = (config: SEOConfig): void => {
  const baseUrl = 'https://madcreations.vercel.app';
  const defaultImage = `${baseUrl}/og-image.jpg`;

  // Update title
  document.title = config.title;

  // Helper to update or create meta tag
  const setMetaTag = (selector: string, content: string) => {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      const attr = selector.includes('property=') ? 'property' : 'name';
      const value = selector.match(/["']([^"']+)["']/)?.[1];
      if (value) {
        element.setAttribute(attr, value);
        document.head.appendChild(element);
      }
    }
    element.setAttribute('content', content);
  };

  // Primary meta tags
  setMetaTag('meta[name="title"]', config.title);
  setMetaTag('meta[name="description"]', config.description);
  if (config.keywords) {
    setMetaTag('meta[name="keywords"]', config.keywords);
  }

  // Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (canonical) {
    canonical.href = config.url || baseUrl;
  }

  // Open Graph
  setMetaTag('meta[property="og:title"]', config.title);
  setMetaTag('meta[property="og:description"]', config.description);
  setMetaTag('meta[property="og:image"]', config.image || defaultImage);
  setMetaTag('meta[property="og:url"]', config.url || baseUrl);
  setMetaTag('meta[property="og:type"]', config.type || 'website');

  // Twitter
  setMetaTag('meta[property="twitter:title"]', config.title);
  setMetaTag('meta[property="twitter:description"]', config.description);
  setMetaTag('meta[property="twitter:image"]', config.image || defaultImage);

  // Geo tags for location-based SEO
  if (config.location) {
    setMetaTag('meta[name="geo.placename"]', config.location);
  }
};

/**
 * Generate Product Schema Markup
 */
export const generateProductSchema = (product: {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  image: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
  category?: string;
  brand?: string;
}): string => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'MadCreations'
    },
    offers: {
      '@type': 'Offer',
      url: `https://madcreations.vercel.app/product/${product.id}`,
      priceCurrency: product.currency || 'INR',
      price: product.price,
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  };

  // Add aggregateRating if available
  if (product.rating && product.reviewCount) {
    (schema as any).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  // Add category
  if (product.category) {
    (schema as any).category = product.category;
  }

  return JSON.stringify(schema);
};

/**
 * Generate Breadcrumb Schema Markup
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>): string => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return JSON.stringify(schema);
};

/**
 * Generate Local Business Schema Markup
 */
export const generateLocalBusinessSchema = (location: {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  latitude?: number;
  longitude?: number;
}): string => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: location.name,
    image: 'https://madcreations.vercel.app/logo.png',
    '@id': 'https://madcreations.vercel.app',
    url: 'https://madcreations.vercel.app',
    telephone: location.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.address,
      addressLocality: location.city,
      addressRegion: location.state,
      postalCode: location.postalCode,
      addressCountry: 'IN'
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00'
    },
    priceRange: '₹₹'
  };

  // Add geo coordinates if available
  if (location.latitude && location.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: location.latitude,
      longitude: location.longitude
    };
  }

  return JSON.stringify(schema);
};

/**
 * Generate FAQ Schema Markup
 */
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>): string => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return JSON.stringify(schema);
};

/**
 * Inject schema markup into page
 */
export const injectSchema = (schema: string, id: string = 'dynamic-schema'): void => {
  // Remove existing schema with same ID
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  // Create and inject new schema
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = schema;
  document.head.appendChild(script);
};

/**
 * SEO-friendly URL slug generator
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Get location-specific keywords
 */
export const getLocationKeywords = (baseKeyword: string, location: string): string[] => {
  return [
    `${baseKeyword} in ${location}`,
    `${baseKeyword} ${location}`,
    `buy ${baseKeyword} ${location}`,
    `${location} ${baseKeyword}`,
    `best ${baseKeyword} in ${location}`,
    `${baseKeyword} near ${location}`,
    `${baseKeyword} delivery ${location}`
  ];
};

/**
 * Generate long-tail keywords
 */
export const generateLongTailKeywords = (baseKeyword: string): string[] => {
  const modifiers = [
    'buy', 'cheap', 'best', 'online', 'custom', 'personalized',
    'premium', 'quality', 'affordable', 'discount', 'sale',
    'free shipping', 'fast delivery', 'same day', 'bulk order'
  ];

  return modifiers.map(modifier => `${modifier} ${baseKeyword}`);
};

/**
 * Detect user location (requires geolocation API)
 */
export const detectUserLocation = (): Promise<{ city: string; state: string; country: string } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // You would typically use a geocoding API here
          // For now, return default location
          resolve({
            city: 'Chennai',
            state: 'Tamil Nadu',
            country: 'India'
          });
        } catch (error) {
          console.error('Error detecting location:', error);
          resolve(null);
        }
      },
      () => {
        resolve(null);
      }
    );
  });
};

/**
 * Track page view for analytics
 */
export const trackPageView = (url: string, title: string): void => {
  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url,
      page_title: title
    });
  }

  // You can add other analytics here
  console.log('Page view tracked:', { url, title });
};
