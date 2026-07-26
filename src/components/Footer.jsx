import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <span className="font-display text-3xl font-medium">Lekha<span className="text-accent">.</span></span>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed">
              Thoughtfully crafted stationery for everyday thinkers, writers, and businesses.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shop" className="text-primary-foreground/80 hover:text-accent transition-colors">All Products</Link></li>
              <li><Link to="/shop?category=Notebooks" className="text-primary-foreground/80 hover:text-accent transition-colors">Notebooks</Link></li>
              <li><Link to="/shop?category=Pens" className="text-primary-foreground/80 hover:text-accent transition-colors">Pens & Pencils</Link></li>
              <li><Link to="/shop?category=Desk" className="text-primary-foreground/80 hover:text-accent transition-colors">Desk Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-primary-foreground/80 hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/b2b" className="text-primary-foreground/80 hover:text-accent transition-colors">Wholesale / B2B</Link></li>
              <li><Link to="/about" className="text-primary-foreground/80 hover:text-accent transition-colors">Sustainability</Link></li>
              <li><Link to="/admin" className="text-primary-foreground/80 hover:text-accent transition-colors">Admin Dashboard</Link></li>
              <li><a href="mailto:hello@lekha.co" className="text-primary-foreground/80 hover:text-accent transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Mail className="w-4 h-4 shrink-0" /> hello@lekha.co
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Phone className="w-4 h-4 shrink-0" /> +91 98765 43210
              </li>
              <li className="flex items-start gap-2 text-primary-foreground/80">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> Indiranagar, Bengaluru, India
              </li>
              <li className="flex items-center gap-3 pt-2">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-primary-foreground/15 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} Lekha & Co. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-primary-foreground/50">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-accent transition-colors">Shipping</a>
          </div>
        </div>
      </div>
    </footer>
  );
}