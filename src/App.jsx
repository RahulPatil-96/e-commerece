import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from '@/lib/cartContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageMeta from '@/components/PageMeta';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import B2B from '@/pages/B2B';
import About from '@/pages/About';
import Admin from '@/pages/Admin';
import GiftBuilder from '@/pages/GiftBuilder';
import Orders from '@/pages/Orders';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OAuthCallback from '@/pages/OAuthCallback';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import Shipping from '@/pages/Shipping';

const MainRoutes = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <html lang="en" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Arihant Stationery" />
        <meta property="og:description" content="Premium handcrafted stationery and desk accessories." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://arihant-stationery.vercel.app" />
      </Helmet>
      <PageMeta title="Arihant Stationery" description="Arihant — Premium handcrafted stationery and desk accessories. Notebooks, pens, planners, and more." canonical="https://arihant-stationery.vercel.app" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/orders" element={<Orders />} />
          </Route>
          <Route path="/b2b" element={<B2B />} />
          <Route path="/about" element={<About />} />
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="/gift-builder" element={<GiftBuilder />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <HelmetProvider>
          <QueryClientProvider client={queryClientInstance}>
            <AuthProvider>
              <ScrollToTop />
              <CartProvider>
                <MainRoutes />
              </CartProvider>
              <Toaster />
            </AuthProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
