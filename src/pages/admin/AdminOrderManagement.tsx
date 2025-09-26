import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, AlertCircle, Search, Filter, MessageCircle, Eye, Link, Save, X, Download, MessageSquare } from 'lucide-react';
import { ordersService } from '../../services/firebaseService';
import type { Order, OrderItem } from '../../types';

const AdminOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<string | null>(null);
  const [deliveryLink, setDeliveryLink] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await ordersService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const sendMessage = async (_orderId: string, customerEmail: string) => {
    if (!message.trim()) return;

    setIsSendingMessage(true);
    try {
      // Simulate sending message
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Message sent to ${customerEmail}: ${message}`);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleEditDelivery = (order: Order) => {
    setEditingDelivery(order.id);
    setDeliveryLink(order.deliveryLink || '');
    setTrackingNumber(order.trackingNumber || '');
  };

  const handleSaveDelivery = async (orderId: string) => {
    setIsSavingDelivery(true);
    try {
      await ordersService.updateDeliveryInfo(orderId, deliveryLink, trackingNumber);
      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId 
            ? { ...order, deliveryLink, trackingNumber }
            : order
        )
      );
      setEditingDelivery(null);
      setDeliveryLink('');
      setTrackingNumber('');
    } catch (error) {
      console.error('Error saving delivery info:', error);
      alert('Failed to save delivery information. Please try again.');
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const downloadCustomImage = async (imageUrl: string, filename: string) => {
    try {
      // Method 1: Try direct fetch (works for same-origin or CORS-enabled images)
      try {
        const response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          return;
        }
      } catch (fetchError) {
        console.log('Direct fetch failed, trying alternative method:', fetchError);
      }
      
      // Method 2: If fetch fails, try opening in new tab (fallback)
      // This works for Firebase Storage and other external images
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // For Firebase Storage URLs, add download parameter
      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        const url = new URL(imageUrl);
        url.searchParams.set('alt', 'media');
        url.searchParams.set('token', url.searchParams.get('token') || '');
        link.href = url.toString();
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      alert(`Download initiated for ${filename}. If the download doesn't start automatically, the image will open in a new tab where you can right-click and save it.`);
      
    } catch (error) {
      console.error('Error downloading image:', error);
      
      // Method 3: Final fallback - copy URL to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert(`Unable to download directly. Image URL copied to clipboard: ${filename}\n\nYou can paste this URL in a new tab to view and save the image.`);
      } catch (clipboardError) {
        alert(`Unable to download image: ${filename}\n\nImage URL: ${imageUrl}\n\nPlease copy this URL and paste it in a new tab to view and save the image.`);
      }
    }
  };

  const handleCancelEditDelivery = () => {
    setEditingDelivery(null);
    setDeliveryLink('');
    setTrackingNumber('');
  };

  // Bulk download function for all custom images in an order
  const downloadAllCustomImages = async (order: Order) => {
    const customImages: Array<{url: string, filename: string}> = [];
    
    order.items.forEach((item, itemIndex) => {
      if (item.customizations?.customImages) {
        item.customizations.customImages.forEach((imageUrl: string, imgIndex: number) => {
          const itemName = (item as any)?.product?.name || (item as any)?.name || 'product';
          customImages.push({
            url: imageUrl,
            filename: `${itemName}-order-${order.id}-item-${itemIndex + 1}-image-${imgIndex + 1}.jpg`
          });
        });
      }
    });
    
    if (customImages.length === 0) {
      alert('No custom images found in this order.');
      return;
    }
    
    alert(`Starting download of ${customImages.length} custom images. Please wait...`);
    
    for (let i = 0; i < customImages.length; i++) {
      const { url, filename } = customImages[i];
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
      await downloadCustomImage(url, filename);
    }
    
    alert(`Download process completed for ${customImages.length} images.`);
  };

  // WhatsApp confirmation message function
  const sendWhatsAppConfirmation = (order: Order) => {
    const formatOrderItems = (items: OrderItem[]) => {
      return items.map((item, index) => {
        let itemText = `${index + 1}. ${item.name} - Qty: ${item.quantity} - ₹${item.price}`;
        
        // Add customization details if available
        if (item.customizations) {
          const customDetails = [];
          if (item.customizations.customText) {
            customDetails.push(`Custom Text: "${item.customizations.customText}"`);
          }
          if (item.customizations.spotifyUrl) {
            customDetails.push(`Spotify Link: ${item.customizations.spotifyUrl}`);
          }
          if (item.customizations.customImages?.length > 0) {
            customDetails.push(`Custom Images: ${item.customizations.customImages.length} uploaded`);
          }
          
          if (customDetails.length > 0) {
            itemText += `\n   ${customDetails.join('\n   ')}`;
          }
        }
        
        return itemText;
      }).join('\n\n');
    };

    const message = `🎉 *ORDER CONFIRMATION* 🎉

Dear ${order.customerName},

Your order has been confirmed! Here are the details:

📋 *Order Details:*
Order ID: #${order.id}
Date: ${new Date(order.orderDate?.seconds * 1000 || Date.now()).toLocaleDateString('en-IN')}
Status: ${order.status.toUpperCase()}

🛍️ *Items Ordered:*
${formatOrderItems(order.items)}

💰 *Payment Summary:*
Subtotal: ₹${order.subtotal.toLocaleString()}
Shipping: ₹${order.shippingCost.toLocaleString()}
*Total: ₹${order.total.toLocaleString()}*

📦 *Shipping Address:*
${order.shippingAddress.address}
${order.shippingAddress.city}, ${order.shippingAddress.state}
PIN: ${order.shippingAddress.pincode}

📞 *Contact Information:*
Phone: ${order.customerPhone}
Email: ${order.customerEmail}

⏰ *Processing Time:*
Your order will be processed within 3-5 business days.

${order.deliveryLink ? `🚚 *Track Your Order:*\n${order.deliveryLink}\n\n` : ''}${order.trackingNumber ? `📋 *Tracking Number:* ${order.trackingNumber}\n\n` : ''}Thank you for choosing MadCreations! 🎨

For any queries, feel free to contact us.

Best regards,
MadCreations Team`;

    // Format phone number (remove +91 if present and ensure it starts with 91)
    let phoneNumber = order.customerPhone.replace(/\D/g, ''); // Remove non-digits
    if (phoneNumber.startsWith('91')) {
      phoneNumber = phoneNumber;
    } else if (phoneNumber.startsWith('0')) {
      phoneNumber = '91' + phoneNumber.substring(1);
    } else if (phoneNumber.length === 10) {
      phoneNumber = '91' + phoneNumber;
    }

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    
    // Handle Firestore timestamp
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Handle regular date
    if (date instanceof Date) {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Handle string date
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    return 'N/A';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-purple-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Manage customer orders and update their status</p>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            { status: 'all', label: 'Total', count: statusCounts.all, color: 'bg-gray-500' },
            { status: 'pending', label: 'Pending', count: statusCounts.pending, color: 'bg-yellow-500' },
            { status: 'processing', label: 'Processing', count: statusCounts.processing, color: 'bg-purple-500' },
            { status: 'shipped', label: 'Shipped', count: statusCounts.shipped, color: 'bg-green-500' },
            { status: 'delivered', label: 'Delivered', count: statusCounts.delivered, color: 'bg-green-600' },
            { status: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled, color: 'bg-red-500' },
          ].map(({ status, label, count, color }) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`p-4 rounded-lg text-white transition-all ${
                statusFilter === status ? 'ring-2 ring-offset-2 ring-purple-500' : 'hover:opacity-90'
              } ${color}`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm opacity-90">{label}</div>
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by customer name, email, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Orders ({filteredOrders.length})
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">No orders match your current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Customer:</span> {order.customerName}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {order.customerEmail}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {order.customerPhone}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(order.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span> {order.items.length}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> ₹{order.total.toLocaleString()}
                        </div>
                      </div>

                      {order.shippingAddress && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Shipping:</span> {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="flex items-center px-3 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedOrder?.id === order.id ? 'Hide' : 'Details'}
                      </button>

                      {/* ALWAYS VISIBLE TEST BUTTON */}
                      <button
                        onClick={() => {
                          alert('Button clicked! Check console for order data.');
                          console.log('=== ORDER DEBUG INFO ===');
                          console.log('Order ID:', order.id);
                          console.log('Order items:', order.items);
                          console.log('Items length:', order.items?.length || 0);
                          if (order.items && order.items.length > 0) {
                            order.items.forEach((item, idx) => {
                              console.log(`Item ${idx}:`, item);
                              console.log(`Item ${idx} customizations:`, item.customizations);
                              console.log(`Item ${idx} has custom images:`, item.customizations?.customImages?.length || 0);
                            });
                          }
                          setSelectedOrder(order);
                        }}
                        className="flex items-center px-2 py-1 text-white bg-red-500 hover:bg-red-600 rounded text-xs font-bold"
                        title="TEST: Click to debug order data"
                      >
                        TEST
                      </button>

                      {/* Show download buttons if order has custom images */}
                      {order.items.some(item => item.customizations?.customImages && item.customizations.customImages.length > 0) && (
                        <>
                          <button
                            onClick={() => downloadAllCustomImages(order)}
                            className="flex items-center px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors font-semibold"
                            title="Download all custom images from this order"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            All ({order.items.reduce((total, item) => total + (item.customizations?.customImages?.length || 0), 0)})
                          </button>
                          <button
                            onClick={() => {
                              // Auto-expand the order and scroll to custom images
                              setSelectedOrder(order);
                              setTimeout(() => {
                                const customImagesSection = document.querySelector(`[data-order-id="${order.id}"] .custom-images-section`);
                                if (customImagesSection) {
                                  customImagesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }, 100);
                            }}
                            className="flex items-center px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                            title="View and download individual custom images"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleEditDelivery(order)}
                        className="flex items-center px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Delivery
                      </button>

                      <button
                        onClick={() => sendWhatsAppConfirmation(order)}
                        className="flex items-center px-3 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors font-semibold"
                        title="Send WhatsApp confirmation to customer"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        WhatsApp
                      </button>

                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        onClick={() => sendMessage(order.id, order.customerEmail)}
                        disabled={isSendingMessage}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </button>
                    </div>
                  </div>

                  {/* Order Details */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                          <div className="space-y-3">
                            {order.items.map((item: OrderItem, index: number) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start space-x-4">
                                  <img
                                    src={item.imageUrl || 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400'}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-1">{item.name}</h5>
                                    <p className="text-sm text-gray-600 mb-2">
                                      Qty: {item.quantity} × ₹{item.price} = ₹{(item.price * item.quantity).toLocaleString()}
                                    </p>
                                    
                                    {/* Custom Images Section */}
                                    {item.customizations?.customImages && item.customizations.customImages.length > 0 && (
                                      <div className="mt-3 custom-images-section" data-order-id={order.id}>
                                        <h6 className="text-sm font-medium text-gray-700 mb-2">Custom Images:</h6>
                                        <div className="grid grid-cols-2 gap-2">
                                          {item.customizations.customImages.map((imageUrl: string, imgIndex: number) => (
                                            <div key={imgIndex} className="relative group">
                                              <img
                                                src={imageUrl}
                                                alt={`Custom ${imgIndex + 1}`}
                                                className="w-full h-20 object-cover rounded border"
                                              />
                                              <button
                                                onClick={() => downloadCustomImage(imageUrl, `custom-image-${order.id}-${imgIndex + 1}.jpg`)}
                                                className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded"
                                                title="Download custom image"
                                              >
                                                <Download className="h-5 w-5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                          💡 Hover over images to download
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">₹{order.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Shipping:</span>
                              <span className="font-medium">₹{order.shippingCost}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Shipping Method:</span>
                              <span className="font-medium capitalize">{order.shippingMethod}</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between">
                                <span className="font-semibold">Total:</span>
                                <span className="font-semibold text-purple-600">₹{order.total.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Shipping Address</h5>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">
                                {order.shippingAddress.address}<br />
                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                              </p>
                            </div>
                          </div>

                          {/* Delivery Information */}
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Delivery Information</h5>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                              {order.deliveryLink ? (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Delivery Link:</span>
                                  <a
                                    href={order.deliveryLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Track Delivery
                                  </a>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No delivery link added</p>
                              )}
                              {order.trackingNumber ? (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Tracking Number:</span>
                                  <span className="ml-2 text-sm text-gray-600 font-mono">{order.trackingNumber}</span>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No tracking number added</p>
                              )}
                            </div>
                          </div>

                          {/* Message Customer */}
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Send Message to Customer</h5>
                            <div className="space-y-2">
                              <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                rows={3}
                              />
                              <button
                                onClick={() => sendMessage(order.id, order.customerEmail)}
                                disabled={isSendingMessage || !message.trim()}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {isSendingMessage ? 'Sending...' : 'Send Message'}
                              </button>
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

        {/* Delivery Link Edit Modal */}
        {editingDelivery && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Update Delivery Information</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Link
                  </label>
                  <input
                    type="url"
                    value={deliveryLink}
                    onChange={(e) => setDeliveryLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/delivery/track"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="TRK123456789"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={handleCancelEditDelivery}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4 mr-1 inline" />
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveDelivery(editingDelivery)}
                  disabled={isSavingDelivery}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-1 inline" />
                  {isSavingDelivery ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderManagement;
