import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Plus, Trash2, Music, Image as ImageIcon,
  ShoppingCart, AlertCircle
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { bulkOrderService } from '../services/bulkOrderService';
import { useAuth } from '../contexts/AuthContext';
import { compressImage, validateImageFile, getFileSize } from '../utils/imageCompression';
import { handleImageUploadError } from '../utils/errorHandler';

// Product Types
type ProductType = 'poster' | 'polaroid' | null;

// Poster Configuration
interface PosterConfig {
  image: string | null;
  size: string;
  quantity: number;
}

// Polaroid Item
interface PolaroidItem {
  id: string;
  image: string | null;
  text: string;
  spotifyLink: string;
  size: string;
  frameType: string;
  customSongName?: string; // For music player frame
}

// Polaroid Configuration
interface PolaroidConfig {
  items: PolaroidItem[];
}

const Customization: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { dispatch } = useCart();
  const { user } = useAuth();
  
  // Get product type from URL params
  const productTypeParam = searchParams.get('type') as ProductType;
  const [selectedProductType, setSelectedProductType] = useState<ProductType>(productTypeParam);
  
  // Bulk order enquiry state
  const [showBulkEnquiry, setShowBulkEnquiry] = useState(false);
  const [enquiryStatus, setEnquiryStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [enquiryForm, setEnquiryForm] = useState(() => ({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    quantity: '',
    message: '',
    productType: productTypeParam || 'other' as const,
  }));

  // WhatsApp order state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState<{
    id: string;
    name: string;
    whatsappAction: () => void;
  } | null>(null);
  
  // Image upload state
  const [imageError, setImageError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showHighResWarning, setShowHighResWarning] = useState(false);

  const handleEnquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEnquiryForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnquiryStatus('submitting');
    
    try {
      await bulkOrderService.createEnquiry({
        ...enquiryForm,
        productType: selectedProductType || 'other',
      });
      
      setEnquiryStatus('success');
      setEnquiryForm({
        name: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        quantity: '',
        message: '',
        productType: selectedProductType || 'other' as const,
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setEnquiryStatus('idle');
        setShowBulkEnquiry(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      setEnquiryStatus('error');
    }
  };
  // Poster Configuration
  const [posterConfig, setPosterConfig] = useState<PosterConfig>({
    image: null,
    size: 'A4', // Add default size
    quantity: 1
  });
  
  // Polaroid Configuration
  const [polaroidConfig, setPolaroidConfig] = useState<PolaroidConfig>({
    items: [
      {
        id: '1',
        image: null,
        text: '',
        spotifyLink: '',
        size: '3x4',
        frameType: 'classic'
      }
    ]
  });

  // Available sizes for polaroids
  const polaroidSizes = [
    { id: 'large', name: 'Large (3.3×2.2 inch)', price: 20 },
    { id: 'normal', name: 'Normal (2×2.5 inches)', price: 15 },
    { id: 'wallet', name: 'Wallet Card (2.5×3 inches)', price: 17 }
  ];
  
  // Function to handle WhatsApp redirection
  const handleWhatsAppOrder = (frameType: string) => {
    const phoneNumber = '918667009306';
    const message = `Hi, I'm interested in ordering a ${frameType}. Can you help me with this?`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setShowWhatsAppModal(false);
  };

  // Handle frame selection
  const handleFrameSelect = (frame: any, itemId: string) => {
    if (frame.whatsappAction) {
      setSelectedFrame({
        id: frame.id,
        name: frame.name,
        whatsappAction: frame.whatsappAction
      });
      setShowWhatsAppModal(true);
    } else if (updatePolaroidItem) {
      updatePolaroidItem(itemId, { frameType: frame.id });
    }
  };

  // Available frame types
  const frameTypes = [
    { 
      id: 'normal', 
      name: 'Normal Frame', 
      description: 'Classic polaroid style'
    },
    { 
      id: 'spotify', 
      name: 'Spotify Frame', 
      description: 'With Spotify QR code'
    },
    { 
      id: 'insta', 
      name: 'Instagram Frame', 
      description: 'Instagram-style layout'
    },
    { 
      id: 'full', 
      name: 'Full Frame', 
      description: 'Edge-to-edge photo'
    },
    { 
      id: 'filmstrip', 
      name: 'Film Strip (4 pics) - ₹45', 
      description: '4 photos in film strip style',
      whatsappAction: () => handleWhatsAppOrder('Film Strip Polaroid - ₹45')
    },
    { 
      id: 'musicplayer', 
      name: 'Music Player', 
      description: 'Custom song name display'
    },
    { 
      id: 'ar', 
      name: 'AR Polaroid - ₹50', 
      description: 'Augmented Reality experience',
      whatsappAction: () => handleWhatsAppOrder('AR Polaroid - ₹50')
    }
  ];
  
  // Available sizes for posters
  const posterSizes = [
    { id: 'A6', name: 'A6 (10.5×14.8 cm)', price: 39 },
    { id: 'A5', name: 'A5 (14.8×21 cm)', price: 59 },
    { id: 'A4', name: 'A4 (21×29.7 cm)', price: 79 },
    { id: 'A3', name: 'A3 (29.7×42 cm)', price: 109 },
    { id: '9x12', name: '9×12 inches', price: 89 }
  ];
  
  // Helper functions
  const handleImageUpload = async (file: File, callback: (url: string) => void) => {
    try {
      setImageError(null);
      setIsCompressing(true);
      
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setImageError(validation.error || 'Invalid file');
        setIsCompressing(false);
        return;
      }
      
      // Check file size - if > 2MB, show warning and compress
      const isHighRes = file.size > 2 * 1024 * 1024;
      
      if (isHighRes) {
        console.log(`High resolution image detected: ${getFileSize(file.size)}`);
        setShowHighResWarning(true);
      }
      
      // Compress image
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        format: 'jpeg'
      });
      
      console.log(`Image compressed from ${getFileSize(file.size)} to ${getFileSize(compressedFile.size)}`);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        callback(e.target?.result as string);
        setIsCompressing(false);
      };
      reader.onerror = () => {
        const error = handleImageUploadError(new Error('Failed to read file'), file.size);
        setImageError(error.message);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
      
    } catch (error: any) {
      console.error('Error handling image upload:', error);
      const errorResponse = handleImageUploadError(error, file.size);
      setImageError(errorResponse.message);
      setIsCompressing(false);
      
      // If image is too large, show WhatsApp contact option
      if (file.size > 5 * 1024 * 1024) {
        setShowHighResWarning(true);
      }
    }
  };
  
  const addPolaroidItem = () => {
    const newItem: PolaroidItem = {
      id: Date.now().toString(),
      image: null,
      text: '',
      spotifyLink: '',
      size: 'normal',
      frameType: 'normal'
    };
    setPolaroidConfig({
      items: [...polaroidConfig.items, newItem]
    });
  };
  
  const removePolaroidItem = (id: string) => {
    setPolaroidConfig({
      items: polaroidConfig.items.filter(item => item.id !== id)
    });
  };
  
  const updatePolaroidItem = (id: string, updates: Partial<PolaroidItem>) => {
    setPolaroidConfig({
      items: polaroidConfig.items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    });
  };
  
  const calculateTotal = () => {
    if (selectedProductType === 'poster') {
      const sizePrice = posterSizes.find(s => s.id === posterConfig.size)?.price || 0;
      return sizePrice * posterConfig.quantity;
    } else if (selectedProductType === 'polaroid') {
      return polaroidConfig.items.reduce((total, item) => {
        const sizePrice = polaroidSizes.find(s => s.id === item.size)?.price || 150;
        return total + sizePrice;
      }, 0);
    }
    return 0;
  };
  
  const addToCart = () => {
    if (selectedProductType === 'poster' && posterConfig.image) {
      const customProduct = {
        id: `poster-${Date.now()}`,
        name: `Custom Poster (${posterConfig.size})`,
        price: calculateTotal(),
        images: [posterConfig.image],
        category: 'poster' as const,
        subcategory: 'Custom Print',
        description: `Custom poster in ${posterConfig.size} size`,
        inStock: true,
        featured: false,
        ratings: 5,
        reviewCount: 0
      };
      
      dispatch({
        type: 'ADD_ITEM',
        payload: { product: customProduct, quantity: posterConfig.quantity }
      });
      
      alert('Poster added to cart!');
    } else if (selectedProductType === 'polaroid' && polaroidConfig.items.some(item => item.image)) {
      polaroidConfig.items.forEach((item, index) => {
        if (item.image) {
          const sizePrice = polaroidSizes.find(s => s.id === item.size)?.price || 150;
          const customProduct = {
            id: `polaroid-${Date.now()}-${index}`,
            name: `Custom Polaroid ${index + 1} (${item.size} - ${item.frameType})`,
            price: sizePrice,
            images: [item.image],
            category: 'polaroid' as const,
            subcategory: 'Custom Print',
            description: `Custom ${item.size} polaroid with ${item.frameType} frame${item.text ? ` - Text: ${item.text}` : ''}`,
            inStock: true,
            featured: false,
            ratings: 5,
            reviewCount: 0
          };
          
          dispatch({
            type: 'ADD_ITEM',
            payload: { 
              product: customProduct, 
              quantity: 1,
              customizations: {
                customImages: [item.image],
                customText: item.text,
                spotifyUrl: item.spotifyLink,
                size: item.size,
                frameType: item.frameType,
                customSongName: item.customSongName
              }
            }
          });
        }
      });
      
      alert('Polaroids added to cart!');
    }
  };

  // WhatsApp Order Modal
  const WhatsAppOrderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order {selectedFrame?.name}</h3>
        <p className="text-gray-600 mb-6">
          Would you like to proceed with your order for <span className="font-medium">{selectedFrame?.name}</span> via WhatsApp?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowWhatsAppModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Continue Customizing
          </button>
          <button
            onClick={() => selectedFrame?.whatsappAction()}
            className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.498 14.382l-.002-.001h-.016c-1.36 0-1.617-.639-2.326-2.227-.224-.5-.4-.86-.586-1.083-.226-.273-.35-.358-.541-.372-.134-.01-.257-.009-.372-.01s-.343 0-.53.077c-.416.171-.72.59-.925 1.247-.048.154-.086.333-.124.512-.11.522-.187 1.02-.103 1.202.12.255.417.41.9.656.48.245 1.06.55 1.523.9.39.293.7.64.9.9.28.365.49.77.63 1.16.14.39.21.84.11 1.21-.1.36-.34.69-.71.87-.39.19-.88.24-1.47.14-.68-.11-1.41-.46-2.16-.9-1.33-.78-2.22-1.79-2.87-2.9-1.02-1.75-1.28-3.57-.89-4.78.24-.74.75-1.35 1.41-1.69.5-.25.83-.25 1.13-.25.13 0 .25 0 .36.01.25.01.4.03.58.19.17.16.6.6.73.79.13.19.26.46.04.9-.16.39-.64 1.18-.9 1.55-.19.27-.4.28-.74.1-.34-.18-1.42-.52-2.71-1.67-.2-.18-.34-.3-.44-.39-.14-.12-.24-.18-.37-.18s-.36.05-.56.08c-.17.03-.4.06-.62.17-.23.11-.39.26-.5.41-.2.25-.55.85-.55 1.66 0 .81.5 1.93.95 2.63.23.36 1.03 1.5 2.5 2.42 1.47.92 2.1 1.08 2.85 1.14.2.02.4.03.59.03.8 0 1.39-.13 1.68-.23.3-.1.5-.36.61-.42.11-.06.24-.1.37-.1.1 0 .21.01.31.05.1.04.21.11.33.21.12.1.8.72.94.86.14.14.28.15.52.1.25-.05 1.08-.4 1.23-1.39.15-.99.15-.92.25-1.05.1-.13.2-.11.31-.07.11.04.7.33 1.2.54.5.21.83.32.91.5.09.18.07 1.03-.15 1.99z"/>
            </svg>
            Continue to WhatsApp
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-3xl font-bold text-gray-900">Custom Products</h1>
          </div>
          {selectedProductType && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-purple-600">₹{calculateTotal()}</p>
            </div>
          )}
        </div>

        {/* Product Type Selection */}
        {!selectedProductType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div 
              onClick={() => setSelectedProductType('poster')}
              className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-500"
            >
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Custom Posters</h3>
                <p className="text-gray-600 mb-4">Upload your image and choose size</p>
                <div className="text-sm text-gray-500">
                  <p>Starting from ₹39</p>
                  <p>Multiple sizes available</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setSelectedProductType('polaroid')}
              className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-500"
            >
              <div className="text-center">
                <Music className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Personalized Polaroids</h3>
                <p className="text-gray-600 mb-4">Upload Your Photos with Custom Options</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p><strong>Sizes:</strong> Large, Normal, Wallet Card</p>
                  <p><strong>Frames:</strong> Normal, Spotify, Instagram, Full, Film Strip, Music Player</p>
                  <p><strong>Starting from ₹150</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Poster Customization */}
        {selectedProductType === 'poster' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                {posterConfig.image ? (
                  <img 
                    src={posterConfig.image} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <ImageIcon className="h-16 w-16 mx-auto mb-2" />
                    <p>Upload an image to see preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, (url) => {
                          setPosterConfig({ ...posterConfig, image: url });
                        });
                      }
                    }}
                    className="hidden"
                    id="poster-image"
                  />
                  <label htmlFor="poster-image" className="cursor-pointer">
                    <span className="text-purple-600 hover:text-purple-700 font-medium">
                      {isCompressing ? 'Compressing image...' : 'Click to upload image'}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </label>
                </div>
                
                {/* Error Message */}
                {imageError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{imageError}</p>
                  </div>
                )}
                
                {/* High Resolution Warning */}
                {showHighResWarning && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800">High Resolution Image Detected</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your image has been compressed for upload. For best quality custom prints with high-resolution images, 
                          our admin will contact you via WhatsApp to assist with your order.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const phone = '919876543210'; // Replace with actual WhatsApp number
                        const message = encodeURIComponent('Hi, I need help with a high-resolution custom poster order.');
                        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                      }}
                      className="mt-2 text-sm text-yellow-800 hover:text-yellow-900 font-medium underline"
                    >
                      Contact us on WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {/* Size Selection */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Size</h3>
                <div className="space-y-3">
                  {posterSizes.map((size) => (
                    <label key={size.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="size"
                          value={size.id}
                          checked={posterConfig.size === size.id}
                          onChange={(e) => setPosterConfig({ ...posterConfig, size: e.target.value })}
                          className="mr-3"
                        />
                        <span className="font-medium">{size.name}</span>
                      </div>
                      <span className="text-purple-600 font-semibold">₹{size.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setPosterConfig({ ...posterConfig, quantity: Math.max(1, posterConfig.quantity - 1) })}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{posterConfig.quantity}</span>
                  <button
                    onClick={() => setPosterConfig({ ...posterConfig, quantity: posterConfig.quantity + 1 })}
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                onClick={addToCart}
                disabled={!posterConfig.image}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart - ₹{calculateTotal()}
              </button>
            </div>
          </div>
        )}

        {/* Polaroid Customization */}
        {selectedProductType === 'polaroid' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Polaroid Items ({polaroidConfig.items.length})</h3>
              <button
                onClick={addPolaroidItem}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            {polaroidConfig.items.map((item, index) => (
              <div key={item.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Polaroid {index + 1}</h4>
                  {polaroidConfig.items.length > 1 && (
                    <button
                      onClick={() => removePolaroidItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {item.image ? (
                        <img src={item.image} alt="Preview" className="w-full h-32 object-cover rounded" />
                      ) : (
                        <div className="py-8">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Upload your image</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, (url) => updatePolaroidItem(item.id, { image: url }));
                          }
                        }}
                        className="hidden"
                        id={`image-${item.id}`}
                      />
                      <label
                        htmlFor={`image-${item.id}`}
                        className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium block mt-2"
                      >
                        {item.image ? 'Change Image' : 'Upload Image'}
                      </label>
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <div className="space-y-2">
                      {polaroidSizes.map((size) => (
                        <label key={size.id} className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name={`size-${item.id}`}
                              value={size.id}
                              checked={item.size === size.id}
                              onChange={(e) => updatePolaroidItem(item.id, { size: e.target.value })}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium">{size.name}</span>
                          </div>
                          <span className="text-purple-600 font-semibold text-sm">₹{size.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Frame Type Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Frame Type</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {frameTypes.map((frame) => (
                      <div 
                        key={frame.id} 
                        className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${frame.whatsappAction ? 'border-green-200' : ''}`}
                        onClick={() => handleFrameSelect(frame, item.id)}
                      >
                        <div className="p-3 hover:bg-gray-50">
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-400 mr-2">
                              {item.frameType === frame.id && (
                                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                              )}
                            </div>
                            <span className="font-medium text-sm">{frame.name}</span>
                          </div>
                          <span className="text-xs text-gray-600">{frame.description}</span>
                        </div>
                        {frame.whatsappAction && (
                          <div className="px-3 pb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFrameSelect(frame, item.id);
                              }}
                              className="w-full bg-green-500 hover:bg-green-600 text-white py-1.5 px-4 text-xs font-medium flex items-center justify-center transition-colors rounded-md"
                            >
                              <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.498 14.382l-.002-.001h-.016c-1.36 0-1.617-.639-2.326-2.227-.224-.5-.4-.86-.586-1.083-.226-.273-.35-.358-.541-.372-.134-.01-.257-.009-.372-.01s-.343 0-.53.077c-.416.171-.72.59-.925 1.247-.048.154-.086.333-.124.512-.11.522-.187 1.02-.103 1.202.12.255.417.41.9.656.48.245 1.06.55 1.523.9.39.293.7.64.9.9.28.365.49.77.63 1.16.14.39.21.84.11 1.21-.1.36-.34.69-.71.87-.39.19-.88.24-1.47.14-.68-.11-1.41-.46-2.16-.9-1.33-.78-2.22-1.79-2.87-2.9-1.02-1.75-1.28-3.57-.89-4.78.24-.74.75-1.35 1.41-1.69.5-.25.83-.25 1.13-.25.13 0 .25 0 .36.01.25.01.4.03.58.19.17.16.6.6.73.79.13.19.26.46.04.9-.16.39-.64 1.18-.9 1.55-.19.27-.4.28-.74.1-.34-.18-1.42-.52-2.71-1.67-.2-.18-.34-.3-.44-.39-.14-.12-.24-.18-.37-.18s-.36.05-.56.08c-.17.03-.4.06-.62.17-.23.11-.39.26-.5.41-.2.25-.55.85-.55 1.66 0 .81.5 1.93.95 2.63.23.36 1.03 1.5 2.5 2.42 1.47.92 2.1 1.08 2.85 1.14.2.02.4.03.59.03.8 0 1.39-.13 1.68-.23.3-.1.5-.36.61-.42.11-.06.24-.1.37-.1.1 0 .21.01.31.05.1.04.21.11.33.21.12.1.8.72.94.86.14.14.28.15.52.1.25-.05 1.08-.4 1.23-1.39.15-.99.15-.92.25-1.05.1-.13.2-.11.31-.07.11.04.7.33 1.2.54.5.21.83.32.91.5.09.18.07 1.03-.15 1.99z"/>
                              </svg>
                              Order Now
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Song Name for Music Player Frame */}
                {item.frameType === 'musicplayer' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Song Name
                    </label>
                    <input
                      type="text"
                      value={item.customSongName || ''}
                      onChange={(e) => updatePolaroidItem(item.id, { customSongName: e.target.value })}
                      placeholder="Enter song name (e.g., 'My Favorite Song - Artist')"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}                
                {/* Text and Spotify */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
                    <textarea
                      value={item.text}
                      onChange={(e) => updatePolaroidItem(item.id, { text: e.target.value })}
                      placeholder="Add custom text..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Music className="h-4 w-4 inline mr-1" />
                      Spotify Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={item.spotifyLink}
                      onChange={(e) => updatePolaroidItem(item.id, { spotifyLink: e.target.value })}
                      placeholder="https://open.spotify.com/..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add to Cart */}
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    Total: ₹{calculateTotal()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {polaroidConfig.items.filter(item => item.image).length} items with images
                  </p>
                </div>
                <button
                  onClick={addToCart}
                  disabled={!polaroidConfig.items.some(item => item.image)}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>
              </div>
              
              {/* Bulk Order Enquiry Toggle */}
              <div className="text-center">
                <button 
                  onClick={() => setShowBulkEnquiry(!showBulkEnquiry)}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  {showBulkEnquiry ? 'Hide Bulk Order Enquiry' : 'Need a bulk order? Click here to enquire'}
                </button>
              </div>
              
              {/* Bulk Order Enquiry Form */}
              {showBulkEnquiry && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Order Enquiry</h3>
                  <form onSubmit={handleEnquirySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={enquiryForm.name}
                          onChange={handleEnquiryChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={enquiryForm.email}
                          onChange={handleEnquiryChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={enquiryForm.phone}
                          onChange={handleEnquiryChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Estimated Quantity *</label>
                        <select
                          id="quantity"
                          name="quantity"
                          value={enquiryForm.quantity}
                          onChange={handleEnquiryChange}
                          required
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select quantity</option>
                          <option value="10-50">10-50 pieces</option>
                          <option value="51-100">51-100 pieces</option>
                          <option value="101-250">101-250 pieces</option>
                          <option value="251-500">251-500 pieces</option>
                          <option value="500+">500+ pieces</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                      <textarea
                        id="message"
                        name="message"
                        value={enquiryForm.message}
                        onChange={handleEnquiryChange}
                        rows={3}
                        placeholder="Tell us more about your bulk order requirements..."
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowBulkEnquiry(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Submit Enquiry
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Order Enquiry Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Order Enquiry</h2>
            <button
              onClick={() => setShowBulkEnquiry(!showBulkEnquiry)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              {showBulkEnquiry ? 'Hide Form' : 'Request Bulk Order'}
            </button>
          </div>

          {showBulkEnquiry && (
            <div className="mt-6">
              {enquiryStatus === 'success' ? (
                <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">Thank you for your enquiry! We'll get back to you soon.</p>
                </div>
              ) : enquiryStatus === 'error' ? (
                <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">Failed to submit enquiry. Please try again later.</p>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={enquiryForm.name}
                        onChange={handleEnquiryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={enquiryForm.email}
                        onChange={handleEnquiryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={enquiryForm.phone}
                        onChange={handleEnquiryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Quantity *
                      </label>
                      <select
                        id="quantity"
                        name="quantity"
                        value={enquiryForm.quantity}
                        onChange={handleEnquiryChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select quantity range</option>
                        <option value="10-50">10-50 pieces</option>
                        <option value="51-100">51-100 pieces</option>
                        <option value="101-250">101-250 pieces</option>
                        <option value="251-500">251-500 pieces</option>
                        <option value="500+">500+ pieces</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Requirements
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={enquiryForm.message}
                      onChange={handleEnquiryChange}
                      placeholder="Tell us more about your bulk order requirements, including any specific designs, sizes, or customization needs..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowBulkEnquiry(false)}
                      className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      disabled={enquiryStatus === 'submitting'}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                      disabled={enquiryStatus === 'submitting'}
                    >
                      {enquiryStatus === 'submitting' ? 'Submitting...' : 'Submit Enquiry'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        {selectedProductType && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              {selectedProductType === 'poster' ? '📸 Poster Guidelines' : '🎵 Polaroid Guidelines'}
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              {selectedProductType === 'poster' ? (
                <>
                  <p>• Upload high-resolution images for best print quality</p>
                  <p>• Supported formats: JPG, PNG (max 10MB)</p>
                  <p>• Images will be printed as uploaded - no automatic cropping</p>
                  <p>• Processing time: 2-3 business days</p>
                </>
              ) : (
                <>
                  <p>• Each polaroid can have an image, custom text, and Spotify link</p>
                  <p>• Spotify links will generate a QR code on the polaroid</p>
                  <p>• Text will be printed below the image</p>
                  <p>• Processing time: 3-5 business days</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* WhatsApp Order Modal */}
      {showWhatsAppModal && selectedFrame && <WhatsAppOrderModal />}
    </div>
  );
};

export default Customization;
