import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { dispatch } = useCart();
  const [imageError, setImageError] = useState(false);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({
      type: 'ADD_ITEM',
      payload: { product, quantity: 1 }
    });
  };

  const getImageSrc = () => {
    if (imageError || hasTriedFallback) {
      return 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
    }

    const firstImage = product.images?.[0];
    console.log(`🔍 ProductCard processing image for ${product.name}:`, {
      hasImages: !!product.images,
      imageCount: product.images?.length || 0,
      firstImageType: typeof firstImage,
      firstImageLength: firstImage?.length || 0,
      firstImageStart: firstImage?.substring(0, 30) || 'N/A'
    });
    
    if (firstImage && typeof firstImage === 'string' && firstImage.length > 100) {
      // Check if it's a proper data URL
      if (firstImage.startsWith('data:image/')) {
        console.log(`✅ ProductCard: Using proper data URL for ${product.name}`);
        return firstImage;
      } else if (firstImage.startsWith('/9j/') || firstImage.match(/^[A-Za-z0-9+/]/)) {
        // If it's raw base64 without data URL prefix, add it
        console.log(`🔧 ProductCard: Adding data URL prefix for ${product.name}`);
        return `data:image/jpeg;base64,${firstImage}`;
      }
    }
    
    console.log(`⚠️ ProductCard: Using fallback image for ${product.name}`);
    return 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
  };

  return (
    <div 
      className="group cursor-pointer h-full"
      onClick={() => window.location.href = `/product/${product.id}`}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
        <div className="relative overflow-hidden">
          <img
            src={getImageSrc()}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              if (!hasTriedFallback) {
                console.error(`❌ ProductCard image failed for ${product.name}, trying fallback`);
                setImageError(true);
                setHasTriedFallback(true);
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
              }
            }}
            onLoad={() => {
              console.log(`✅ ProductCard image loaded successfully for ${product.name}`);
            }}
          />
          
          
          {/* Quick Add to Cart - Hidden by default, shows on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(e);
              }}
              disabled={!product.inStock}
              className="opacity-0 group-hover:opacity-100 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200 transform scale-95 group-hover:scale-100 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
            >
              <ShoppingCart className="h-4 w-4 inline mr-1" />
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline space-x-2">
              {product.isMultiSize && product.sizeOptions && product.sizeOptions.length > 0 ? (
                // For multi-size products, show the base size price by default
                (() => {
                  const baseSizeOption = product.sizeOptions[0];
                  const originalPrice = baseSizeOption.originalPrice ?? 0;
                  const hasDiscount = originalPrice > baseSizeOption.price;
                  
                  return (
                    <>
                      <span className="text-xl font-bold text-purple-600">₹{baseSizeOption.price}</span>
                      {hasDiscount && originalPrice > 0 && (
                        <>
                          <span className="text-sm text-gray-500 line-through">₹{originalPrice}</span>
                          <span className="text-xs font-semibold text-red-600">
                            {Math.round(((originalPrice - baseSizeOption.price) / originalPrice) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </>
                  );
                })()
              ) : product.originalPrice && product.originalPrice > product.price ? (
                // For single products with discount
                <>
                  <span className="text-xl font-bold text-purple-600">₹{product.price}</span>
                  <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                  <span className="text-xs font-semibold text-red-600">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              ) : (
                // For single products without discount
                <span className="text-xl font-bold text-purple-600">
                  ₹{product.price}
                </span>
              )}
            </div>
            {product.isMultiSize && product.sizeOptions && product.sizeOptions.length > 0 ? (
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {product.sizeOptions[0].size}
              </span>
            ) : product.size ? (
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {product.size}
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between mt-auto">
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              product.inStock
                ? 'text-green-600 bg-green-100'
                : 'text-red-600 bg-red-100'
            }`}>
              {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(e);
              }}
              disabled={!product.inStock}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;