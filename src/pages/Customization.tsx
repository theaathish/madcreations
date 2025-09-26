import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Plus, Trash2, Music, Image as ImageIcon,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';

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
  const { dispatch } = useCart();
  const [searchParams] = useSearchParams();
  
  // Get product type from URL params
  const productTypeParam = searchParams.get('type') as ProductType;
  const [selectedProductType, setSelectedProductType] = useState<ProductType>(productTypeParam);
  
  // Poster Configuration
  const [posterConfig, setPosterConfig] = useState<PosterConfig>({
    image: null,
    size: 'A4',
    quantity: 1
  });
  
  // Polaroid Configuration
  const [polaroidConfig, setPolaroidConfig] = useState<PolaroidConfig>({
    items: [{ id: '1', image: null, text: '', spotifyLink: '', size: 'normal', frameType: 'normal' }]
  });
  
  // Available sizes for polaroids
  const polaroidSizes = [
    { id: 'large', name: 'Large (3.3×2.2 inch)', price: 200 },
    { id: 'normal', name: 'Normal (2×2.5 inches)', price: 150 },
    { id: 'wallet', name: 'Wallet Card (2.5×3 inches)', price: 170 }
  ];
  
  // Available frame types
  const frameTypes = [
    { id: 'normal', name: 'Normal Frame', description: 'Classic polaroid style' },
    { id: 'spotify', name: 'Spotify Frame', description: 'With Spotify QR code' },
    { id: 'insta', name: 'Instagram Frame', description: 'Instagram-style layout' },
    { id: 'full', name: 'Full Frame', description: 'Edge-to-edge photo' },
    { id: 'filmstrip', name: 'Film Strip (4 pics)', description: '4 photos in film strip style' },
    { id: 'musicplayer', name: 'Music Player', description: 'Custom song name display' }
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
  const handleImageUpload = (file: File, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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
                      Click to upload image
                    </span>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </label>
                </div>
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
                      <label key={frame.id} className="flex flex-col p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center mb-2">
                          <input
                            type="radio"
                            name={`frame-${item.id}`}
                            value={frame.id}
                            checked={item.frameType === frame.id}
                            onChange={(e) => updatePolaroidItem(item.id, { frameType: e.target.value })}
                            className="mr-2"
                          />
                          <span className="font-medium text-sm">{frame.name}</span>
                        </div>
                        <span className="text-xs text-gray-600">{frame.description}</span>
                      </label>
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
            <div className="bg-white rounded-lg shadow-lg p-6">
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
            </div>
          </div>
        )}

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
    </div>
  );
};

export default Customization;
