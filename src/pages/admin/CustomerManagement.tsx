import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, MapPin, Calendar, Eye } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: any;
  totalOrders: number;
  totalSpent: number;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      // Get customers from users collection
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Get orders to calculate customer stats
      const ordersRef = collection(db, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      const customersData: Customer[] = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Calculate customer stats from orders
        const customerOrders = orders.filter(order => 
          order.userId === doc.id || 
          order.customerEmail === userData.email
        );
        
        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        customersData.push({
          id: doc.id,
          name: userData.displayName || userData.name || 'Unknown',
          email: userData.email || '',
          phone: userData.phoneNumber || userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          pincode: userData.pincode || '',
          createdAt: userData.createdAt,
          totalOrders,
          totalSpent
        });
      });
      
      // Also add customers from orders who might not be in users collection
      const orderCustomers = new Map();
      orders.forEach(order => {
        if (order.customerEmail && !customersData.find(c => c.email === order.customerEmail)) {
          const key = order.customerEmail;
          if (!orderCustomers.has(key)) {
            orderCustomers.set(key, {
              id: `order-customer-${Date.now()}-${Math.random()}`,
              name: order.customerName || 'Unknown',
              email: order.customerEmail,
              phone: order.customerPhone || '',
              address: order.shippingAddress?.address || '',
              city: order.shippingAddress?.city || '',
              state: order.shippingAddress?.state || '',
              pincode: order.shippingAddress?.pincode || '',
              createdAt: order.createdAt || order.orderDate,
              totalOrders: 0,
              totalSpent: 0
            });
          }
          
          const customer = orderCustomers.get(key);
          customer.totalOrders += 1;
          customer.totalSpent += order.total || 0;
        }
      });
      
      // Add order-only customers to the list
      orderCustomers.forEach(customer => {
        customersData.push(customer);
      });

      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }

    setFilteredCustomers(filtered);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';

    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    if (date instanceof Date) {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage customer information and view their order history</p>
          <button
            onClick={() => {
              console.log('=== CUSTOMER DEBUG INFO ===');
              console.log('Total customers found:', customers.length);
              console.log('Customers data:', customers);
              alert(`Found ${customers.length} customers. Check console for details.`);
            }}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Debug Customer Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.totalOrders > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length).toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Customers ({filteredCustomers.length})
            </h2>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600">No customers match your current search criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                        <button
                          onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
                          className="flex items-center px-3 py-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {selectedCustomer?.id === customer.id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.city}, {customer.state}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          Joined {formatDate(customer.createdAt)}
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Total Orders:</span>
                          <span className="ml-2 text-gray-900">{customer.totalOrders}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Total Spent:</span>
                          <span className="ml-2 text-green-600 font-semibold">₹{customer.totalSpent.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Address:</span>
                          <span className="ml-2 text-gray-600">{customer.address}, {customer.pincode}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Details */}
                  {selectedCustomer?.id === customer.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Full Name:</span>
                              <p className="text-gray-900">{customer.name}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Email:</span>
                              <p className="text-gray-900">{customer.email}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Phone:</span>
                              <p className="text-gray-900">{customer.phone}</p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Member Since:</span>
                              <p className="text-gray-900">{formatDate(customer.createdAt)}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-600">
                              {customer.address}<br />
                              {customer.city}, {customer.state} - {customer.pincode}
                            </p>
                          </div>

                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Order Summary</h5>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Orders:</span>
                                <span className="font-medium">{customer.totalOrders}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Amount Spent:</span>
                                <span className="font-medium text-green-600">₹{customer.totalSpent.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Average Order Value:</span>
                                <span className="font-medium">
                                  ₹{customer.totalOrders > 0 ? (customer.totalSpent / customer.totalOrders).toLocaleString() : '0'}
                                </span>
                              </div>
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
    </div>
  );
};

export default CustomerManagement;
