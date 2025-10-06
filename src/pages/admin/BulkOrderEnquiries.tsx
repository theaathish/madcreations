import React, { useState, useEffect } from 'react';
import { bulkOrderService } from '../../services/bulkOrderService';
import { BulkOrderEnquiry } from '../../services/bulkOrderService';
import { format } from 'date-fns';
import { CheckCircle, Clock, XCircle, Search as SearchIcon, Filter as FilterIcon, ArrowUpDown } from 'lucide-react';

const statusStyles = {
  new: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const BulkOrderEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<BulkOrderEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof BulkOrderEnquiry; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });

  useEffect(() => {
    const loadEnquiries = async () => {
      try {
        setLoading(true);
        const data = await bulkOrderService.getAllEnquiries();
        setEnquiries(data);
      } catch (error) {
        console.error('Error loading enquiries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEnquiries();
  }, []);

  const handleStatusUpdate = async (id: string, status: BulkOrderEnquiry['status']) => {
    try {
      await bulkOrderService.updateEnquiryStatus(id, status);
      setEnquiries(prev =>
        prev.map(enquiry =>
          enquiry.id === id ? { ...enquiry, status, updatedAt: new Date() } : enquiry
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      try {
        await bulkOrderService.deleteEnquiry(id);
        setEnquiries(prev => prev.filter(enquiry => enquiry.id !== id));
      } catch (error) {
        console.error('Error deleting enquiry:', error);
      }
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch =
      enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.phone.includes(searchTerm) ||
      enquiry.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedEnquiries = [...filteredEnquiries].sort((a, b) => {
    const aValue = a[sortConfig?.key as keyof BulkOrderEnquiry];
    const bValue = b[sortConfig?.key as keyof BulkOrderEnquiry];
    
    if (aValue === undefined || bValue === undefined) return 0;
    
    if (aValue < bValue) {
      return sortConfig?.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig?.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: keyof BulkOrderEnquiry) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 mr-1" />;
      default:
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };

  const getStatusActions = (enquiry: BulkOrderEnquiry) => {
    switch (enquiry.status) {
      case 'new':
        return [
          { label: 'Mark as Contacted', value: 'contacted' },
          { label: 'Mark as Completed', value: 'completed' },
          { label: 'Reject', value: 'rejected' },
        ];
      case 'contacted':
        return [
          { label: 'Mark as Completed', value: 'completed' },
          { label: 'Reject', value: 'rejected' },
        ];
      case 'completed':
      case 'rejected':
        return [
          { label: 'Reopen as New', value: 'new' },
          { label: 'Mark as Contacted', value: 'contacted' },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Bulk Order Enquiries</h3>
                  <div className="mt-3 sm:mt-0 sm:ml-4">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          placeholder="Search enquiries..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center">
                        <FilterIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <select
                          className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Contact
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        onClick={() => requestSort('productType')}
                      >
                        <div className="flex items-center">
                          Product Type
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Date
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedEnquiries.length > 0 ? (
                      sortedEnquiries.map((enquiry) => (
                        <tr key={enquiry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{enquiry.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{enquiry.email}</div>
                            <div className="text-sm text-gray-500">{enquiry.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">{enquiry.productType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{enquiry.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={enquiry.status}
                              onChange={(e) => handleStatusUpdate(enquiry.id!, e.target.value as BulkOrderEnquiry['status'])}
                              className={`text-sm rounded-md px-2 py-1 ${statusStyles[enquiry.status]}`}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="completed">Completed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {enquiry.createdAt ? format(new Date(enquiry.createdAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleDeleteEnquiry(enquiry.id!)}
                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                                title="Delete enquiry"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No enquiries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkOrderEnquiries;
