import { lazy, Suspense } from 'react';
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

const Home = lazy(() => import('@/pages/Home'));
const Shop = lazy(() => import('@/pages/Shop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Cart = lazy(() => import('@/pages/Cart'));
const B2B = lazy(() => import('@/pages/B2B'));
const About = lazy(() => import('@/pages/About'));
const Admin = lazy(() => import('@/pages/Admin'));
const GiftBuilder = lazy(() => import('@/pages/GiftBuilder'));
const Orders = lazy(() => import('@/pages/Orders'));
const Profile = lazy(() => import('@/pages/Profile'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const OAuthCallback = lazy(() => import('@/pages/OAuthCallback'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const Shipping = lazy(() => import('@/pages/Shipping'));

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
        <meta property="og:title" content="Swipe Stationery" />
        <meta property="og:description" content="Premium handcrafted stationery and desk accessories." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://swipeandcovercel.app" />
      </Helmet>
      <PageMeta title="Swipe Stationery" description="Swipe — Premium handcrafted stationery and desk accessories. Notebooks, pens, planners, and more." canonical="https://swipeandcovercel.app" />
      <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route element={<ErrorBoundary><Layout /></ErrorBoundary>}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
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
      </Suspense>
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
