// Image compression utility for Firebase Storage free tier
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `.${format}`),
              {
                type: `image/${format}`,
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

// Upload image to Firebase Storage with compression
export const uploadCompressedImage = async (
  file: File,
  storageRef: any,
  options: CompressionOptions = {}
): Promise<string> => {
  try {
    // Compress the image first
    const compressedFile = await compressImage(file, options);

    // Upload to Firebase Storage
    const snapshot = await storageRef.put(compressedFile);
    const downloadURL = await snapshot.ref.getDownloadURL();

    return downloadURL;
  } catch (error) {
    console.error('Error uploading compressed image:', error);
    throw error;
  }
};

// Batch compress multiple images
export const compressMultipleImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> => {
  const compressedFiles: File[] = [];

  for (const file of files) {
    try {
      const compressedFile = await compressImage(file, options);
      compressedFiles.push(compressedFile);
    } catch (error) {
      console.error(`Failed to compress image ${file.name}:`, error);
      // Add original file if compression fails
      compressedFiles.push(file);
    }
  }

  return compressedFiles;
};

// Get optimized image URL for different sizes (for responsive images)
export const getOptimizedImageUrl = (
  originalUrl: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string => {
  // For Firebase Storage, we can use URL parameters for resizing
  // Note: This requires Firebase Storage resize functionality to be enabled
  const sizeParams = {
    small: 'w_400,h_400,c_fit',
    medium: 'w_800,h_800,c_fit',
    large: 'w_1200,h_1200,c_fit'
  };

  // If the URL already contains query parameters, append to them
  // Otherwise, add them as the first parameters
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}alt=media&${sizeParams[size]}`;
};

// Validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB for free tier
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 5MB'
    };
  }

  return { valid: true };
};

// Get file size in human readable format
export const getFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
