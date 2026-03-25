import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { lazy, Suspense, memo } from 'react';

// Critical pages loaded immediately
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

// Less critical pages lazy loaded
const BrowsePage = lazy(() => import('./pages/BrowsePage').then(m => ({ default: m.BrowsePage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then(m => ({ default: m.ProductPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage').then(m => ({ default: m.EmailVerificationPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard').then(m => ({ default: m.SellerDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const BuybackPage = lazy(() => import('./pages/BuybackPage').then(m => ({ default: m.BuybackPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const Help = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })));

// Chatbot lazy loaded for performance
const ChatbotModern = lazy(() => import('./components/ChatbotModern').then(m => ({ default: m.ChatbotModern })));

// Ultra-fast loading component
const FastLoader = memo(() => (
  <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6F47]"></div>
  </div>
));

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
          <Suspense fallback={<FastLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/seller/dashboard" element={<SellerDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/buyback" element={<BuybackPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/help" element={<Help />} />
            </Routes>
          </Suspense>
          
          {/* Chatbot - Lazy loaded for performance */}
          <Suspense fallback={null}>
            <ChatbotModern />
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}