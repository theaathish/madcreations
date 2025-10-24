import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Package
} from 'lucide-react';
import { productsService, imageService } from '../services/firebaseService';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedSizeOption, setSelectedSizeOption] = useState<{size: string, price: number, originalPrice?: number} | null>(null);
  const { dispatch } = useCart();

  // Available size options (fallback for legacy products)
  const defaultSizeOptions = ['A4', '12x9', 'A3'];

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      console.log(`🔍 Loading product detail for ID: ${productId}`);
      
      // Get basic product data
      const productData = await productsService.getProduct(productId);
      console.log('📦 Basic product data loaded:', productData);
      
      if (productData) {
        // Load images from tree structure
        try {
          const productImages = await imageService.getProductImages(productId);
          const imageUrls = productImages.map(img => img.imageData);
          
          console.log(`🖼️ Found ${productImages.length} images for product ${productId}`);
          
          // Enhanced image validation (same as ProductList)
          const validImages = imageUrls.filter((url, index) => {
            if (!url) {
              console.warn(`Product ${productId}: Image ${index} is null/undefined`);
              return false;
            }
            
            if (typeof url !== 'string') {
              console.warn(`Product ${productId}: Image ${index} is not a string:`, typeof url);
              return false;
            }
            
            if (!url.startsWith('data:image/')) {
              console.warn(`Product ${productId}: Image ${index} doesn't start with data:image/:`, url.substring(0, 50));
              return false;
            }
            
            if (url.length < 100) {
              console.warn(`Product ${productId}: Image ${index} is too short (${url.length} chars)`);
              return false;
            }
            
            // Check if it's a valid base64 image
            try {
              const base64Data = url.split(',')[1];
              if (!base64Data || base64Data.length < 50) {
                console.warn(`Product ${productId}: Image ${index} has invalid base64 data`);
                return false;
              }
              
              console.log(`✅ Product ${productId}: Image ${index} is valid (${(url.length / 1024 / 1024).toFixed(2)}MB)`);
              return true;
            } catch (error) {
              console.warn(`Product ${productId}: Image ${index} base64 validation failed:`, error);
              return false;
            }
          });
          
          console.log(`📸 Valid images: ${validImages.length}/${imageUrls.length}`);
          
          // Update product with loaded images
          const productWithImages = {
            ...productData,
            images: validImages.length > 0 ? validImages : ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400']
          };
          
          setProduct(productWithImages);
        } catch (imageError) {
          console.error('Error loading product images:', imageError);
          // Use product data with fallback image if image loading fails
          setProduct({
            ...productData,
            images: ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400']
          });
        }
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleSizeSelection = (size: string) => {
    setSelectedSize(size);
    
    // Find the selected size option for multi-size products
    if (product?.isMultiSize && product.sizeOptions) {
      const sizeOption = product.sizeOptions.find(option => option.size === size);
      setSelectedSizeOption(sizeOption || null);
    } else {
      setSelectedSizeOption(null);
    }
  };

  const getCurrentPrice = () => {
    if (product?.isMultiSize && selectedSizeOption) {
      return selectedSizeOption.price;
    }
    return product?.price || 0;
  };

  const getCurrentOriginalPrice = () => {
    if (product?.isMultiSize && selectedSizeOption) {
      return selectedSizeOption.originalPrice;
    }
    return product?.originalPrice;
  };

  const handleAddToCart = () => {
    if (product && selectedSize) {
      // Create a modified product with the selected size price
      const productForCart = {
        ...product,
        price: getCurrentPrice(),
        originalPrice: getCurrentOriginalPrice()
      };
      
      dispatch({
        type: 'ADD_ITEM',
        payload: { 
          product: productForCart, 
          quantity,
          customizations: { 
            size: selectedSize,
            sizePrice: getCurrentPrice()
          }
        }
      });
      alert(`Added ${quantity} ${product.name}(s) (${selectedSize}) to cart!`);
    } else if (!selectedSize) {
      alert('Please select a size before adding to cart!');
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Loading */}
          <div className="mb-8">
            <div className="h-6 bg-gray-300 rounded w-32 animate-pulse mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-96 animate-pulse"></div>
          </div>

          {/* Main Content Loading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images Loading */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-300 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-300 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Product Info Loading */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4 animate-pulse"></div>
              </div>

              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </div>

              <div className="space-y-4">
                <div className="h-12 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-purple-600">Home</Link>
          <span>/</span>
          <Link to={`/${product.category}`} className="hover:text-purple-600 capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-purple-600 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-md">
              <img
                src={(() => {
                  // Enhanced image selection for main image
                  if (product.images && product.images.length > 0 && product.images[selectedImage]) {
                    const selectedImg = product.images[selectedImage];
                    if (selectedImg && typeof selectedImg === 'string' && selectedImg.length > 100) {
                      console.log(`🖼️ Displaying main image ${selectedImage} for ${product.name} (${(selectedImg.length / 1024).toFixed(1)}KB)`);
                      console.log(`📸 Image starts with: ${selectedImg.substring(0, 50)}...`);
                      
                      // Ensure proper data URL format
                      if (selectedImg.startsWith('data:image/')) {
                        return selectedImg;
                      } else if (selectedImg.startsWith('/9j/') || selectedImg.match(/^[A-Za-z0-9+/]/) ) {
                        // If it's raw base64 without data URL prefix, add it
                        console.log('🔧 Adding data URL prefix to base64 image');
                        return `data:image/jpeg;base64,${selectedImg}`;
                      }
                    }
                  }
                  
                  console.warn(`⚠️ Main image ${selectedImage} not valid for ${product.name}, using fallback`);
                  return 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
                })()}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`❌ Main image failed to load for ${product.name}`);
                  console.error('📸 Available images:', product.images?.map((img, i) => `${i}: ${img?.substring(0, 50)}...`));
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
                }}
                onLoad={() => {
                  console.log(`✅ Main image loaded successfully for ${product.name}`);
                }}
              />
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => {
                  // Enhanced validation for each thumbnail image
                  let processedImage = image;
                  let isValidImage = false;
                  
                  if (image && typeof image === 'string' && image.length > 100) {
                    if (image.startsWith('data:image/')) {
                      processedImage = image;
                      isValidImage = true;
                    } else if (image.startsWith('/9j/') || image.match(/^[A-Za-z0-9+/]/)) {
                      // If it's raw base64 without data URL prefix, add it
                      processedImage = `data:image/jpeg;base64,${image}`;
                      isValidImage = true;
                      console.log(`🔧 Fixed thumbnail ${index} data URL format`);
                    }
                  }
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-white rounded-lg overflow-hidden shadow-sm border-2 transition-all ${
                        selectedImage === index ? 'border-purple-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={isValidImage ? processedImage : 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`❌ Thumbnail ${index} failed to load for ${product.name}`);
                          console.error(`📸 Thumbnail data: ${image?.substring(0, 50)}...`);
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                        onLoad={() => {
                          if (isValidImage) {
                            console.log(`✅ Thumbnail ${index} loaded for ${product.name}`);
                          }
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Title and Price */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor((product as any).ratings || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {(product as any).ratings || 0}/5 ({(product as any).reviewCount || 0} reviews)
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {product.originalPrice && product.originalPrice > product.price ? (
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-purple-600">₹{product.price}</span>
                    <span className="text-xl text-gray-500 line-through">₹{product.originalPrice}</span>
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-sm font-semibold">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                ) : product.isMultiSize && selectedSizeOption && selectedSizeOption.originalPrice && selectedSizeOption.originalPrice > selectedSizeOption.price ? (
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-purple-600">₹{selectedSizeOption.price}</span>
                    <span className="text-xl text-gray-500 line-through">₹{selectedSizeOption.originalPrice}</span>
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-sm font-semibold">
                      {Math.round(((selectedSizeOption.originalPrice - selectedSizeOption.price) / selectedSizeOption.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-purple-600">
                    ₹{product.isMultiSize && selectedSizeOption ? selectedSizeOption.price : product.price}
                  </span>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium capitalize">{product.category}</span>
                </div>
                {(product as any).subcategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subcategory:</span>
                    <span className="font-medium">{(product as any).subcategory}</span>
                  </div>
                )}
                {(product as any).size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{(product as any).size}</span>
                  </div>
                )}
                {(product as any).theme && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Theme:</span>
                    <span className="font-medium">{(product as any).theme}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Free Shipping</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Quality Guaranteed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <RotateCcw className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-700">Easy Returns</span>
                </div>
              </div>
            </div>

            {/* Add to Cart Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {/* Size Selection */}
              <div className="mb-4 sm:mb-6">
                <span className="text-base sm:text-lg font-semibold text-gray-900 block mb-3">Select Size:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {(product?.isMultiSize && product.sizeOptions ? product.sizeOptions : 
                    defaultSizeOptions.map(size => ({ size, price: product?.price || 0 }))
                  ).map((sizeOption) => (
                    <button
                      key={sizeOption.size}
                      onClick={() => handleSizeSelection(sizeOption.size)}
                      className={`p-3 border-2 rounded-lg text-center font-medium transition-colors ${
                        selectedSize === sizeOption.size
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{sizeOption.size}</span>
                        {product?.isMultiSize && (
                          <span className="text-xs text-purple-600 mt-1">₹{sizeOption.price}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {!selectedSize && (
                  <p className="text-sm text-red-600 mt-2">Please select a size</p>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">Quantity:</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg font-bold">-</span>
                  </button>
                  <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 10}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg font-bold">+</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || !selectedSize}
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className={`p-3 border-2 rounded-lg transition-colors ${
                    isWishlisted
                      ? 'border-red-500 text-red-500 bg-red-50'
                      : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-3 border-2 border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-500 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Why Choose MadCreations?</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>High-quality prints on premium materials</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Fast and secure delivery</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>100% satisfaction guarantee</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Customizable options available</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
