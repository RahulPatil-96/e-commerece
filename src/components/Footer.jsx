import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin, Twitter, Facebook, Youtube, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      {/* Newsletter section */}
      {/* <div className="border-b border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-medium">
                Join the Arihant<span className="text-accent">.</span> club
              </h3>
              <p className="text-primary-foreground/70 mt-2 text-sm md:text-base font-light max-w-md">
                Get 10% off your first order plus early access to new collections, restocks, and members-only offers.
              </p>
            </div>
            <div className="lg:justify-self-end w-full lg:max-w-md">
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </div> */}

      {/* Trust strip */}
      {/* <div className="border-b border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Truck, title: 'Free shipping', desc: 'On orders ₹999+' },
              { icon: RotateCcw, title: '30-day returns', desc: 'No questions asked' },
              { icon: ShieldCheck, title: 'Secure payments', desc: 'UPI · Cards · COD' },
              { icon: Heart, title: 'Handcrafted', desc: 'Made with care in India' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <t.icon className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-primary-foreground/60">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-[hsl(27_87%_60%)] flex items-center justify-center">
                <span className="font-display text-lg font-bold text-white">A</span>
              </span>
              <span className="font-display text-3xl font-medium">Arihant<span className="text-accent">.</span></span>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              Thoughtfully crafted stationery for everyday thinkers, writers, and businesses.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Facebook, label: 'Facebook' },
                { icon: Youtube, label: 'YouTube' },
              ].map(s => (
                <a
                  key={s.label}
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:-translate-y-0.5"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shop" className="text-primary-foreground/80 hover:text-accent transition-colors">All Products</Link></li>
              <li><Link to="/shop?category=Notebooks" className="text-primary-foreground/80 hover:text-accent transition-colors">Notebooks</Link></li>
              <li><Link to="/shop?category=Pens" className="text-primary-foreground/80 hover:text-accent transition-colors">Pens & Pencils</Link></li>
              <li><Link to="/shop?category=Desk" className="text-primary-foreground/80 hover:text-accent transition-colors">Desk Accessories</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-primary-foreground/80 hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/b2b" className="text-primary-foreground/80 hover:text-accent transition-colors">Wholesale / B2B</Link></li>
              <li><Link to="/about" className="text-primary-foreground/80 hover:text-accent transition-colors">Sustainability</Link></li>
              <li><a href="mailto:hello@arihant.co" className="text-primary-foreground/80 hover:text-accent transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/shipping" className="text-primary-foreground/80 hover:text-accent transition-colors">Shipping</Link></li>
              <li><Link to="/privacy-policy" className="text-primary-foreground/80 hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-primary-foreground/80 hover:text-accent transition-colors">Terms of Service</Link></li>
              {/* <li><Link to="/gift-builder" className="text-primary-foreground/80 hover:text-accent transition-colors">Gift Builder</Link></li> */}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50 mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Mail className="w-4 h-4 shrink-0" /> hello@arihant.co
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/80">
                <Phone className="w-4 h-4 shrink-0" /> +91 98765 43210
              </li>
              <li className="flex items-start gap-2 text-primary-foreground/80">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> Indiranagar, Bengaluru, India
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t border-primary-foreground/15 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} Arihant & Co. All rights reserved.</p>
          <p className="text-xs text-primary-foreground/50">Crafted with <Heart className="w-3 h-3 inline text-accent fill-accent" /> in Bengaluru</p>
        </div>
      </div>
    </footer>
  );
}

