import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, HeadphonesIcon, Image, Camera, Package, Palette } from 'lucide-react';
import { productsService, imageService } from '../services/firebaseService';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoading(true);
        console.log('Loading featured products...');
        
        // Try to get featured products first
        let products = await productsService.getFeaturedProducts();
        console.log('Featured products found:', products.length);
        
        // If no featured products, get some recent products as fallback
        if (products.length === 0) {
          console.log('No featured products found, loading recent products as fallback...');
          const allProducts = await productsService.getAllProducts();
          
          // Take first 4 products as featured fallback
          products = allProducts.slice(0, 4);
          console.log('Using fallback products:', products.length);
        }
        
        // Load images from Firebase for each product
        const productsWithImages = await Promise.all(
          products.map(async (product) => {
            try {
              console.log(`🖼️ Home: Loading images for ${product.name}`);
              
              // Get images from the separate productImages collection
              const productImages = await imageService.getProductImages(product.id);
              const imageUrls = productImages.map(img => img.imageData);
              
              console.log(`📸 Home: Found ${productImages.length} images for ${product.name}`);
              
              // Validate and fix image format
              const validImages = imageUrls.filter((url, index) => {
                if (!url || typeof url !== 'string' || url.length < 100) {
                  console.warn(`⚠️ Home ${product.name}: Image ${index} is invalid`);
                  return false;
                }
                
                if (url.startsWith('data:image/')) {
                  return true;
                } else if (url.startsWith('/9j/') || url.match(/^[A-Za-z0-9+/]/)) {
                  return true;
                } else {
                  console.warn(`⚠️ Home ${product.name}: Image ${index} has unknown format`);
                  return false;
                }
              });
              
              // Fix image format if needed
              const fixedImages = validImages.map(img => {
                if (img.startsWith('data:image/')) {
                  return img;
                } else if (img.startsWith('/9j/') || img.match(/^[A-Za-z0-9+/]/)) {
                  return `data:image/jpeg;base64,${img}`;
                }
                return img;
              });
              
              console.log(`✅ Home ${product.name}: Final valid images: ${fixedImages.length}`);
              
              return {
                ...product,
                images: fixedImages.length > 0 ? fixedImages : ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400']
              };
            } catch (error) {
              console.error(`❌ Home: Error loading images for ${product.name}:`, error);
              return {
                ...product,
                images: ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400']
              };
            }
          })
        );
        
        setFeaturedProducts(productsWithImages);
      } catch (error) {
        console.error('Error loading featured products:', error);
        
        // Set fallback products on error
        const fallbackProducts: Product[] = [
          {
            id: 'fallback-1',
            name: 'Sample Poster 1',
            description: 'Beautiful artwork for your walls',
            price: 199,
            images: ['https://images.pexels.com/photos/3945313/pexels-photo-3945313.jpeg'],
            category: 'poster',
            subcategory: 'Art',
            inStock: true,
            featured: true,
            ratings: 5,
            reviewCount: 25
          },
          {
            id: 'fallback-2',
            name: 'Sample Poster 2',
            description: 'Amazing design collection',
            price: 299,
            images: ['https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg'],
            category: 'poster',
            subcategory: 'Design',
            inStock: true,
            featured: true,
            ratings: 4.8,
            reviewCount: 18
          },
          {
            id: 'fallback-3',
            name: 'Sample Polaroid',
            description: 'Custom polaroid prints',
            price: 149,
            images: ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg'],
            category: 'polaroid',
            subcategory: 'Custom',
            inStock: true,
            featured: true,
            ratings: 4.9,
            reviewCount: 32
          },
          {
            id: 'fallback-4',
            name: 'Sample Bundle',
            description: 'Great value bundle pack',
            price: 499,
            images: ['https://images.pexels.com/photos/6291574/pexels-photo-6291574.jpeg'],
            category: 'bundle',
            subcategory: 'Value Pack',
            inStock: true,
            featured: true,
            ratings: 4.7,
            reviewCount: 15
          }
        ];
        
        setFeaturedProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const categories = [
    {
      name: 'Posters',
      description: 'High-quality posters in various sizes',
      icon: Image,
      gradient: 'from-purple-500 to-pink-500',
      link: '/posters',
      count: '500+'
    },
    {
      name: 'Polaroids',
      description: 'Vintage-style polaroid prints',
      icon: Camera,
      gradient: 'from-blue-500 to-cyan-500',
      link: '/polaroids',
      count: '300+'
    },
    {
      name: 'Bundles',
      description: 'Great value combo packs',
      icon: Package,
      gradient: 'from-orange-500 to-red-500',
      link: '/bundles',
      count: '50+'
    },
    {
      name: 'Customizable',
      description: 'Create your own designs',
      icon: Palette,
      gradient: 'from-green-500 to-teal-500',
      link: '/customizable',
      count: 'Unlimited'
    }
  ];

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free standard delivery on all orders'
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'Premium materials and printing'
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Customer support whenever you need'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
       
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Transform Your Space with
              <span className="block text-yellow-300 mt-2">Amazing Artwork</span>
            </h1>
            <p className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
              Discover thousands of high-quality posters, vintage polaroids, and custom designs. 
              From anime to movies, sports to motivational quotes - we have it all.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/posters"
                className="w-full sm:w-auto bg-white text-purple-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center shadow-lg"
              >
                Shop Posters
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/customizable"
                className="w-full sm:w-auto border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white hover:text-purple-700 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center"
              >
                Create Custom Design
              </Link>
            </div>
            
            
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our diverse collection of products designed to suit every taste and style
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Link
                  key={index}
                  to={category.link}
                  className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`h-64 bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                    <IconComponent className="w-24 h-24 text-white opacity-90" strokeWidth={1.5} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                    <p className="text-sm opacity-90 mb-2">{category.description}</p>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {category.count} items
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hand-picked favorites that our customers love the most
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeleton
              [...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No featured products available at the moment.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rahul Sharma',
                rating: 5,
                review: 'Amazing quality posters! The Naruto poster looks incredible on my wall. Fast delivery too!',
                product: 'Naruto Poster'
              },
              {
                name: 'Priya Patel',
                rating: 5,
                review: 'Love the custom Spotify frame polaroid! Perfect gift for my boyfriend. Highly recommended!',
                product: 'Custom Spotify Polaroid'
              },
              {
                name: 'Arjun Kumar',
                rating: 4,
                review: 'Great bundle deals and excellent customer service. The quality exceeded my expectations.',
                product: 'Anime Bundle'
              }
            ].map((review, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{review.review}"</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{review.name}</p>
                  <p className="text-sm text-gray-600">Purchased: {review.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;