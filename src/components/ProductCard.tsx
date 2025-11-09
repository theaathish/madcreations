import React, { useState } from 'react';
import { ShoppingCart, Lock } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { state, dispatch } = useCart();
  const [imageError, setImageError] = useState(false);

  // Check if split poster requirements are met
  const checkSplitPosterRequirements = () => {
    if (product.category !== 'split_poster') return { canAdd: true, message: '' };
    
    const splitPosterItems = state.items.filter(item => item.product.category === 'split_poster');
    const a4PosterItems = state.items.filter(item => 
      (item.product.category === 'poster' || item.product.category === 'customizable') && 
      (item.customizations?.size === 'A4' || item.product.size === 'A4')
    );
    
    const hasSplitPoster = splitPosterItems.length > 0;
    const hasA4Poster = a4PosterItems.length > 0;
    
    if (!hasSplitPoster && !hasA4Poster) {
      return { canAdd: false, message: 'Please add 1 Split Poster and 1 A4 Poster to continue.' };
    } else if (!hasA4Poster) {
      return { canAdd: false, message: 'Please add 1 A4 Poster to enable Split Poster checkout.' };
    }
    
    return { canAdd: true, message: '' };
  };

  // Check if poster minimum quantity is met
  const checkPosterMinimum = () => {
    if (product.category !== 'poster' && product.category !== 'customizable') return { canAdd: true, message: '' };
    
    const posterItems = state.items.filter(item => 
      item.product.category === 'poster' || item.product.category === 'customizable'
    );
    const posterQuantity = posterItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // For the first poster, allow adding to cart but show message about minimum
    if (posterQuantity === 0) {
      return { canAdd: true, message: 'Minimum 3 posters required for checkout.' };
    }
    
    return { canAdd: true, message: '' };
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check requirements for split posters
    const splitRequirement = checkSplitPosterRequirements();
    if (!splitRequirement.canAdd) {
      alert(splitRequirement.message);
      return;
    }
    
    // Add to cart with appropriate quantity
    let quantity = 1;
    
    // For posters and custom products, suggest minimum quantity
    if (product.category === 'poster' || product.category === 'customizable') {
      const posterItems = state.items.filter(item => 
        item.product.category === 'poster' || item.product.category === 'customizable'
      );
      const currentPosterQuantity = posterItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // If this is the first poster item, add 3 to meet minimum
      if (currentPosterQuantity === 0) {
        quantity = 3;
      }
    }
    
    dispatch({
      type: 'ADD_ITEM',
      payload: { product, quantity }
    });
    
    // Show success message with any additional info
    const posterRequirement = checkPosterMinimum();
    if (posterRequirement.message) {
      setTimeout(() => alert(`Added to cart! ${posterRequirement.message}`), 100);
    }
  };

  const getImageSrc = () => {
    // If there was an error, use fallback immediately
    if (imageError) {
      return 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
    }

    const firstImage = product.images?.[0];
    
    // If no images array or empty, use fallback
    if (!product.images || product.images.length === 0 || !firstImage) {
      return 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
    }
    
    // If not a string, use fallback
    if (typeof firstImage !== 'string') {
      return 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
    }
    
    // If it's already a valid URL (http/https), return it
    if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
      return firstImage;
    }
    
    // Check if it's a proper data URL
    if (firstImage.startsWith('data:image/')) {
      return firstImage;
    }
    
    // If the string is too short to be base64, use fallback
    if (firstImage.length < 100) {
      return 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
    }
    
    // If it's raw base64 without data URL prefix, add it
    if (firstImage.startsWith('/9j/') || firstImage.match(/^[A-Za-z0-9+/]/)) {
      return `data:image/jpeg;base64,${firstImage}`;
    }
    
    // Fallback if format is unrecognized
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
            onError={() => {
              // Only handle error once to prevent infinite loop
              // Silently set error state and let fallback image load
              if (!imageError) {
                setImageError(true);
              }
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
            
            {(() => {
              const splitRequirement = checkSplitPosterRequirements();
              const isDisabled = !product.inStock || !splitRequirement.canAdd;
              
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(e);
                  }}
                  disabled={isDisabled}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    isDisabled
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  title={!splitRequirement.canAdd ? splitRequirement.message : ''}
                >
                  {!splitRequirement.canAdd ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <span>
                    {!product.inStock 
                      ? 'Out of Stock' 
                      : !splitRequirement.canAdd 
                        ? 'Locked' 
                        : 'Add to Cart'
                    }
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;