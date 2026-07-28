import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import ProductCard from '@/components/ProductCard';
import GiftFinderCTA from '@/components/GiftFinderCTA';
import Reveal from '@/components/Reveal';
import PageMeta from '@/components/PageMeta';
import { Image } from '@/components/ui/image';

export default function Home() {
  const [products, setProducts] = useState(/** @type {any[]} */([]));
  const [newArrivals, setNewArrivals] = useState(/** @type {any[]} */([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.Product.list('-created_date', 50)
      .then(data => {
        const featured = (data || []).filter(/** @param {any} p */ (p) => p.featured);
        setProducts(featured.length >= 4 ? featured : (data || []).slice(0, 8));
        setNewArrivals((data || []).slice(0, 4));
      })
      .catch(() => {
        setProducts([]);
        setNewArrivals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const [collections, setCollections] = useState(/** @type {any[]} */([]));
  const [marqueeItems, setMarqueeItems] = useState(/** @type {any[]} */([]));
  const [stats, setStats] = useState(/** @type {any[]} */([]));
  const [testimonials, setTestimonials] = useState(/** @type {any[]} */([]));
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.SiteContent.getAll()
      .then(data => {
        if (data.home_collections) setCollections(data.home_collections);
        if (data.home_marquee_items) setMarqueeItems(data.home_marquee_items);
        if (data.home_stats) setStats(data.home_stats);
        if (data.home_testimonials) setTestimonials(data.home_testimonials);
      })
      .catch(() => {
        // Fallbacks are empty arrays — component handles empty state gracefully
      })
      .finally(() => setContentLoading(false));
  }, []);

  return (
    <div className="overflow-hidden">
      <PageMeta title="Home" description="Discover premium stationery, personalized gifting, and thoughtful desk essentials from Arihant." />
      {/* Full-screen Hero */}
      <section className="relative h-[92vh] min-h-[600px] overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1517842645767-c639042777db?w=1600&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" fittingType="fill" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 text-white">
          <span className="text-xs uppercase tracking-[0.3em] text-white/70 mb-6 animate-fade-up">Stationery · Personalized Gifting · Wholesale</span>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-light leading-[0.95] tracking-tight text-balance max-w-5xl animate-fade-up">
            Paper that<br />feels like <span className="italic text-accent">home.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-xl mt-7 font-light animate-fade-up">
            Thoughtfully designed notebooks, pens, and desk essentials — crafted for writers, creators, and businesses alike.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-9 animate-fade-up">
            <Link to="/shop" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-300 group">
              Shop Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/gift-builder" className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-white/10 transition-all duration-300">
              <Wand2 className="w-4 h-4" /> Build a Gift Box
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/50">Scroll</span>
          <div className="w-px h-12 bg-white/30" />
        </div>
      </section>

      {/* Marquee */}
      <section className="bg-primary text-primary-foreground py-4 overflow-hidden">
        <div className="flex animate-marquee gap-12 whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 shrink-0">
              <item.icon className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium tracking-wide">{item.text}</span>
              <span className="text-accent/40 ml-6">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <p className="font-display text-4xl md:text-5xl font-light text-accent">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bento Collections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <Reveal className="text-center max-w-xl mx-auto mb-14">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Browse</span>
          <h2 className="font-display text-4xl md:text-6xl font-light mt-3 tracking-tight">Shop by Collection</h2>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] md:auto-rows-[260px] gap-4 md:gap-5">
          {collections.map((c, i) => (
            <Reveal key={i} delay={i * 80} className={c.span || ''}>
              <Link to={c.path} className="group relative h-full block rounded-2xl overflow-hidden bg-secondary">
                <Image src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" fittingType="fill" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                  <h3 className="font-display text-lg md:text-2xl font-medium">{c.name}</h3>
                  <p className="text-xs text-white/80 mt-0.5 hidden md:block">{c.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs mt-2 text-accent font-medium">
                    Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-card/50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex items-end justify-between mb-14">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Loved by many</span>
              <h2 className="font-display text-4xl md:text-5xl font-light mt-3 tracking-tight">Bestsellers</h2>
            </div>
            <Link to="/shop" className="hidden sm:inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors group">
              View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary animate-pulse rounded-sm" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.slice(0, 4).map((p, i) => <Reveal key={p.id} delay={i * 80}><ProductCard product={p} /></Reveal>)}
            </div>
          )}
        </div>
      </section>

      {/* Full-bleed craftsmanship parallax */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden flex items-center justify-center">
        <Image src="https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1600&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" fittingType="fill" />
        <div className="absolute inset-0 bg-black/50" />
        <Reveal className="relative z-10 text-center px-4 text-white max-w-2xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Craftsmanship</span>
          <h2 className="font-display text-4xl md:text-6xl font-light leading-tight tracking-tight mt-4 text-balance">
            Every detail,<br />considered.
          </h2>
          <p className="text-white/80 mt-5 font-light text-lg">
            From the weight of the paper to the flow of the ink — we obsess over the details so your ideas feel at home.
          </p>
        </Reveal>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <Reveal className="flex items-end justify-between mb-14">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Fresh off the press</span>
            <h2 className="font-display text-4xl md:text-5xl font-light mt-3 tracking-tight">New Arrivals</h2>
          </div>
          <Link to="/shop" className="hidden sm:inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors group">
            View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary animate-pulse rounded-sm" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((p, i) => <Reveal key={p.id} delay={i * 80}><ProductCard product={p} /></Reveal>)}
          </div>
        )}
      </section>

      {/* Gift Finder */}
      <GiftFinderCTA />

      {/* B2B callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
        <Reveal className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-10 md:p-16 space-y-5">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">For Businesses</span>
              <h2 className="font-display text-4xl md:text-5xl font-light leading-tight tracking-tight">
                Bulk orders,<br />better pricing.
              </h2>
              <p className="text-primary-foreground/70 leading-relaxed max-w-md font-light">
                Outfit your entire team with branded stationery. Enjoy wholesale pricing, custom branding, and dedicated account support — whether you need 50 notebooks or 5,000.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/b2b" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent/90 transition-colors group">
                  Shop Wholesale <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/b2b" className="inline-flex items-center gap-2 border border-primary-foreground/30 px-7 py-3.5 rounded-full text-sm font-medium hover:bg-primary-foreground/10 transition-colors">
                  Request a Quote
                </Link>
              </div>
          </div>
            <div className="aspect-[4/3] md:aspect-auto md:h-full min-h-[300px]">
              <Image src="https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&q=80" alt="Wholesale stationery" className="w-full h-full object-cover" fittingType="fill" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Brand story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-secondary">
              <Image src="https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=700&q=80" alt="Craft" className="w-full h-full object-cover" fittingType="fill" />
            </div>
          </Reveal>
          <Reveal delay={150} className="space-y-5">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Our Story</span>
            <h2 className="font-display text-4xl md:text-5xl font-light leading-tight tracking-tight">
              Made by people<br />who love paper.
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Arihant began in a small Bengaluru studio with a simple belief: the tools we write with should inspire us. Every notebook is bound by hand, every pen tested for flow, every paper sourced responsibly.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              From students to startups, we serve thousands of customers across India — with the same care we started with.
            </p>
            <Link to="/about" className="inline-flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors group">
              Read our story <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-card/50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Reviews</span>
            <h2 className="font-display text-4xl md:text-5xl font-light mt-3 tracking-tight">What people say</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-background border border-border rounded-2xl p-7 space-y-4 h-full">
                  <div className="flex gap-0.5 text-accent">
                    {[...Array(5)].map((_, j) => <Sparkles key={j} className="w-4 h-4 fill-accent" />)}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">"{t.text}"</p>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Reveal className="text-center max-w-lg mx-auto space-y-4">
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-tight">Stay in the loop</h2>
          <p className="text-muted-foreground font-light">New collections, restocks, and exclusive offers — delivered monthly.</p>
          <form className="flex gap-2 max-w-sm mx-auto pt-2" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-3 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-accent transition-colors">Subscribe</button>
          </form>
        </Reveal>
      </section>
    </div>
  );
}
