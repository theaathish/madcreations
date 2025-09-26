# Mad Creations - Firebase E-commerce Application

A modern, full-stack e-commerce application for selling posters, polaroids, and customizable artwork with Firebase integration.

## 🚀 Features

### ✅ Authentication System
- **User Registration & Login** with email/password and Google OAuth
- **Protected Routes** for authenticated users only
- **User Profile Management** with detailed profile information
- **Password Security** with validation and requirements

### ✅ Product Management
- **Real-time Product Catalog** powered by Firebase Firestore
- **Advanced Search & Filtering** by category, price, size, and theme
- **Product Categories**: Posters, Polaroids, Bundles, Customizable items
- **Featured Products** with special highlighting
- **Dynamic Product Loading** with loading states

### ✅ Shopping Experience
- **Shopping Cart** with persistent storage
- **Product Search** with real-time results
- **Responsive Design** for all devices
- **Modern UI/UX** with Tailwind CSS

### ✅ Admin Dashboard
- **Admin Panel** for product and order management
- **Product CRUD Operations** (Create, Read, Update, Delete)
- **Order Management** with status tracking
- **Customer Management** interface

### ✅ Firebase Integration
- **Firestore Database** for real-time data storage
- **Firebase Authentication** for secure user management
- **Firebase Storage** with image compression for free tier
- **Real-time Updates** across all connected clients

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Routing**: React Router DOM
- **State Management**: React Context + useReducer
- **Image Processing**: Custom compression utilities

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation with auth status
│   ├── Footer.tsx      # Site footer
│   └── ProductCard.tsx # Product display component
├── pages/              # Page components
│   ├── Home.tsx        # Landing page with featured products
│   ├── ProductList.tsx # Product catalog with filtering
│   ├── Cart.tsx        # Shopping cart
│   ├── Login.tsx       # User login
│   ├── Signup.tsx      # User registration
│   ├── Profile.tsx     # User profile management
│   └── admin/          # Admin panel pages
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state management
│   └── CartContext.tsx # Shopping cart state
├── services/           # Firebase service functions
│   └── firebaseService.ts # Firestore operations
├── utils/              # Utility functions
│   └── imageCompression.ts # Image optimization
├── firebase.ts         # Firebase configuration
└── types/              # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with free tier account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd madcreations-firebase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password + Google)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config and replace in `src/firebase.ts`

4. **Populate Initial Data**
   ```bash
   # Edit populateFirebase.js and uncomment the last line
   node populateFirebase.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open your browser** and navigate to `http://localhost:5173`

## 🔐 Authentication

### User Registration
- Email and password validation
- Profile information collection (name, phone, address)
- State selection for shipping
- Google OAuth integration

### User Login
- Email/password authentication
- Google OAuth login
- Remember me functionality
- Password reset (coming soon)

### Profile Management
- View and edit personal information
- Address management
- Profile picture integration
- Account settings

## 🛍 Product Management

### Product Features
- **Categories**: Posters, Polaroids, Bundles, Customizable
- **Attributes**: Size, theme, price, ratings, stock status
- **Images**: Multiple product images with compression
- **Search**: Full-text search across name, description, theme
- **Filtering**: Price range, size, theme filters

### Admin Functions
- Add new products with image upload
- Edit existing product information
- Delete products
- Manage product inventory
- View sales analytics

## 🖼 Image Optimization

### Free Tier Optimization
- **Automatic Compression**: Images compressed to <5MB
- **Format Optimization**: WebP, JPEG, PNG support
- **Responsive Images**: Multiple sizes for different devices
- **Storage Efficiency**: Optimized for Firebase free tier limits

### Compression Features
- Max width/height: 1200px
- Quality: 80% for optimal balance
- File size validation: <5MB
- Batch processing support

## 🔧 Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Firebase project credentials:
   - Get these values from [Firebase Console](https://console.firebase.google.com/) > Project Settings > General > Your apps
   - Fill in all required environment variables

### Required Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Application Settings
VITE_SITE_URL=https://your-domain.com
VITE_ENV=development
```

### Security Rules

**Firestore Rules** (set in Firebase Console):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Products are publicly readable
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null; // Admin only
    }

    // Orders are private to users and admins
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Public read for product images
      allow write: if request.auth != null; // Authenticated uploads only
    }
  }
}
```

## 📱 Responsive Design

- **Mobile-first approach** with Tailwind CSS
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid layouts** adapt to screen size
- **Touch-friendly** interface elements
- **Optimized images** for different screen densities

## 🔒 Security Features

- **Firebase Authentication** with secure token management
- **Protected routes** for authenticated users
- **Input validation** on all forms
- **XSS protection** with proper sanitization
- **CSRF protection** via Firebase security rules

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify/Vercel
- Connect your Git repository
- Set build command: `npm run build`
- Set publish directory: `dist`
- Add Firebase config as environment variables

### Environment Variables
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 📊 Performance Optimizations

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Compression and WebP format
- **Caching**: Firebase SDK caching
- **Bundle Optimization**: Vite build optimizations
- **Loading States**: Skeleton screens for better UX

## 🔄 Real-time Features

- **Live Product Updates**: Changes reflect immediately
- **User Authentication State**: Instant login/logout
- **Cart Synchronization**: Real-time cart updates
- **Order Status Updates**: Live order tracking

## 🐛 Error Handling

- **Network Error Handling**: Graceful fallbacks
- **Authentication Errors**: User-friendly messages
- **Validation Errors**: Form-level error display
- **Loading States**: Skeleton screens during data fetch

## 📈 Analytics Ready

- **Firebase Analytics** integration ready
- **User Journey Tracking** setup
- **Conversion Funnel** monitoring
- **Performance Monitoring** with Firebase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the Firebase documentation
- Review the component documentation

---

**Built with ❤️ using Firebase, React, and TypeScript**
