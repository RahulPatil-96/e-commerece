import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import GDPRBanner from './GDPRBanner';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {!isHome && <Breadcrumbs />}
        </div>
        <Outlet />
      </main>
      <Footer />
      <GDPRBanner />
    </div>
  );
}
