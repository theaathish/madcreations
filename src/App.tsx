import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout components (keep these eager loaded as they're needed immediately)
import Header from './components/Header';
import Footer from './components/Footer';

// Lazy load pages for better code splitting
const Home = lazy(() => import('./pages/Home'));
const ProductList = lazy(() => import('./pages/ProductListOptimized'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Profile = lazy(() => import('./pages/Profile'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Customization = lazy(() => import('./pages/Customization'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement'));
const BulkOrderEnquiries = lazy(() => import('./pages/admin/BulkOrderEnquiries'));

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="bulk-orders" element={<BulkOrderEnquiries />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="analytics" element={<div className="p-8"><h1 className="text-2xl">Analytics</h1></div>} />
              <Route path="settings" element={<div className="p-8"><h1 className="text-2xl">Settings</h1></div>} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Protected User Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/my-orders" element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Public Routes */}
            <Route path="/*" element={
              <>
                <Header />
                <main className="min-h-screen">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/posters" element={<ProductList />} />
                    <Route path="/polaroids" element={<ProductList />} />
                    <Route path="/bundles" element={<ProductList />} />
                    <Route path="/customizable" element={<Customization />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/search" element={<ProductList />} />
                    <Route path="/cart" element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    } />
                    <Route path="/account" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/product/:id" element={<ProductDetail />} />
                  </Routes>
                </main>
                <Footer />
              </>
            } />
          </Routes>
          </Suspense>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;