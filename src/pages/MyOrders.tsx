import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, AlertCircle, ExternalLink, Copy, Eye } from 'lucide-react';
import { ordersService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import type { Order } from '../types';

const MyOrders: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { user, loading: authLoading } = useAuth();

  // Load orders when user changes
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Handle loading state
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('Fetching orders for user:', user.uid);
      const userOrders = await ordersService.getUserOrders(user.uid);
      console.log('Received orders:', userOrders);
      
      // Normalize orders to handle both old and new formats
      const normalizedOrders = userOrders.map(order => {
        // Ensure items is always an array
        if (!Array.isArray(order.items)) {
          console.warn('Order items is not an array:', order.id, order.items);
          return { ...order, items: [] };
        }
        
        // Handle items that might have customizations as strings (new format)
        const normalizedItems = order.items.map((item: any) => {
          // If item has customizations as string, try to parse it
          if (item.customizations && typeof item.customizations === 'string') {
            try {
              return {
                ...item,
                customizations: JSON.parse(item.customizations)
              };
            } catch (e) {
              console.warn('Failed to parse customizations for item:', item);
              return { ...item, customizations: {} };
            }
          }
          return item;
        });
        
        return { ...order, items: normalizedItems };
      });
      
      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    
    let dateObj;
    if (date?.toDate) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      return 'N/A';
    }
    
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view your orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">When you place orders, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="flex items-center px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedOrder?.id === order.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Order Date:</span> {formatDate(order.createdAt || order.orderDate)}
                    </div>
                    <div>
                      <span className="font-medium">Items:</span> {Array.isArray(order.items) ? order.items.length : 0}
                    </div>
                    <div>
                      <span className="font-medium">Total:</span> ₹{(order.total || 0).toLocaleString()}
                    </div>
                  </div>

                  {/* DELIVERY INFORMATION - ALWAYS VISIBLE */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-green-900 mb-3 flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      🚚 Delivery Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">Status:</span>
                        <span className="text-sm text-green-900 font-semibold">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">📦 Tracking Number:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-green-900 bg-white px-2 py-1 rounded">
                            {order.trackingNumber || 'Not assigned yet'}
                          </span>
                          {order.trackingNumber && (
                            <button
                              onClick={() => copyToClipboard(order.trackingNumber!)}
                              className="text-green-600 hover:text-green-800"
                              title="Copy tracking number"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">🔗 Track Package:</span>
                        <div>
                          {order.deliveryLink ? (
                            <a
                              href={order.deliveryLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium bg-white px-3 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Track Now
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                              Link not available yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="flex items-center space-x-4">
                      {order.items.slice(0, 3).map((item: any, index: number) => (
                        <img
                          key={index}
                          src={item.imageUrl || 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400'}
                          alt={item.name || 'Product'}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-600">
                          +{order.items.length - 3}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {order.items[0]?.name || 'Product'}
                          {order.items.length > 1 && ` and ${order.items.length - 1} more item${order.items.length > 2 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Order Details */}
                {selectedOrder?.id === order.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                        <div className="space-y-3">
                          {Array.isArray(order.items) ? order.items.map((item: any, index: number) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                              <img
                                src={item.imageUrl || 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400'}
                                alt={item.name || 'Product'}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{item.name || 'Product'}</h5>
                                <p className="text-sm text-gray-600">Qty: {item.quantity || 1} × ₹{item.price || 0}</p>
                                <p className="text-sm font-medium text-purple-600">₹{(item.quantity || 1) * (item.price || 0)}</p>
                              </div>
                            </div>
                          )) : (
                            <div className="text-center text-gray-500 py-4">
                              No items found in this order
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                        <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">₹{(order.subtotal || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping:</span>
                            <span className="font-medium">₹{order.shippingCost || 0}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold">Total:</span>
                              <span className="font-semibold text-purple-600">₹{(order.total || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Shipping Address</h5>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress?.address || 'N/A'}<br />
                              {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'} - {order.shippingAddress?.pincode || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
