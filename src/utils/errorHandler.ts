/**
 * Centralized error handling utility
 * Provides user-friendly error messages for various error types
 */

export interface ErrorResponse {
  title: string;
  message: string;
  action?: string;
}

/**
 * Get user-friendly error message from Firebase error
 */
export const getFirebaseErrorMessage = (error: any): ErrorResponse => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Authentication Errors
  if (errorCode.startsWith('auth/')) {
    switch (errorCode) {
      case 'auth/invalid-email':
        return {
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
          action: 'Check your email format and try again.'
        };
      
      case 'auth/user-disabled':
        return {
          title: 'Account Disabled',
          message: 'Your account has been disabled.',
          action: 'Please contact support for assistance.'
        };
      
      case 'auth/user-not-found':
        return {
          title: 'Account Not Found',
          message: 'No account exists with this email.',
          action: 'Please check your email or create a new account.'
        };
      
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return {
          title: 'Invalid Credentials',
          message: 'The email or password you entered is incorrect.',
          action: 'Please check your credentials and try again.'
        };
      
      case 'auth/email-already-in-use':
        return {
          title: 'Email Already Registered',
          message: 'An account with this email already exists.',
          action: 'Please sign in or use a different email.'
        };
      
      case 'auth/weak-password':
        return {
          title: 'Weak Password',
          message: 'Your password is too weak.',
          action: 'Please use a password with at least 6 characters.'
        };
      
      case 'auth/too-many-requests':
        return {
          title: 'Too Many Attempts',
          message: 'Too many failed login attempts.',
          action: 'Please wait a few minutes and try again.'
        };
      
      case 'auth/network-request-failed':
        return {
          title: 'Network Error',
          message: 'Unable to connect to the server.',
          action: 'Please check your internet connection and try again.'
        };
      
      case 'auth/popup-closed-by-user':
        return {
          title: 'Sign In Cancelled',
          message: 'The sign-in popup was closed.',
          action: 'Please try signing in again.'
        };
      
      case 'auth/requires-recent-login':
        return {
          title: 'Session Expired',
          message: 'This action requires recent authentication.',
          action: 'Please sign in again to continue.'
        };
      
      default:
        return {
          title: 'Authentication Error',
          message: 'An error occurred during authentication.',
          action: 'Please try again or contact support.'
        };
    }
  }

  // Firestore Errors
  if (errorCode.startsWith('firestore/') || errorCode.includes('permission-denied')) {
    switch (errorCode) {
      case 'permission-denied':
      case 'firestore/permission-denied':
        return {
          title: 'Permission Denied',
          message: 'You do not have permission to perform this action.',
          action: 'Please sign in or contact support if you believe this is an error.'
        };
      
      case 'firestore/unavailable':
      case 'unavailable':
        return {
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable.',
          action: 'Please check your internet connection and try again.'
        };
      
      case 'firestore/not-found':
        return {
          title: 'Not Found',
          message: 'The requested data could not be found.',
          action: 'Please refresh the page and try again.'
        };
      
      case 'firestore/already-exists':
        return {
          title: 'Already Exists',
          message: 'This item already exists.',
          action: 'Please use a different identifier.'
        };
      
      case 'firestore/resource-exhausted':
        return {
          title: 'Quota Exceeded',
          message: 'Service quota has been exceeded.',
          action: 'Please try again later.'
        };
      
      case 'firestore/cancelled':
        return {
          title: 'Operation Cancelled',
          message: 'The operation was cancelled.',
          action: 'Please try again.'
        };
      
      case 'firestore/data-loss':
        return {
          title: 'Data Error',
          message: 'Unrecoverable data loss or corruption.',
          action: 'Please contact support immediately.'
        };
      
      case 'firestore/unauthenticated':
        return {
          title: 'Not Authenticated',
          message: 'You need to be signed in to perform this action.',
          action: 'Please sign in and try again.'
        };
      
      default:
        if (errorMessage.includes('nested entity')) {
          return {
            title: 'Data Format Error',
            message: 'The image data is too complex to process.',
            action: 'Please try with a smaller image or contact support via WhatsApp.'
          };
        }
        return {
          title: 'Database Error',
          message: 'An error occurred while accessing the database.',
          action: 'Please try again or contact support.'
        };
    }
  }

  // Storage Errors
  if (errorCode.startsWith('storage/')) {
    switch (errorCode) {
      case 'storage/unauthorized':
        return {
          title: 'Upload Not Authorized',
          message: 'You do not have permission to upload files.',
          action: 'Please sign in and try again.'
        };
      
      case 'storage/canceled':
        return {
          title: 'Upload Cancelled',
          message: 'The file upload was cancelled.',
          action: 'Please try uploading again.'
        };
      
      case 'storage/unknown':
        return {
          title: 'Upload Error',
          message: 'An unknown error occurred during upload.',
          action: 'Please try again with a different file.'
        };
      
      case 'storage/object-not-found':
        return {
          title: 'File Not Found',
          message: 'The requested file does not exist.',
          action: 'Please refresh and try again.'
        };
      
      case 'storage/quota-exceeded':
        return {
          title: 'Storage Quota Exceeded',
          message: 'Storage quota has been exceeded.',
          action: 'Please contact support.'
        };
      
      case 'storage/unauthenticated':
        return {
          title: 'Not Authenticated',
          message: 'You need to be signed in to upload files.',
          action: 'Please sign in and try again.'
        };
      
      case 'storage/retry-limit-exceeded':
        return {
          title: 'Upload Failed',
          message: 'Maximum retry limit exceeded.',
          action: 'Please check your connection and try again.'
        };
      
      default:
        return {
          title: 'Storage Error',
          message: 'An error occurred with file storage.',
          action: 'Please try again or contact support.'
        };
    }
  }

  // Network Errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the server.',
      action: 'Please check your internet connection and try again.'
    };
  }

  // Image/File Errors
  if (errorMessage.includes('image') || errorMessage.includes('file')) {
    return {
      title: 'File Error',
      message: 'There was a problem processing your file.',
      action: 'Please try with a different file or compress it first.'
    };
  }

  // Generic Error
  return {
    title: 'Error',
    message: errorMessage || 'An unexpected error occurred.',
    action: 'Please try again or contact support if the problem persists.'
  };
};

/**
 * Display error notification (can be integrated with toast/notification library)
 */
export const showError = (error: any, customMessage?: string): ErrorResponse => {
  const errorResponse = getFirebaseErrorMessage(error);
  
  if (customMessage) {
    errorResponse.message = customMessage;
  }
  
  console.error('Error:', {
    original: error,
    formatted: errorResponse
  });
  
  return errorResponse;
};

/**
 * Handle image upload errors specifically
 */
export const handleImageUploadError = (error: any, fileSize?: number): ErrorResponse => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (fileSize && fileSize > maxSize) {
    return {
      title: 'Image Too Large',
      message: 'The image resolution is too high for automatic processing.',
      action: 'Our admin will contact you via WhatsApp to assist with your custom order.'
    };
  }
  
  return getFirebaseErrorMessage(error);
};

/**
 * Validate and sanitize data for Firestore
 * Removes nested entities and complex structures
 */
export const sanitizeForFirestore = (data: any): any => {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    
    for (const key in data) {
      const value = data[key];
      
      // Skip undefined values
      if (value === undefined) {
        continue;
      }
      
      // Convert complex objects to strings if necessary
      if (typeof value === 'object' && value !== null) {
        // Check if it's a simple object or array
        if (Array.isArray(value)) {
          // For arrays, check if they contain simple values
          const hasComplexItems = value.some(item => 
            typeof item === 'object' && item !== null && !Array.isArray(item)
          );
          
          if (hasComplexItems) {
            // Convert to JSON string for storage
            sanitized[key] = JSON.stringify(value);
          } else {
            sanitized[key] = value;
          }
        } else {
          // For objects, check depth
          const depth = getObjectDepth(value);
          if (depth > 2) {
            // Convert deep objects to JSON string
            sanitized[key] = JSON.stringify(value);
          } else {
            sanitized[key] = sanitizeForFirestore(value);
          }
        }
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  return data;
};

/**
 * Get the depth of an object
 */
const getObjectDepth = (obj: any): number => {
  if (typeof obj !== 'object' || obj === null) {
    return 0;
  }
  
  let maxDepth = 0;
  for (const key in obj) {
    const depth = getObjectDepth(obj[key]);
    maxDepth = Math.max(maxDepth, depth);
  }
  
  return maxDepth + 1;
};
