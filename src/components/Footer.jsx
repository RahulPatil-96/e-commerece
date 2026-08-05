import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, Twitter, Facebook, Youtube, Heart, ShieldCheck, Truck, Award } from 'lucide-react';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function Footer() {
  return (
    <footer className="bg-[#161616] text-white mt-28 relative overflow-hidden border-t border-white/10">
      {/* Background Watermark Typography */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none overflow-hidden w-full text-center">
        <span className="font-serif-display text-[15vw] font-black text-white/[0.03] leading-none tracking-tighter uppercase block">
          ARIHANT
        </span>
      </div>

      {/* Trust & Craft Banner */}
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Complimentary Delivery', desc: 'On all orders above ₹999' },
              { icon: Award, title: 'Archival Quality', desc: 'Acid-free 120gsm paper' },
              { icon: ShieldCheck, title: 'Enterprise Ready', desc: 'Custom laser engraving & embossing' },
              { icon: Heart, title: 'Artisanal Craft', desc: 'Handcrafted in Bengaluru' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-soft">
                  <t.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white tracking-wide">{t.title}</p>
                  <p className="text-xs text-white/50">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent via-[#D9B766] to-[#284B3D] flex items-center justify-center shadow-glow">
                <span className="font-serif-display text-xl font-bold text-white">A</span>
              </span>
              <span className="font-serif-display text-3xl font-bold tracking-tight text-white">
                Arihant<span className="text-accent font-sans">.</span>
              </span>
            </div>

            <p className="text-sm text-white/70 leading-relaxed max-w-md font-light">
              Designing luxury stationery, executive desk accoutrements, and custom corporate gift kits for modern visionaries and premier global organizations.
            </p>

            {/* Newsletter Box */}
            <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3 max-w-md backdrop-blur-md">
              <p className="text-xs uppercase font-semibold tracking-widest text-accent">Private Circle</p>
              <h4 className="font-serif-display text-lg font-bold text-white">Subscribe to Private Editions</h4>
              <NewsletterSignup />
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
                { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
                { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
                { icon: Youtube, label: 'YouTube', href: 'https://youtube.com' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-accent hover:text-white hover:border-accent transition-all duration-300 hover:-translate-y-1 shadow-soft"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">Collections</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/shop" className="text-white/70 hover:text-white transition-colors">All Collections</Link></li>
                <li><Link to="/shop?category=Notebooks" className="text-white/70 hover:text-white transition-colors">Executive Notebooks</Link></li>
                <li><Link to="/shop?category=Pens" className="text-white/70 hover:text-white transition-colors">Fountain Pens</Link></li>
                <li><Link to="/shop?category=Desk" className="text-white/70 hover:text-white transition-colors">Desk Accessories</Link></li>
                <li><Link to="/gift-builder" className="text-white/70 hover:text-white transition-colors">Custom Gift Boxes</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">Corporate</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/b2b" className="text-white/70 hover:text-white transition-colors">B2B Wholesale</Link></li>
                <li><Link to="/b2b#inquiry" className="text-white/70 hover:text-white transition-colors">Bulk Quotes</Link></li>
                <li><Link to="/about" className="text-white/70 hover:text-white transition-colors">Brand Story</Link></li>
                <li><Link to="/about" className="text-white/70 hover:text-white transition-colors">Sustainability</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-5">Client Care</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/shipping" className="text-white/70 hover:text-white transition-colors">Shipping & Returns</Link></li>
                <li><Link to="/privacy-policy" className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-white/70 hover:text-white transition-colors">Terms of Service</Link></li>
                <li className="pt-2 text-xs text-white/50 space-y-1">
                  <div className="flex items-center gap-2 text-white/80"><Mail className="w-3.5 h-3.5 text-accent" /> hello@arihant.co</div>
                  <div className="flex items-center gap-2 text-white/80"><Phone className="w-3.5 h-3.5 text-accent" /> +91 98765 43210</div>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Arihant Luxury Stationery Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for Excellence with <Heart className="w-3.5 h-3.5 text-accent fill-accent" /> in Bengaluru
          </p>
        </div>
      </div>
    </footer>
  );
}
