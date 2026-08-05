import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import GDPRBanner from './GDPRBanner';
import SmoothScroll from './SmoothScroll';
import CustomCursor from './CustomCursor';
import PageTransition from './PageTransition';
import ScrollProgress from './ScrollProgress';
import AmbientBackground from './AmbientBackground';
import CorporateQuoteWidget from './CorporateQuoteWidget';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <SmoothScroll>
      <ScrollProgress />
      <CustomCursor />
      <AmbientBackground>
        <div className="min-h-screen flex flex-col text-foreground selection:bg-accent/20">
          <Navbar />
          <main className="flex-1">
            {!isHome && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <Breadcrumbs />
              </div>
            )}
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </main>
          <Footer />
          <GDPRBanner />
          <CorporateQuoteWidget />
        </div>
      </AmbientBackground>
    </SmoothScroll>
  );
}
