import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { productsService, imageService } from '../services/firebaseService';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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
  const [showSplitPoster, setShowSplitPoster] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  
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
  
  // Predefined filter options
  const { sizes, themes } = useMemo(() => {
    // Predefined sizes
    const predefinedSizes = [
      'A4',
      '12x9',
      'A3'
    ];
  
    
    // Predefined themes
    const predefinedThemes = [
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
    
    return {
      sizes: predefinedSizes,
      themes: predefinedThemes
    };
  }, [allProducts]);
  
  
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
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSizes, selectedThemes, selectedSubcategories, showSplitPoster, category]);
  
  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Filter products based on selected filters
  useEffect(() => {
    let result = [...allProducts];
    console.log(`🔍 Starting filter with ${allProducts.length} products`);
    
    // Filter by poster type when on poster page
    if (category === 'poster') {
      const beforeFilterCount = result.length;
      if (showSplitPoster) {
        result = result.filter(product => product.category === 'split_poster');
        console.log(`📊 Split poster filter: ${beforeFilterCount} → ${result.length} products`);
      } else {
        result = result.filter(product => product.category === 'poster');
        console.log(`📊 Regular poster filter: ${beforeFilterCount} → ${result.length} products`);
      }
    }
    
    if (selectedSizes.length > 0) {
      const beforeCount = result.length;
      result = result.filter(product => 
        (product as any).size && selectedSizes.includes((product as any).size)
      );
      console.log(`📊 Size filter: ${beforeCount} → ${result.length} products`);
    }
    
    if (selectedThemes.length > 0) {
      const beforeCount = result.length;
      result = result.filter(product => 
        (product as any).theme && selectedThemes.includes((product as any).theme)
      );
      console.log(`📊 Theme filter: ${beforeCount} → ${result.length} products`);
    }
    
    if (selectedSubcategories.length > 0) {
      const beforeCount = result.length;
      result = result.filter(product => 
        (product as any).subcategory && selectedSubcategories.includes((product as any).subcategory)
      );
      console.log(`📊 Subcategory filter: ${beforeCount} → ${result.length} products`);
    }
    
    console.log(`✅ Final filtered products: ${result.length}`);
    setFilteredProducts(result);
  }, [allProducts, selectedSizes, selectedThemes, selectedSubcategories, showSplitPoster, category]);

  // Reset toggle when category changes
  useEffect(() => {
    if (category !== 'poster') {
      setShowSplitPoster(false);
    }
  }, [category]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        let fetchedProducts: Product[] = [];

        if (category) {
          if (category === 'poster') {
            // For poster page, load both poster and split_poster categories
            try {
              const posterProducts = await productsService.getProductsByCategory('poster');
              const splitPosterProducts = await productsService.getProductsByCategory('split_poster');
              fetchedProducts = [...posterProducts, ...splitPosterProducts];
              console.log(`📦 Loaded ${posterProducts.length} poster products and ${splitPosterProducts.length} split poster products`);
            } catch (error) {
              console.error('Error loading poster products:', error);
              fetchedProducts = [];
            }
          } else {
            const fetchedProductsByCategory = await productsService.getProductsByCategory(category);
            fetchedProducts = fetchedProductsByCategory;
          }
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
              
              {/* Poster/Split Poster Toggle */}
              {category === 'poster' && (
                <div className="mt-3 mb-2">
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setShowSplitPoster(false)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        !showSplitPoster 
                          ? 'bg-white text-purple-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Regular Posters
                    </button>
                    <button
                      onClick={() => setShowSplitPoster(true)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        showSplitPoster 
                          ? 'bg-white text-purple-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Split Posters
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-4 sm:mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Mobile/Desktop Filters */}
          <div className={`w-full lg:w-64 flex-shrink-0 mb-6 lg:mb-0 ${!showFilters ? 'hidden' : 'block'} lg:block`}>
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
                
                {/* Subcategory filter hidden as per requirement */}
              </div>
            </div>
          </div>
          
          {/* Product Grid */}
          <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-40 sm:h-48 bg-gray-300"></div>
                <div className="p-3 sm:p-4">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                  aria-label="Previous page"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        1
                      </button>
                      {currentPage > 4 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                    </>
                  )}
                  
                  {/* Page numbers around current page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return (
                        page === currentPage ||
                        page === currentPage - 1 ||
                        page === currentPage - 2 ||
                        page === currentPage + 1 ||
                        page === currentPage + 2
                      );
                    })
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                  aria-label="Next page"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
