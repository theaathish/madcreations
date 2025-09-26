import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Truck, Clock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Cart: React.FC = () => {
  const { state, dispatch } = useCart();
  const { user, userProfile } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setIsProcessing(true);

    try {
      // Check if user is logged in
      if (!user) {
        alert('Please log in to place an order.');
        setIsCheckingOut(false);
        setIsProcessing(false);
        return;
      }

      // Create order object with proper user information
      const orderData = {
        userId: user.uid,
        customerName: userProfile?.displayName || user.displayName || 'User',
        customerEmail: userProfile?.email || user.email || '',
        customerPhone: userProfile?.phoneNumber || '',
        items: state.items,
        subtotal,
        shippingCost,
        total,
        status: 'pending' as const,
        shippingAddress: {
          address: userProfile?.address || '',
          city: userProfile?.city || '',
          state: userProfile?.state || '',
          pincode: userProfile?.pincode || ''
        },
        shippingMethod,
        notes: `Order placed via ${shippingMethod} shipping. Customer will be contacted via WhatsApp for payment confirmation.`
      };

      // Import ordersService and create order
      const { ordersService } = await import('../services/firebaseService');
      await ordersService.createOrder(orderData);

      // Show success message
      alert('Order placed successfully! Admin will contact you via WhatsApp for payment confirmation.');

      // Clear cart
      dispatch({ type: 'CLEAR_CART' });

    } catch (error) {
      console.error('Error placing order:', error);
      alert('There was an error placing your order. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsCheckingOut(false);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { productId, quantity }
    });
  };

  const removeItem = (productId: string) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: productId
    });
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch({ type: 'CLEAR_CART' });
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Discover our amazing collection of posters, polaroids, and custom designs.
          </p>
          <Link
            to="/"
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalSavings = state.items.reduce((sum, item) => {
    if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
      return sum + ((item.product.originalPrice - item.product.price) * item.quantity);
    }
    return sum;
  }, 0);

  const shippingCost = shippingMethod === 'express' ? 99 : 0;
  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Cart Items ({state.items.length})
                </h2>
                {totalSavings > 0 && (
                  <p className="text-green-600 font-medium mt-2">
                    🎉 Total Savings: ₹{totalSavings}
                  </p>
                )}
              </div>

              {state.items.map((item, index) => {
                const itemSavings = item.product.originalPrice && item.product.originalPrice > item.product.price
                  ? (item.product.originalPrice - item.product.price) * item.quantity
                  : 0;

                return (
                  <div
                    key={item.product.id}
                    className={`p-6 ${index !== state.items.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.product.images && item.product.images[0] ? item.product.images[0] : 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.product.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          {item.product.size && (
                            <span className="text-sm text-gray-600">Size: {item.product.size}</span>
                          )}
                          {item.product.theme && (
                            <span className="text-sm text-gray-600">Theme: {item.product.theme}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`text-sm font-medium ${item.product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {item.product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                          {itemSavings > 0 && (
                            <span className="text-sm text-green-600 font-medium">
                              Save ₹{itemSavings}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-purple-600">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">₹{item.product.price} each</p>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({state.items.length} items)</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>

                {/* Shipping Options */}
                <div className="border-t pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shipping"
                        value="standard"
                        checked={shippingMethod === 'standard'}
                        onChange={(e) => setShippingMethod(e.target.value as 'standard' | 'express')}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        Standard Delivery (3-5 days) - FREE
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="shipping"
                        value="express"
                        checked={shippingMethod === 'express'}
                        onChange={(e) => setShippingMethod(e.target.value as 'standard' | 'express')}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        Express Delivery (1-2 days) - ₹99
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₹${shippingCost}`
                    )}
                  </span>
                </div>

                {subtotal < 999 && shippingMethod === 'standard' && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      🎉 Add ₹{999 - subtotal} more for free shipping!
                    </p>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-purple-600">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-600 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Processing Order...</p>
                      <p className="text-xs text-yellow-600">Please wait while we confirm your order</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Delivery Information</span>
                </div>
                <p className="text-sm text-gray-600">
                  {shippingMethod === 'standard' ? (
                    <>
                      Standard delivery: 3-5 business days<br />
                      Free shipping on all orders!
                    </>
                  ) : (
                    'Express delivery: 1-2 business days'
                  )}
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || isProcessing}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-3"
              >
                <CreditCard className="h-5 w-5" />
                <span>
                  {isProcessing
                    ? 'Processing...'
                    : isCheckingOut
                      ? 'Placing Order...'
                      : 'Place Order'
                  }
                </span>
              </button>

              <Link
                to="/"
                className="block w-full text-center border border-purple-600 text-purple-600 py-3 px-4 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Continue Shopping
              </Link>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <span>🔒</span>
                  <span>Secure checkout with SSL encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Process Info */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Order Confirmation</h4>
              <p className="text-sm text-gray-600">We'll confirm your order details</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Admin Review</h4>
              <p className="text-sm text-gray-600">Admin will contact you for payment</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Order Processing</h4>
              <p className="text-sm text-gray-600">Your order will be prepared and shipped</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;