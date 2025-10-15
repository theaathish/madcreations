/**
 * Sitemap Generator for MadCreations
 * Generates XML sitemaps for better SEO
 */

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate XML sitemap
 */
export const generateSitemap = (urls: SitemapURL[]): string => {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';

  const urlEntries = urls.map(url => {
    let entry = `  <url>\n    <loc>${url.loc}</loc>`;
    
    if (url.lastmod) {
      entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
    }
    
    if (url.changefreq) {
      entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
    }
    
    if (url.priority !== undefined) {
      entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
    }
    
    entry += '\n  </url>';
    return entry;
  }).join('\n');

  return `${xmlHeader}\n${urlsetOpen}\n${urlEntries}\n${urlsetClose}`;
};

/**
 * Generate static pages sitemap
 */
export const generateStaticSitemap = (): string => {
  const baseUrl = 'https://madcreations.vercel.app';
  const today = new Date().toISOString().split('T')[0];

  const urls: SitemapURL[] = [
    {
      loc: baseUrl,
      lastmod: today,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/posters`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/polaroids`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/bundles`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/customizable`,
      lastmod: today,
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/products`,
      lastmod: today,
      changefreq: 'daily',
      priority: 0.9
    }
  ];

  return generateSitemap(urls);
};

/**
 * Generate product sitemap from product data
 */
export const generateProductSitemap = (products: Array<{
  id: string;
  updatedAt?: any;
}>): string => {
  const baseUrl = 'https://madcreations.vercel.app';

  const urls: SitemapURL[] = products.map(product => ({
    loc: `${baseUrl}/product/${product.id}`,
    lastmod: product.updatedAt 
      ? new Date(product.updatedAt.toDate()).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.7
  }));

  return generateSitemap(urls);
};

/**
 * Generate sitemap index (for multiple sitemaps)
 */
export const generateSitemapIndex = (sitemaps: Array<{ loc: string; lastmod?: string }>): string => {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const sitemapindexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const sitemapindexClose = '</sitemapindex>';

  const sitemapEntries = sitemaps.map(sitemap => {
    let entry = `  <sitemap>\n    <loc>${sitemap.loc}</loc>`;
    
    if (sitemap.lastmod) {
      entry += `\n    <lastmod>${sitemap.lastmod}</lastmod>`;
    }
    
    entry += '\n  </sitemap>';
    return entry;
  }).join('\n');

  return `${xmlHeader}\n${sitemapindexOpen}\n${sitemapEntries}\n${sitemapindexClose}`;
};

/**
 * Example usage - Save this to public/sitemap.xml
 */
export const generateMainSitemap = async (): Promise<string> => {
  const baseUrl = 'https://madcreations.vercel.app';
  const today = new Date().toISOString().split('T')[0];

  // You would fetch products from Firebase here
  // For now, we'll create a static sitemap
  
  const sitemapIndex = generateSitemapIndex([
    {
      loc: `${baseUrl}/sitemap-static.xml`,
      lastmod: today
    },
    {
      loc: `${baseUrl}/sitemap-products.xml`,
      lastmod: today
    },
    {
      loc: `${baseUrl}/sitemap-categories.xml`,
      lastmod: today
    }
  ]);

  return sitemapIndex;
};
