import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, X, Package } from 'lucide-react';
import { productsService, imageService } from '../../services/firebaseService';
import { Product, SizeOption } from '../../types';

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Predefined options
  const sizeOptions = ['A4', '12x9', 'A3'];
  const themeOptions = [
    'Movies',
    'Series',
    'Anime & Manga',
    'Sports',
    'Cars',
    'Music',
    'Games',
    'Devotional',
    'Motivational',
    'Gym',
    'Super Heroes'
  ];

  // Form state for adding products
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'poster',
    subcategory: '',
    size: sizeOptions[0], // Set default to first size
    theme: themeOptions[0], // Set default to first theme
    inStock: true,
    featured: false,
    hidden: false,
    isMultiSize: false
  });
  const [sizeOptionsList, setSizeOptionsList] = useState<SizeOption[]>([
    { size: 'A4', price: 80 },
    { size: 'A3', price: 100 },
    { size: '13x19 in', price: 130 }
  ]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productsService.getAllProducts();
      console.log('🔍 [ProductManagement] Loaded products from Firebase:', productsData.length);
      
      // Check for multi-size products
      const multiSizeProducts = productsData.filter(p => p.isMultiSize);
      console.log('🔍 [ProductManagement] Multi-size products found:', multiSizeProducts.length);
      multiSizeProducts.forEach(p => {
        console.log(`   - ${p.name}: isMultiSize=${p.isMultiSize}, has sizeOptions=${!!p.sizeOptions}, sizeOptions count=${p.sizeOptions?.length || 0}`);
      });
      
      // Load images from Firebase for each product
      const productsWithImages = await Promise.all(
        productsData.map(async (product) => {
          try {
            console.log(`🖼️ ProductManagement: Loading images for ${product.name}`);
            
            // Get images from the separate productImages collection
            const productImages = await imageService.getProductImages(product.id);
            const imageUrls = productImages.map(img => img.imageData);
            
            console.log(`📸 ProductManagement: Found ${productImages.length} images for ${product.name}`);
            
            // Fix image format if needed
            const fixedImages = imageUrls.map(img => {
              if (img && typeof img === 'string' && img.length > 100) {
                if (img.startsWith('data:image/')) {
                  return img;
                } else if (img.startsWith('/9j/') || img.match(/^[A-Za-z0-9+/]/)) {
                  return `data:image/jpeg;base64,${img}`;
                }
              }
              return img;
            }).filter(img => img); // Remove invalid images
            
            return {
              ...product,
              images: fixedImages.length > 0 ? fixedImages : ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400']
            };
          } catch (error) {
            console.error(`❌ ProductManagement: Error loading images for ${product.name}:`, error);
            return {
              ...product,
              images: ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400']
            };
          }
        })
      );
      
      setProducts(productsWithImages);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return a.price - b.price;
      case 'category':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const categories = ['all', 'poster', 'polaroid', 'bundle', 'customizable'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file sizes before processing (2MB limit for base64 in Firestore)
    for (const file of files) {
      if (file.size > 2000000) { // 2MB limit
        alert(`File "${file.name}" is too large. Please choose images smaller than 2MB.`);
        return;
      }
    }

    setSelectedImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Clear the input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSizeOption = () => {
    setSizeOptionsList(prev => [...prev, { size: '', price: 0 }]);
  };

  const removeSizeOption = (index: number) => {
    setSizeOptionsList(prev => prev.filter((_, i) => i !== index));
  };

  const updateSizeOption = (index: number, field: 'size' | 'price' | 'originalPrice', value: string | number | undefined) => {
    setSizeOptionsList(prev => prev.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    ));
  };

  const uploadImageToStorage = async (file: File, productId: string, imageIndex: number = 0): Promise<string> => {
    console.log('Uploading image to tree structure for product:', productId);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          console.log('Image converted to base64, size:', (base64String.length / 1024 / 1024).toFixed(2), 'MB');

          // Basic format validation (images are already pre-validated for size)
          if (!base64String.startsWith('data:image/')) {
            throw new Error('Invalid base64 format');
          }

          // Upload to tree structure (size already validated in pre-validation)
          const imageId = await imageService.uploadProductImage(productId, base64String, imageIndex);
          console.log('Image uploaded to tree structure with ID:', imageId);

          resolve(imageId);
        } catch (error) {
          console.error('Error uploading image to tree:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to convert image to base64'));
      reader.readAsDataURL(file);
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: 'poster',
      subcategory: '',
      size: sizeOptions[0], // Set default to first size
      theme: themeOptions[0], // Set default to first theme
      inStock: true,
      featured: false,
      hidden: false,
      isMultiSize: false
    });
    setSizeOptionsList([
      { size: 'A4', price: 80 },
      { size: 'A3', price: 100 },
      { size: '13x19 in', price: 130 }
    ]);
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || (!formData.isMultiSize && !formData.price)) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate multi-size options if enabled
    if (formData.isMultiSize) {
      if (sizeOptionsList.length === 0 || sizeOptionsList.some(option => !option.size || !option.price)) {
        alert('Please fill in all size options with valid sizes and prices');
        return;
      }
    }

    // DEBUG: Log multi-size configuration
    console.log('🔍 [ProductManagement] Product submission started');
    console.log('🔍 [ProductManagement] formData.isMultiSize:', formData.isMultiSize);
    console.log('🔍 [ProductManagement] sizeOptionsList:', JSON.stringify(sizeOptionsList, null, 2));

    setIsSubmitting(true);

    try {
      // PRE-VALIDATE ALL IMAGES BEFORE CREATING PRODUCT
      if (selectedImages.length > 0) {
        console.log('Pre-validating all images before creating product...');
        
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          
          // Validate file size
          if (file.size > 2000000) { // 2MB limit
            alert(`Image "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please choose images smaller than 2MB.`);
            setIsSubmitting(false);
            return;
          }

          // Pre-validate base64 size
          const base64Result = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
          });

          const maxBase64Size = 900000; // ~900KB base64 = ~600KB original
          if (base64Result.length > maxBase64Size) {
            alert(`Image "${file.name}" is too large after conversion (${(base64Result.length / 1024 / 1024).toFixed(2)}MB). Please choose a smaller image under 600KB.`);
            setIsSubmitting(false);
            return;
          }

          console.log(`✅ Image ${i + 1}/${selectedImages.length} validated: ${file.name}`);
        }
        
        console.log('✅ All images pre-validated successfully');
      }

      // Create product object (without images initially)
      const newProduct: any = {
        name: formData.name,
        description: formData.description,
        price: formData.isMultiSize ? sizeOptionsList[0]?.price || parseFloat(formData.price) : parseFloat(formData.price),
        images: ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400'], // Default image
        category: formData.category as 'poster' | 'polaroid' | 'bundle' | 'customizable' | 'split_poster',
        inStock: formData.inStock,
        featured: formData.featured,
        hidden: formData.hidden,
        isMultiSize: formData.isMultiSize,
        ratings: 4.5, // Default rating
        reviewCount: 0 // Default review count
      };
      
      // Add size options for multi-size products
      if (formData.isMultiSize) {
        newProduct.sizeOptions = sizeOptionsList;
        console.log('🔍 [ProductManagement] Added sizeOptions to newProduct:', JSON.stringify(newProduct.sizeOptions, null, 2));
      } else {
        console.log('🔍 [ProductManagement] Skipping sizeOptions (isMultiSize is false)');
      }
      
      // Only add optional fields if they have values
      if (formData.originalPrice) {
        newProduct.originalPrice = parseFloat(formData.originalPrice);
      }
      if (formData.subcategory) {
        newProduct.subcategory = formData.subcategory;
      }
      if (formData.size) {
        newProduct.size = formData.size;
      }
      if (formData.theme) {
        newProduct.theme = formData.theme;
      }

      // Save to Firebase to get product ID (now safe because images are pre-validated)
      console.log('🔍 [ProductManagement] Creating product with data:', JSON.stringify(newProduct, null, 2));
      const productId = await productsService.createProduct(newProduct);
      console.log('✅ [ProductManagement] Product created with ID:', productId);
      
      // DEBUG: Verify product was saved with size options
      const savedProduct = await productsService.getProduct(productId);
      console.log('🔍 [ProductManagement] Verification - Product retrieved after creation:', {
        id: savedProduct?.id,
        isMultiSize: savedProduct?.isMultiSize,
        sizeOptions: savedProduct?.sizeOptions,
        hasSizeOptions: !!savedProduct?.sizeOptions
      });

      // Upload images to tree structure if any (should not fail now)
      if (selectedImages.length > 0) {
        const uploadedImageIds: string[] = [];

        for (let i = 0; i < selectedImages.length; i++) {
          try {
            const imageFile = selectedImages[i];
            const imageId = await uploadImageToStorage(imageFile, productId, i);
            uploadedImageIds.push(imageId);
            console.log(`Uploaded image ${i + 1}/${selectedImages.length}:`, imageId);
          } catch (error) {
            console.error('Error uploading image:', error);
            alert(`Failed to upload image "${selectedImages[i].name}". Cleaning up...`);
            
            // Clean up the created product and any uploaded images
            try {
              await productsService.deleteProduct(productId);
              await imageService.deleteAllProductImages(productId);
              console.log('Cleaned up product and images after upload failure');
            } catch (cleanupError) {
              console.error('Error cleaning up after failed upload:', cleanupError);
            }
            
            setIsSubmitting(false);
            return;
          }
        }

        // Update product with image references
        await productsService.updateProduct(productId, { images: uploadedImageIds });
      }

      // Reload products
      await loadProducts();

      // Close modal and reset form
      setShowAddModal(false);
      resetForm();

      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsService.deleteProduct(productId);
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category,
      subcategory: (product as any).subcategory || '',
      size: (product as any).size || '',
      theme: (product as any).theme || '',
      inStock: product.inStock,
      featured: product.featured || false,
      hidden: (product as any).hidden || false,
      isMultiSize: product.isMultiSize || false
    });
    
    // Load existing size options if it's a multi-size product
    if (product.isMultiSize && product.sizeOptions) {
      setSizeOptionsList(product.sizeOptions);
    } else {
      setSizeOptionsList([
        { size: 'A4', price: 80 },
        { size: 'A3', price: 100 },
        { size: '13x19 in', price: 130 }
      ]);
    }
    setSelectedImages([]);

    // Load images from tree structure
    try {
      const productImages = await imageService.getProductImages(product.id);
      const imageUrls = productImages.map(img => img.imageData);
      setImagePreviews(imageUrls);
    } catch (error) {
      console.error('Error loading product images:', error);
      setImagePreviews(product.images || []);
    }

    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    resetForm();
  };


  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct || !formData.name || !formData.description || (!formData.isMultiSize && !formData.price)) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // PRE-VALIDATE ALL NEW IMAGES BEFORE UPDATING PRODUCT
      if (selectedImages.length > 0) {
        console.log('Pre-validating all new images before updating product...');
        
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          
          // Validate file size
          if (file.size > 2000000) { // 2MB limit
            alert(`Image "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please choose images smaller than 2MB.`);
            setIsSubmitting(false);
            return;
          }

          // Pre-validate base64 size
          const base64Result = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
          });

          const maxBase64Size = 900000; // ~900KB base64 = ~600KB original
          if (base64Result.length > maxBase64Size) {
            alert(`Image "${file.name}" is too large after conversion (${(base64Result.length / 1024 / 1024).toFixed(2)}MB). Please choose a smaller image under 600KB.`);
            setIsSubmitting(false);
            return;
          }

          console.log(`✅ New image ${i + 1}/${selectedImages.length} validated: ${file.name}`);
        }
        
        console.log('✅ All new images pre-validated successfully');

        // Upload new images to tree structure (should not fail now)
        for (let i = 0; i < selectedImages.length; i++) {
          try {
            const imageFile = selectedImages[i];
            await uploadImageToStorage(imageFile, editingProduct.id, imagePreviews.length + i);
            console.log(`Uploaded additional image ${i + 1}/${selectedImages.length} for product:`, editingProduct.id);
          } catch (error) {
            console.error('Error uploading image:', error);
            alert(`Failed to upload image "${selectedImages[i].name}". Product update cancelled.`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Update product object (without images - they stay in tree structure)
      const updatedProduct: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category as 'poster' | 'polaroid' | 'bundle' | 'customizable' | 'split_poster',
        inStock: formData.inStock,
        featured: formData.featured,
        hidden: formData.hidden,
        isMultiSize: formData.isMultiSize
      };

      // Handle pricing based on multi-size
      if (formData.isMultiSize) {
        updatedProduct.sizeOptions = sizeOptionsList;
        updatedProduct.price = sizeOptionsList[0]?.price || 0; // Set base price to first option
      } else {
        updatedProduct.price = parseFloat(formData.price);
      }
      
      // Only add optional fields if they have values
      if (formData.originalPrice) {
        updatedProduct.originalPrice = parseFloat(formData.originalPrice);
      }
      if (formData.subcategory) {
        updatedProduct.subcategory = formData.subcategory;
      }
      if (formData.size) {
        updatedProduct.size = formData.size;
      }
      if (formData.theme) {
        updatedProduct.theme = formData.theme;
      }

      // Update in Firebase
      await productsService.updateProduct(editingProduct.id, updatedProduct);

      // Reload products
      await loadProducts();

      // Close modal and reset form
      setShowEditModal(false);
      setEditingProduct(null);
      resetForm();

      alert('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (inStock: boolean): string => {
    return inStock
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
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

        {/* Products Table Loading */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-gray-200">
              <div className="bg-gray-50">
                <div className="grid grid-cols-6 gap-4 p-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="h-4 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="grid grid-cols-6 gap-4 p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                    <div className="flex justify-end space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-2">Manage your inventory and product listings</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.inStock).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.featured).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
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
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={product.images && product.images[0] ? product.images[0] : 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{(product as any).subcategory || 'No subcategory'}</div>
                        {product.featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Featured
                          </span>
                        )}
                        {(product as any).hidden && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.isMultiSize && product.sizeOptions ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">Multi-size</div>
                        <div className="text-xs text-gray-500">
                          ₹{Math.min(...product.sizeOptions.map(s => s.price))} - ₹{Math.max(...product.sizeOptions.map(s => s.price))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">₹{product.price}</div>
                        {product.originalPrice && (
                          <div className="text-sm text-gray-500 line-through">₹{product.originalPrice}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.inStock)}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(product as any).ratings || 0}/5</div>
                    <div className="text-sm text-gray-500">({(product as any).reviewCount || 0} reviews)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-purple-600 hover:text-purple-700">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to ${(product as any).hidden ? 'unhide' : 'hide'} this product?`)) {
                            productsService.updateProduct(product.id, { hidden: !(product as any).hidden } as any)
                              .then(() => loadProducts())
                              .catch(error => console.error('Error updating product visibility:', error));
                          }
                        }}
                        className={`${(product as any).hidden ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}`}
                        title={(product as any).hidden ? 'Unhide product' : 'Hide product'}
                      >
                        {(product as any).hidden ? '👁️' : '🙈'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Product</h3>
            </div>
            <form onSubmit={handleSubmitProduct}>
              <div className="px-6 py-4 space-y-4">
                {/* Image Upload Section - Traditional File Manager Approach */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images *
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg p-4">
                    <div className="flex flex-col items-center">
                      <Package className="h-8 w-8 text-gray-400 mb-2" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      <p className="text-sm text-gray-500 mt-2">Select multiple images using your file manager</p>
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="poster">Poster</option>
                      <option value="polaroid">Polaroid</option>
                      <option value="bundle">Bundle</option>
                      <option value="customizable">Customizable</option>
                      <option value="split_poster">Split Poster</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter product description"
                    required
                  />
                </div>

                {/* Multi-size toggle */}
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isMultiSize}
                      onChange={(e) => handleInputChange('isMultiSize', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Multiple Size Options</span>
                  </label>
                </div>

                {/* Conditional pricing based on multi-size */}
                {!formData.isMultiSize ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size Options *
                    </label>
                    <div className="space-y-3">
                      {sizeOptionsList.map((sizeOption, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-end">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Size</label>
                            <input
                              type="text"
                              value={sizeOption.size}
                              onChange={(e) => updateSizeOption(index, 'size', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="e.g. A4"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={sizeOption.price}
                              onChange={(e) => updateSizeOption(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Original Price</label>
                            <input
                              type="number"
                              step="0.01"
                              value={sizeOption.originalPrice || ''}
                              onChange={(e) => updateSizeOption(index, 'originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => removeSizeOption(index)}
                              className="px-2 py-1 text-red-600 hover:text-red-700 text-sm"
                              disabled={sizeOptionsList.length <= 1}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSizeOption}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        + Add Size Option
                      </button>
                    </div>
                  </div>
                )}

                <div className={`grid ${formData.isMultiSize ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {!formData.isMultiSize && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <select
                        value={formData.size}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        {sizeOptions.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      {themeOptions.map((theme) => (
                        <option key={theme} value={theme}>
                          {theme}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Naruto, Marvel, BTS"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) => handleInputChange('inStock', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">In Stock</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Product</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hidden}
                      onChange={(e) => handleInputChange('hidden', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Hidden Product</span>
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
            </div>
            <form onSubmit={handleUpdateProduct}>
              <div className="px-6 py-4 space-y-4">
                {/* Image Upload Section - Traditional File Manager Approach */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images *
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg p-4">
                    <div className="flex flex-col items-center">
                      <Package className="h-8 w-8 text-gray-400 mb-2" />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      <p className="text-sm text-gray-500 mt-2">Select additional images using your file manager</p>
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="poster">Poster</option>
                      <option value="polaroid">Polaroid</option>
                      <option value="bundle">Bundle</option>
                      <option value="customizable">Customizable</option>
                      <option value="split_poster">Split Poster</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter product description"
                    required
                  />
                </div>

                {/* Multi-size toggle */}
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isMultiSize}
                      onChange={(e) => handleInputChange('isMultiSize', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Multiple Size Options</span>
                  </label>
                </div>

                {/* Conditional pricing based on multi-size */}
                {!formData.isMultiSize ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size Options *
                    </label>
                    <div className="space-y-3">
                      {sizeOptionsList.map((sizeOption, index) => (
                        <div key={index} className="grid grid-cols-4 gap-2 items-end">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Size</label>
                            <input
                              type="text"
                              value={sizeOption.size}
                              onChange={(e) => updateSizeOption(index, 'size', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="e.g. A4"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={sizeOption.price}
                              onChange={(e) => updateSizeOption(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Original Price</label>
                            <input
                              type="number"
                              step="0.01"
                              value={sizeOption.originalPrice || ''}
                              onChange={(e) => updateSizeOption(index, 'originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => removeSizeOption(index)}
                              className="px-2 py-1 text-red-600 hover:text-red-700 text-sm"
                              disabled={sizeOptionsList.length <= 1}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSizeOption}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        + Add Size Option
                      </button>
                    </div>
                  </div>
                )}

                <div className={`grid ${formData.isMultiSize ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {!formData.isMultiSize && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <input
                        type="text"
                        value={formData.size}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., A4, A3, 12x18"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <input
                      type="text"
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Anime, Movies, Nature"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Naruto, Marvel, BTS"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) => handleInputChange('inStock', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">In Stock</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Product</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hidden}
                      onChange={(e) => handleInputChange('hidden', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Hidden Product</span>
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;