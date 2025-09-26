import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Download,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Link,
  Save,
  X,
  MessageSquare
} from 'lucide-react';
import { ordersService } from '../../services/firebaseService';
import { Order, OrderItem } from '../../types';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [editingDelivery, setEditingDelivery] = useState<string | null>(null);
  const [deliveryLink, setDeliveryLink] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await ordersService.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateValue = (date: any) => {
    if (!date) return 0;
    if (date.seconds) return date.seconds * 1000;
    if (date instanceof Date) return date.getTime();
    if (typeof date === 'string') return new Date(date).getTime();
    return 0;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return getDateValue(b.orderDate) - getDateValue(a.orderDate);
      case 'total':
        return b.total - a.total;
      case 'customer':
        return a.customerName.localeCompare(b.customerName);
      default:
        return 0;
    }
  });

  const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'shipped':
        return Truck;
      case 'processing':
        return Package;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
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

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    handleStatusChange(orderId, newStatus as Order['status']);
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

  const handleCancelEditDelivery = () => {
    setEditingDelivery(null);
    setDeliveryLink('');
    setTrackingNumber('');
  };

  // Enhanced custom image download functionality
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
          console.log('✅ Direct download successful:', filename);
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
      
      console.log('✅ Alternative download method used:', filename);
      
      // Show success message
      alert(`Download initiated for ${filename}. If the download doesn't start automatically, the image will open in a new tab where you can right-click and save it.`);
      
    } catch (error) {
      console.error('❌ Error downloading image:', error);
      
      // Method 3: Final fallback - copy URL to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert(`Unable to download directly. Image URL copied to clipboard: ${filename}\n\nYou can paste this URL in a new tab to view and save the image.`);
      } catch (clipboardError) {
        alert(`Unable to download image: ${filename}\n\nImage URL: ${imageUrl}\n\nPlease copy this URL and paste it in a new tab to view and save the image.`);
      }
    }
  };

  // Bulk download function for all custom images in an order
  const downloadAllCustomImages = async (order: Order) => {
    const customImages: Array<{url: string, filename: string}> = [];
    
    order.items.forEach((item, itemIndex) => {
      if (item.customizations?.customImages) {
        item.customizations.customImages.forEach((imageUrl: string, imgIndex: number) => {
          const itemName = (item as any)?.name || (item as any)?.product?.name || 'product';
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

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="p-8">
        {/* Header Loading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 bg-gray-300 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-300 rounded w-40 animate-pulse mt-4 sm:mt-0"></div>
        </div>

        {/* Stats Cards Loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex items-center">
                <div className="bg-gray-300 p-2 rounded-lg w-10 h-10"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Loading */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded w-40"></div>
            <div className="h-10 bg-gray-300 rounded w-40"></div>
          </div>
        </div>

        {/* Orders Table Loading */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-gray-200">
              <div className="bg-gray-50">
                <div className="grid grid-cols-7 gap-4 p-6">
                  {[...Array(7)].map((_, index) => (
                    <div key={index} className="h-4 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="grid grid-cols-7 gap-4 p-6 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                      <div className="h-3 bg-gray-300 rounded w-40"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 rounded w-28"></div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="flex justify-end space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="w-20 h-8 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-2">Track and manage customer orders</p>
        </div>
        <button className="mt-4 sm:mt-0 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center">
          <Download className="h-5 w-5 mr-2" />
          Export Orders
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.processing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shipped</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.shipped}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="date">Sort by Date</option>
            <option value="total">Sort by Total</option>
            <option value="customer">Sort by Customer</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)} items
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items?.[0]?.name || 'Product'}
                        {(order.items?.length || 0) > 1 && ` +${(order.items?.length || 0) - 1} more`}
                      </div>
                      {/* Custom Product Indicators */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(order.items || []).some(item => item.customizations?.customImages?.length > 0) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            📸 Images
                          </span>
                        )}
                        {(order.items || []).some(item => item.customizations?.customText) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ✏️ Text
                          </span>
                        )}
                        {(order.items || []).some(item => item.customizations?.spotifyUrl) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            🎵 Spotify
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{order.total.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className="h-4 w-4 mr-2" />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.orderDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="text-purple-600 hover:text-purple-700"
                          title="View Order Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        
                        {/* ALWAYS SHOW TEST DOWNLOAD BUTTON */}
                        <button
                          onClick={() => {
                            alert('🎯 DOWNLOAD TEST: This proves the download button works!');
                            console.log('Order data:', order);
                            console.log('Has custom images:', order.items.some(item => item.customizations?.customImages));
                            // Test download with a sample image
                            downloadCustomImage('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300', `test-download-${order.id}.jpg`);
                          }}
                          className="flex items-center px-2 py-1 text-white bg-red-500 hover:bg-red-600 rounded text-xs font-bold"
                          title="TEST: Download functionality"
                        >
                          Download
                        </button>
                        
                        {/* Show download buttons if order has custom images */}
                        {order.items.some(item => item.customizations?.customImages && item.customizations.customImages.length > 0) && (
                          <>
                            <button
                              onClick={() => downloadAllCustomImages(order)}
                              className="flex items-center px-2 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors text-xs font-semibold"
                              title="Download all custom images from this order"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              All ({order.items.reduce((total, item) => total + (item.customizations?.customImages?.length || 0), 0)})
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setTimeout(() => {
                                  const customImagesSection = document.querySelector(`[data-order-id="${order.id}"] .custom-images-section`);
                                  if (customImagesSection) {
                                    customImagesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 100);
                              }}
                              className="flex items-center px-2 py-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors text-xs"
                              title="View and download individual custom images"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleEditDelivery(order)}
                          className="text-green-600 hover:text-green-700"
                          title="Add Delivery Link"
                        >
                          <Link className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => sendWhatsAppConfirmation(order)}
                          className="flex items-center px-2 py-1 text-white bg-green-500 hover:bg-green-600 rounded transition-colors text-xs font-semibold"
                          title="Send WhatsApp confirmation to customer"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          WhatsApp
                        </button>
                        
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}  
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Expansion */}
      {selectedOrder && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Order Details - #{selectedOrder.id.slice(-8).toUpperCase()}
            </h3>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-order-id={selectedOrder.id}>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.items.map((item: OrderItem, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={item.imageUrl || 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={item.name || 'Product'}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{item.name}</h5>
                        <p className="text-sm text-gray-600 mb-2">
                          Qty: {item.quantity} × ₹{item.price} = ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        
                        {/* Custom Product Details Section */}
                        {item.customizations && (
                          <div className="mt-3 border-t pt-3">
                            <h6 className="text-sm font-semibold text-purple-700 mb-3 flex items-center">
                              🎨 Custom Product Details
                            </h6>
                            
                            {/* Custom Images */}
                            {item.customizations?.customImages && item.customizations.customImages.length > 0 && (
                              <div className="mb-4 custom-images-section">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  📸 Custom Images ({item.customizations.customImages.length})
                                </h6>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {(item.customizations.customImages || []).map((imageUrl: string, imgIndex: number) => (
                                    <div key={imgIndex} className="relative group bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                                      <img
                                        src={imageUrl}
                                        alt={`Custom Image ${imgIndex + 1}`}
                                        className="w-full h-24 object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                                        <button
                                          onClick={() => downloadCustomImage(imageUrl, `${item.name || 'product'}-custom-${imgIndex + 1}-${selectedOrder.id}.jpg`)}
                                          className="opacity-0 group-hover:opacity-100 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-all duration-200 transform scale-90 group-hover:scale-100"
                                          title="Download custom image"
                                        >
                                          <Download className="h-4 w-4" />
                                        </button>
                                      </div>
                                      <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-1 py-0.5 rounded">
                                        {imgIndex + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  💡 Hover over images to download • Total: {item.customizations?.customImages?.length || 0} image(s)
                                </p>
                              </div>
                            )}
                            
                            {/* Custom Text */}
                            {item.customizations?.customText && (
                              <div className="mb-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  ✏️ Custom Text
                                </h6>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                    "{item.customizations.customText}"
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Spotify URL */}
                            {item.customizations?.spotifyUrl && (
                              <div className="mb-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  🎵 Spotify Link
                                </h6>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="bg-green-500 p-1 rounded">
                                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <a 
                                        href={item.customizations.spotifyUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm text-green-700 hover:text-green-800 font-medium underline break-all"
                                      >
                                        {item.customizations.spotifyUrl}
                                      </a>
                                      <p className="text-xs text-gray-600 mt-1">
                                        🎯 QR code will be generated for this Spotify link
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Processing Guidelines for Polaroids */}
                            {(item.name || '').toLowerCase().includes('polaroid') && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <h6 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                                  🎵 Polaroid Processing Guidelines
                                </h6>
                                <ul className="text-xs text-yellow-700 space-y-1">
                                  <li>• Custom image will be printed as the main photo</li>
                                  <li>• Custom text will appear below the image</li>
                                  <li>• Spotify QR code will be added if URL provided</li>
                                  <li>• Processing time: 3-5 business days</li>
                                  <li>• High-quality polaroid paper used</li>
                                </ul>
                              </div>
                            )}
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
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{selectedOrder.subtotal?.toLocaleString() || selectedOrder.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">₹{selectedOrder.shippingCost || 0}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold text-purple-600">₹{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {selectedOrder.shippingAddress && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Shipping Address</h5>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      {selectedOrder.shippingAddress.address}<br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
  );
};

export default OrderManagement;