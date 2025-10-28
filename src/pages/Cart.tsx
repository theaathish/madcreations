import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Truck, Lock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { OrderItem, CartItem } from '../types';
import { sanitizeForFirestore, getFirebaseErrorMessage } from '../utils/errorHandler';

const Cart: React.FC = () => {
  const { state, dispatch } = useCart();
  const { user, userProfile } = useAuth();
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Calculate cart totals and check minimum order quantity
  
  // Check minimum order requirements by category
  const posterItems = state.items.filter(item => 
    item.product.category === 'poster' || item.product.category === 'customizable'
  );
  const splitPosterItems = state.items.filter(item => item.product.category === 'split_poster');
  const a4PosterItems = state.items.filter(item => 
    (item.product.category === 'poster' || item.product.category === 'customizable') && 
    (item.customizations?.size === 'A4' || item.product.size === 'A4')
  );
  
  const posterQuantity = posterItems.reduce((sum, item) => sum + item.quantity, 0);
  const splitPosterQuantity = splitPosterItems.reduce((sum, item) => sum + item.quantity, 0);
  const a4PosterQuantity = a4PosterItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Check minimum order requirements:
  // 1. Regular/Custom posters: minimum 3 pieces
  // 2. Split posters: need at least 1 split poster AND 1 A4 poster
  const posterMeetsMinimum = posterItems.length === 0 || posterQuantity >= 3;
  const splitPosterMeetsMinimum = splitPosterItems.length === 0 || 
    (splitPosterQuantity >= 1 && a4PosterQuantity >= 1);
  
  const meetsMinimumOrder = posterMeetsMinimum && splitPosterMeetsMinimum;
  
  // Generate minimum order message
  const getMinimumOrderMessage = () => {
    const messages = [];
    
    if (posterItems.length > 0 && posterQuantity < 3) {
      messages.push(`Add ${3 - posterQuantity} more poster(s) (minimum 3 required)`);
    }
    
    if (splitPosterItems.length > 0) {
      if (splitPosterQuantity < 1) {
        messages.push('Add at least 1 Split Poster');
      }
      if (a4PosterQuantity < 1) {
        messages.push('Add at least 1 A4 Poster');
      }
    }
    
    return messages.join(' • ');
  };
  const subtotal = state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingCost = shippingMethod === 'express' ? 100 : 50;
  const total = subtotal + shippingCost;

  const handleCheckout = async () => {
    if (!user) {
      setError('Please log in to place an order.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!userProfile?.phoneNumber) {
      setError('Please complete your profile with a phone number before placing an order.');
      setTimeout(() => navigate('/profile'), 2000);
      return;
    }

    // Validate minimum order requirements before processing
    if (!meetsMinimumOrder) {
      setError(`Minimum order quantity not met. ${getMinimumOrderMessage()}`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      // Prepare order items - sanitize customizations to avoid nested entity errors
      const orderItems: OrderItem[] = state.items.map(item => {
        // Get image URL (first image from array)
        const imageUrl = item.product.images?.[0] || '';
        
        // If imageUrl is base64, replace with placeholder to avoid Firestore issues
        const safeImageUrl = imageUrl.startsWith('data:image') 
          ? 'custom-image-uploaded' 
          : imageUrl;
        
        // Convert customizations to JSON string to avoid nested entity errors
        // This is the safest approach for complex nested structures
        const customizationsString = item.customizations 
          ? JSON.stringify(item.customizations)
          : '{}';
        
        // Create clean order item with flat structure
        const orderItem = {
          productId: String(item.product.id || ''),
          name: String(item.product.name || ''),
          price: Number(item.product.price) || 0,
          quantity: Number(item.quantity) || 1,
          imageUrl: String(safeImageUrl),
          customizations: customizationsString
        };
        
        return orderItem;
      });

      // Create order object using the correct type for Firebase
      // Ensure no undefined values are passed to Firestore
      const orderData = {
        userId: user.uid || '',
        customerName: userProfile?.displayName || user.displayName || 'User',
        customerEmail: userProfile?.email || user.email || '',
        customerPhone: userProfile?.phoneNumber || '',
        items: orderItems,
        subtotal: Number(subtotal) || 0,
        shippingCost: Number(shippingCost) || 0,
        total: Number(total) || 0,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        shippingAddress: {
          address: userProfile?.address || '',
          city: userProfile?.city || '',
          state: userProfile?.state || '',
          pincode: userProfile?.pincode || ''
        },
        shippingMethod: shippingMethod || 'standard' as const,
        notes: `Order placed via ${shippingMethod} shipping.` || ''
      };

      // Double-check: sanitize the entire order data structure
      const cleanOrderData = sanitizeForFirestore(orderData);
      
      // Log for debugging (remove in production)
      console.log('Order items count:', orderItems.length);
      console.log('Sample order item:', orderItems[0]);
      console.log('Submitting sanitized order:', {
        ...cleanOrderData,
        items: cleanOrderData.items?.length || 0
      });

      // Import ordersService and create order
      const { ordersService } = await import('../services/firebaseService');
      const orderId = await ordersService.createOrder(cleanOrderData);
      
      if (!orderId) {
        throw new Error('Failed to create order: No order ID returned');
      }

      console.log('Order created successfully with ID:', orderId);
      
      // Clear cart
      dispatch({ type: 'CLEAR_CART' });
      
      // Show success message
      alert(`Order placed successfully! Order ID: ${orderId}\nWe will contact you shortly for payment confirmation.`);
      
      // Redirect to Profile page with orders tab
      navigate('/profile', { state: { activeTab: 'orders' } });

    } catch (error: any) {
      console.error('Error placing order:', error);
      
      // Use centralized error handling
      const errorResponse = getFirebaseErrorMessage(error);
      const errorMessage = `${errorResponse.title}: ${errorResponse.message}${errorResponse.action ? ' ' + errorResponse.action : ''}`;
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQuantity = (productId: string, quantity: number, item: CartItem) => {
    // Set minimum quantity to 1 for all items
    const finalQuantity = Math.max(1, quantity);
    
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity: finalQuantity, size: item.customizations?.size }
    });
  };

  const removeItem = (productId: string, size?: string) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { productId, size }
    });
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch({ type: 'CLEAR_CART' });
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Looks like you haven't added any products to your cart yet.</p>
        <a
          href="/products"
          className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-sm text-red-600 hover:text-red-700 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Cart
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {state.items.length} {state.items.length === 1 ? 'Item' : 'Items'} in Cart
                </h2>
              </div>
              
              <ul className="divide-y divide-gray-200">
                {state.items.map((item) => (
                  <li key={item.product.id} className="p-6">
                    <div className="flex flex-col sm:flex-row">
                      <div className="flex-shrink-0">
                        <img
                          src={item.product.images?.[0] || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          className="w-32 h-32 object-cover rounded-md"
                        />
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.product.name}
                          </h3>
                          <p className="text-lg font-medium text-gray-900">
                            ₹{item.product.price * item.quantity}
                          </p>
                        </div>
                        {item.product.originalPrice && (
                          <p className="text-sm text-gray-500 line-through">
                            ₹{item.product.originalPrice * item.quantity}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          {item.product.category}
                          {item.customizations?.size && (
                            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Size: {item.customizations.size}
                            </span>
                          )}
                        </p>
                        
                        {/* Quantity Selector */}
                        <div className="mt-4 flex items-center">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item)}
                            className={`p-1 ${item.quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="mx-2 text-gray-700">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.product.id, item.customizations?.size)}
                            className="ml-4 text-red-600 hover:text-red-700 text-sm flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shippingMethod === 'express' ? 'Express (₹100)' : 'Normal (₹50)'}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-indigo-600"
                        checked={shippingMethod === 'standard'}
                        onChange={() => setShippingMethod('standard')}
                      />
                      <span className="ml-2 text-gray-700">Normal Delivery (5-7 days) - ₹50</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-indigo-600"
                        checked={shippingMethod === 'express'}
                        onChange={() => setShippingMethod('express')}
                      />
                      <span className="ml-2 text-gray-700">Express Delivery (2-3 days) - ₹100</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>

              {!meetsMinimumOrder ? (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-md z-10">
                    <div className="text-center p-4">
                      <Lock className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Minimum order requirements not met</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getMinimumOrderMessage()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-md text-white font-medium flex items-center justify-center bg-indigo-400 cursor-not-allowed relative opacity-50"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium flex items-center justify-center ${
                    isProcessing
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } transition-colors`}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              )}

              <p className="mt-4 text-center text-sm text-gray-500">
                or{' '}
                <a href="/products" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Continue Shopping
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Order Process Info */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">1. Order Placed</h4>
                <p className="mt-1 text-sm text-gray-500">We've received your order.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">2. Payment Confirmation</h4>
                <p className="mt-1 text-sm text-gray-500">We'll verify your payment details.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">3. Order Shipped</h4>
                <p className="mt-1 text-sm text-gray-500">Your order is on its way!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
