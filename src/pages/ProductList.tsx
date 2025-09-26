import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { productsService, imageService } from '../services/firebaseService';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Removed unused types to clean up the code

const ProductList: React.FC = () => {
  const location = useLocation();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  
  // Extract all unique filter options
  const { sizes, themes, subcategories } = useMemo(() => {
    const sizeSet = new Set<string>();
    const themeSet = new Set<string>();
    const subcategorySet = new Set<string>();
    
    allProducts.forEach(product => {
      if (product.size) sizeSet.add(product.size);
      if (product.theme) themeSet.add(product.theme);
      if (product.subcategory) subcategorySet.add(product.subcategory);
    });
    
    return {
      sizes: Array.from(sizeSet).sort(),
      themes: Array.from(themeSet).sort(),
      subcategories: Array.from(subcategorySet).sort()
    };
  }, [allProducts]);
  
  // Filter products based on selected filters
  useEffect(() => {
    let result = [...allProducts];
    
    if (selectedSizes.length > 0) {
      result = result.filter(product => 
        product.size && selectedSizes.includes(product.size)
      );
    }
    
    if (selectedThemes.length > 0) {
      result = result.filter(product => 
        product.theme && selectedThemes.includes(product.theme)
      );
    }
    
    if (selectedSubcategories.length > 0) {
      result = result.filter(product => 
        product.subcategory && selectedSubcategories.includes(product.subcategory)
      );
    }
    
    setFilteredProducts(result);
  }, [allProducts, selectedSizes, selectedThemes, selectedSubcategories]);
  
  // Toggle filter selection
  const toggleFilter = (filterType: 'size' | 'theme' | 'subcategory', value: string) => {
    switch (filterType) {
      case 'size':
        setSelectedSizes(prev => 
          prev.includes(value) 
            ? prev.filter(item => item !== value)
            : [...prev, value]
        );
        break;
      case 'theme':
        setSelectedThemes(prev => 
          prev.includes(value) 
            ? prev.filter(item => item !== value)
            : [...prev, value]
        );
        break;
      case 'subcategory':
        setSelectedSubcategories(prev => 
          prev.includes(value) 
            ? prev.filter(item => item !== value)
            : [...prev, value]
        );
        break;
    }
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSelectedSizes([]);
    setSelectedThemes([]);
    setSelectedSubcategories([]);
  };
  
  // Check if any filter is active
  const hasActiveFilters = selectedSizes.length > 0 || 
                         selectedThemes.length > 0 || 
                         selectedSubcategories.length > 0;

  // Extract category from URL path
  const getCategoryFromPath = () => {
    const path = location.pathname;
    if (path === '/posters') return 'poster';
    if (path === '/polaroids') return 'polaroid';
    if (path === '/bundles') return 'bundle';
    if (path === '/customizable') return 'customizable';
    return null;
  };

  const category = getCategoryFromPath();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        let fetchedProducts: Product[] = [];

        if (category) {
          const fetchedProductsByCategory = await productsService.getProductsByCategory(category);
          fetchedProducts = fetchedProductsByCategory;
        } else {
          fetchedProducts = await productsService.getAllProducts();
        }

        // Load images from Firebase for each product
        const productsWithImages = await Promise.all(
          fetchedProducts.map(async (product) => {
            try {
              console.log(`🖼️ Loading images for product: ${product.name} (${product.id})`);
              
              // Get images from the separate productImages collection
              const productImages = await imageService.getProductImages(product.id);
              const imageUrls = productImages.map(img => img.imageData);
              
              console.log(`📸 Found ${productImages.length} images for ${product.name}`);
              
              // Validate and fix image format
              const validImages = imageUrls.filter((url, index) => {
                if (!url || typeof url !== 'string' || url.length < 100) {
                  console.warn(`⚠️ Product ${product.name}: Image ${index} is invalid`);
                  return false;
                }
                
                // Check if it's already a proper data URL or needs prefix
                if (url.startsWith('data:image/')) {
                  console.log(`✅ Product ${product.name}: Image ${index} is already proper data URL`);
                  return true;
                } else if (url.startsWith('/9j/') || url.match(/^[A-Za-z0-9+/]/)) {
                  console.log(`🔧 Product ${product.name}: Image ${index} needs data URL prefix`);
                  return true;
                } else {
                  console.warn(`⚠️ Product ${product.name}: Image ${index} has unknown format: ${url.substring(0, 50)}`);
                  return false;
                }
              });
              
              // Fix image format if needed
              const fixedImages = validImages.map(img => {
                if (img.startsWith('data:image/')) {
                  return img;
                } else if (img.startsWith('/9j/') || img.match(/^[A-Za-z0-9+/]/)) {
                  return `data:image/jpeg;base64,${img}`;
                }
                return img;
              });
              
              console.log(`✅ Product ${product.name}: Final valid images: ${fixedImages.length}`);
              
              return {
                ...product,
                images: fixedImages.length > 0 ? fixedImages : ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400']
              };
            } catch (error) {
              console.error(`❌ Error loading images for product ${product.name}:`, error);
              return {
                ...product,
                images: ['https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=400']
              };
            }
          })
        );

        setAllProducts(productsWithImages);
        setFilteredProducts(productsWithImages);
      } catch (error) {
        console.error('Error loading products:', error);
        setAllProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [category]);

  const getPageTitle = () => {
    if (category) return category.charAt(0).toUpperCase() + category.slice(1);
    return 'All Products';
  };
  
  const FilterSection = ({ 
    title, 
    options, 
    selected, 
    onToggle
  }: {
    title: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    if (options.length === 0) return null;
    
    return (
      <div className="mb-6">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
        >
          <span>{title}</span>
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {isExpanded && (
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => onToggle(option)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="capitalize">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
            <Link
              to="/"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FiFilter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {selectedSizes.length + selectedThemes.length + selectedSubcategories.length}
              </span>
            )}
          </button>
        </div>
        
        <div className="lg:flex lg:space-x-8">
          {/* Desktop Filters */}
          <div className={`lg:w-64 flex-shrink-0 ${!showFilters ? 'hidden' : ''} lg:block`}>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Clear all
                  </button>
                )}
                <button 
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <FilterSection
                  title="Size"
                  options={sizes}
                  selected={selectedSizes}
                  onToggle={(value) => toggleFilter('size', value)}
                />
                
                <FilterSection
                  title="Theme"
                  options={themes}
                  selected={selectedThemes}
                  onToggle={(value) => toggleFilter('theme', value)}
                />
                
                <FilterSection
                  title="Subcategory"
                  options={subcategories}
                  selected={selectedSubcategories}
                  onToggle={(value) => toggleFilter('subcategory', value)}
                />
              </div>
            </div>
          </div>
          
          {/* Product Grid */}
          <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No products match your filters' : 'No products found'}
            </h3>
            <p className="text-gray-600">
              {hasActiveFilters 
                ? 'Try adjusting your filters or clear all filters to see all products.'
                : 'Products will appear here once added to the database.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
