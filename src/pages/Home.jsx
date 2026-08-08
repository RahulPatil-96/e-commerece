import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Wand2, Truck, ShieldCheck, Recycle, Pen, Cpu, Star } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import PageMeta from '@/components/PageMeta';
import { Image } from '@/components/ui/image';
import AnimatedCount from '@/components/AnimatedCount';
import EnterpriseTrust from '@/components/EnterpriseTrust';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const MARQUEE_ICON_MAP = /** @type {Record<string, React.ElementType>} */ ({ Truck, ShieldCheck, Recycle, Sparkles, Pen });

export default function Home() {
  const [products, setProducts] = useState(/** @type {any[]} */([]));
  const [newArrivals, setNewArrivals] = useState(/** @type {any[]} */([]));
  const [loading, setLoading] = useState(true);

  // Active step for AI preview interactive workflow
  const [activeStep, setActiveStep] = useState(0);

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
        if (data.home_marquee_items) {
          setMarqueeItems(data.home_marquee_items.map((/** @type {{ icon?: string, text?: string }} */ item) => ({
            ...item,
            icon: MARQUEE_ICON_MAP[item.icon || ''] || Sparkles,
          })));
        }
        if (data.home_stats) setStats(data.home_stats);
        if (data.home_testimonials) setTestimonials(data.home_testimonials);
      })
      .catch(() => {
        // Fallbacks handled gracefully
      })
      .finally(() => setContentLoading(false));
  }, []);

  const workflowSteps = [
    { title: 'Upload Logo', desc: 'Vector SVG or high-res PNG for precision laser etching or blind foil embossing.' },
    { title: 'AI Preview', desc: 'Instant 3D digital mockup rendering textures, metallic foils, and edge gilding.' },
    { title: 'Customize', desc: 'Select paper weight (120gsm - 160gsm), leather finishes, ribbon colors, and custom inserts.' },
    { title: 'Approve', desc: 'Review high-fidelity digital proof or request a physical sample box.' },
    { title: 'Bulk Order', desc: 'Automated volume discounts, custom GST invoices, and split-location delivery.' },
    { title: 'Production & Delivery', desc: 'Precision hand binding, white-glove quality control, and express fulfillment.' }
  ];

  const faqItems = [
    {
      q: 'What is the minimum order quantity (MOQ) for corporate branding?',
      a: 'Our standard MOQ for custom foil stamping and logo debossing starts at just 25 units. For custom gift box sets, MOQs begin at 10 boxes.'
    },
    {
      q: 'Can we send custom welcome kits directly to remote employee addresses?',
      a: 'Yes! We offer nationwide multi-location fulfillment. Upload your shipping roster and we handle individual packaging, personalized gift cards, and tracking.'
    },
    {
      q: 'What customization methods are available?',
      a: 'We offer Blind Debossing, Foil Stamping (Gold, Silver, Rose Gold, Matte White/Black), Precision Laser Engraving, UV Full-Color Printing, and Custom Belly Bands.'
    },
    {
      q: 'How fast can bulk orders be delivered?',
      a: 'In-stock branded stationery can be dispatched within 48 to 72 hours. Custom manufactured gift box collections typically take 5-7 business days.'
    }
  ];

  return (
    <div className="overflow-hidden bg-background text-foreground">
      <PageMeta title="Arihant Luxury Stationery & AI Corporate Gifting" description="World-class AI-powered corporate gifting, executive notebooks, and custom stationery for modern enterprises." />

      {/* 1. ULTRA HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-8 pb-16 px-4 overflow-hidden">
        {/* Ambient Glow & Grid Backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-7">
          {/* Overline pill */}
          <Reveal>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-accent bg-accent-soft border border-accent/20 px-5 py-2 rounded-full shadow-soft backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> Premium Stationery · Designed For Brands
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={100}>
            <h1 className="font-serif-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-foreground leading-[0.95] text-balance">
              Stationery.<br />
              <span className="text-gradient-gold italic">Elevated </span> for Brands.
            </h1>
          </Reveal>

          {/* Subheading */}
          <Reveal delay={200}>
            <p className="text-lg md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed text-balance">
              Corporate gifting. Employee welcome kits. AI-powered custom stationery crafted with archival precision.
            </p>
          </Reveal>

          {/* Action Buttons */}
          <Reveal delay={300}>
            <div className="flex flex-wrap gap-4 justify-center items-center pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-9 py-4 rounded-full text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-500 shadow-lift hover:scale-105 active:scale-95 group"
                data-cursor-text="Explore"
              >
                Explore Collection <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/gift-builder"
                className="inline-flex items-center gap-3 border border-border/80 bg-card/80 backdrop-blur-md text-foreground px-9 py-4 rounded-full text-sm font-semibold hover:bg-secondary hover:border-accent transition-all duration-300 shadow-soft"
                data-cursor-text="Build"
              >
                <Wand2 className="w-4 h-4 text-accent" /> Build Your Kit
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Floating Metrics Bar */}
        <Reveal delay={400} className="w-full max-w-5xl mx-auto mt-16 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-3xl glass border border-border/70 shadow-lift">
            {[
              { value: '10,000+', label: 'Global Brands' },
              { value: '500+', label: 'Artisanal Products' },
              { value: '48hr', label: 'Express Dispatch' },
              { value: '4.9★', label: 'Client Satisfaction' },
            ].map((metric, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-background/60 border border-border/40">
                <p className="font-serif-display text-2xl sm:text-3xl font-bold text-accent">
                  <AnimatedCount value={metric.value} />
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Scroll Indicator */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">Scroll to explore</span>
          <div className="w-5 h-9 rounded-full border-2 border-border/80 flex items-start justify-center p-1">
            <div className="w-1.5 h-2.5 bg-accent rounded-full animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* 2. INFINITE LOGO MARQUEE */}
      <section className="bg-primary text-primary-foreground py-6 overflow-hidden border-y border-white/10">
        <div className="flex animate-marquee gap-14 whitespace-nowrap items-center">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} className="flex items-center gap-3 shrink-0 opacity-85 hover:opacity-100 transition-opacity">
              <item.icon className="w-4 h-4 text-accent" />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest">{item.text}</span>
              <span className="text-accent/50 ml-6">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED COLLECTIONS (Bento Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <Reveal className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block">
            Curated Catalog
          </span>
          <h2 className="font-serif-display text-4xl sm:text-6xl font-bold tracking-tight">Shop by Collection</h2>
          <p className="text-muted-foreground font-light text-base sm:text-lg">Designed for executive desks, enterprise onboarding, and high-impact gifting.</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-[240px] md:auto-rows-[280px] gap-5">
          {collections.map((c, i) => (
            <Reveal key={i} delay={i * 80} className={c.span || ''}>
              <Link
                to={c.path}
                className="group relative h-full block rounded-3xl overflow-hidden bg-secondary border border-border/60 shadow-soft hover:shadow-lift transition-all duration-700"
                data-cursor-text="Explore"
              >
                <Image
                  src={c.img}
                  alt={c.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  fittingType="fill"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">Collection</span>
                  <h3 className="font-serif-display text-2xl font-bold tracking-tight group-hover:text-accent transition-colors">{c.name}</h3>
                  <p className="text-xs text-white/70 line-clamp-2 font-light">{c.desc}</p>
                  <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">
                    Explore Now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 4. INTERACTIVE AI CUSTOMIZATION & WORKFLOW */}
      <section className="bg-secondary/60 py-24 md:py-32 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-6">
              <Reveal>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block">
                  AI-Powered Workflow
                </span>
              </Reveal>
              <Reveal delay={100}>
                <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                  Real-time AI Customization Engine
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-muted-foreground font-light text-base leading-relaxed">
                  Transform your brand collateral in seconds. Upload your vector logo and watch our 3D engine render foil debossing, edge painting, and leather textures in real-time.
                </p>
              </Reveal>

              {/* Interactive Steps List */}
              <div className="space-y-3 pt-2">
                {workflowSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                      activeStep === idx
                        ? 'bg-card border-accent shadow-soft'
                        : 'bg-background/50 border-border/60 hover:bg-card'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeStep === idx ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-serif-display text-base font-bold text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-light">{step.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Interactive Mockup Canvas */}
            <div className="lg:col-span-7">
              <Reveal delay={200}>
                <div className="bg-card border border-border/80 rounded-3xl p-8 shadow-lift relative overflow-hidden space-y-6">
                  <div className="flex items-center justify-between border-b border-border/60 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="w-3 h-3 rounded-full bg-yellow-400" />
                      <span className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live AI Preview Studio</span>
                  </div>

                  {/* Dynamic Studio Display */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center p-8 text-center text-white">
                    <Image
                      src="https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80"
                      alt="AI Customizer"
                      className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                      fittingType="fill"
                    />
                    <div className="relative z-10 space-y-4 max-w-sm">
                      <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/40 mx-auto flex items-center justify-center backdrop-blur-md shadow-glow">
                        <Cpu className="w-8 h-8 text-accent animate-pulse" />
                      </div>
                      <h4 className="font-serif-display text-2xl font-bold">{workflowSteps[activeStep].title}</h4>
                      <p className="text-xs text-white/80 font-light leading-relaxed">{workflowSteps[activeStep].desc}</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-accent backdrop-blur-md">
                        <Sparkles className="w-3.5 h-3.5" /> Rendering 4K Photorealistic Mockup
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span>Format: Vector SVG / AI / PNG</span>
                    <span className="text-accent font-semibold">100% Vector Precision</span>
                  </div>
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </section>

      {/* 5. BESTSELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block mb-3">
              Most Requested
            </span>
            <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">Enterprise Bestsellers</h2>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline group">
            View Complete Catalog <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary animate-pulse rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 6. CRAFTSMANSHIP PARALLAX */}
      <section className="relative h-[65vh] min-h-[500px] overflow-hidden flex items-center justify-center text-center">
        <Image
          src="https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1600&q=80"
          alt="Craftsmanship"
          className="absolute inset-0 w-full h-full object-cover"
          fittingType="fill"
        />
        <div className="absolute inset-0 bg-black/65" />
        <Reveal className="relative z-10 max-w-3xl px-4 text-white space-y-6">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-white/10 border border-white/20 px-5 py-2 rounded-full backdrop-blur-md inline-block">
            Archival Heritage
          </span>
          <h2 className="font-serif-display text-4xl sm:text-6xl font-bold tracking-tight text-balance">
            Every Detail, Obsessively Considered.
          </h2>
          <p className="text-lg text-white/80 font-light max-w-xl mx-auto leading-relaxed">
            120gsm fountain-pen friendly Swedish paper, hand-stitched lay-flat binding, and vegetable-tanned Italian leather.
          </p>
        </Reveal>
      </section>

      {/* 7. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block mb-3">
              Fresh Editions
            </span>
            <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">New Arrivals</h2>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline group">
            Explore All New Releases <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary animate-pulse rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 8. CORPORATE PROCESS TIMELINE */}
      <section className="bg-primary text-primary-foreground py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Seamless Execution</span>
            <h2 className="font-serif-display text-4xl sm:text-5xl font-bold">The 6-Step Corporate Process</h2>
            <p className="text-primary-foreground/70 font-light text-base sm:text-lg">From initial brief to nationwide multi-desk delivery.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Requirement Brief', desc: 'Share quantity, product preferences, branding guidelines, and budget parameters.' },
              { step: '02', title: '3D AI Design Mockup', desc: 'Receive digital proofs with foil debossing and material texture renders within 4 hours.' },
              { step: '03', title: 'Physical Prototype Box', desc: 'Review pre-production physical samples before greenlighting bulk manufacturing.' },
              { step: '04', title: 'Approval & Invoice', desc: 'Instant B2B GST tax invoices, credit terms approval, and schedule confirmation.' },
              { step: '05', title: 'Precision Production', desc: 'Artisanal hand-binding, laser engraving, and white-glove quality assurance checks.' },
              { step: '06', title: 'Multi-Desk Fulfillment', desc: 'Direct shipping to office hubs or individual employee home addresses across India.' },
            ].map((p, idx) => (
              <Reveal key={idx} delay={idx * 80}>
                <div className="p-7 rounded-3xl bg-white/5 border border-white/10 hover:border-accent/60 transition-all duration-300 space-y-3 h-full">
                  <span className="font-serif-display text-3xl font-bold text-accent">{p.step}</span>
                  <h3 className="font-serif-display text-xl font-bold text-white">{p.title}</h3>
                  <p className="text-xs text-primary-foreground/70 leading-relaxed font-light">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CUSTOMER STORIES (Editorial Review Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <Reveal className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block">
            Client Feedback
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">Trusted by Industry Leaders</h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {testimonials.map((t, idx) => (
            <Reveal key={idx} delay={idx * 100} className={idx === 1 ? 'md:-translate-y-4' : ''}>
              <div className={`p-8 rounded-3xl border transition-all duration-500 flex flex-col justify-between h-full space-y-6 ${
                idx === 1
                  ? 'bg-card border-accent shadow-lift ring-1 ring-accent/30'
                  : 'bg-secondary/50 border-border/60 shadow-soft'
              }`}>
                <div className="space-y-4">
                  <div className="flex gap-1 text-accent">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-accent" />)}
                  </div>
                  <p className="font-serif-display text-lg text-foreground leading-relaxed italic">"{t.text}"</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center font-bold text-base shadow-soft">
                    {(t.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-serif-display text-base font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground font-light">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 9.5 ENTERPRISE TRUST & CREDIBILITY */}
      <EnterpriseTrust />

      {/* 10. FAQ ACCORDION */}
      <section className="bg-secondary/40 py-24 border-t border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block">
              Frequently Asked
            </span>
            <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">Questions & Answers</h2>
          </Reveal>

          <Reveal delay={150}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="bg-card border border-border/80 rounded-2xl px-6 py-2 shadow-soft">
                  <AccordionTrigger className="font-serif-display text-lg font-bold text-foreground hover:text-accent transition-colors text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed font-light pt-2 pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* 11. CINEMATIC ENDING SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <Reveal>
          <div className="relative rounded-3xl bg-[#161616] text-white p-12 sm:p-24 text-center overflow-hidden shadow-lift border border-white/10">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/25 blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#284B3D]/30 blur-[140px] pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent bg-white/10 border border-white/20 px-5 py-2 rounded-full backdrop-blur-md inline-block">
                The Heritage Collection
              </span>
              <h2 className="font-serif-display text-4xl sm:text-7xl font-bold tracking-tight leading-none text-balance">
                Every Brand Tells A Story.<br />
                <span className="text-gradient-gold italic">Let Yours Begin Here.</span>
              </h2>
              <p className="text-white/80 font-light text-base sm:text-xl max-w-xl mx-auto leading-relaxed">
                Join visionaries, global unicorns, and premier corporate teams who entrust their desk culture to Arihant.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-6">
                <Link
                  to="/b2b"
                  className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-9 py-4 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent/90 transition-all shadow-glow hover:scale-105 active:scale-95"
                  data-cursor-text="Start"
                >
                  Start Your Project <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-3 border border-white/30 text-white px-9 py-4 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
