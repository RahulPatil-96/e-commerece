import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, Tags, Headphones, Truck, ArrowRight, ShoppingBag, Building2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import PageMeta from '@/components/PageMeta';
import Reveal from '@/components/Reveal';

export default function B2B() {
  const { toast } = useToast();
  const { setMode } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [benefits, setBenefits] = useState(/** @type {Array<{icon: React.ElementType, title: string, desc: string}>} */([]));
  const [tiers, setTiers] = useState(/** @type {Array<{qty: string, discount: string, desc: string}>} */([]));
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', gst_number: '', products: '', quantity: '', message: ''
  });

  useEffect(() => {
    apiClient.entities.SiteContent.getAll()
      .then(data => {
        if (Array.isArray(data.b2b_benefits)) {
          const ICON_MAP = /** @type {Record<string, React.ElementType>} */({ Package, Tags, Headphones, Truck, CheckCircle2 });
          setBenefits(data.b2b_benefits.map((b) => ({
            ...b,
            icon: ICON_MAP[b.icon] || Package,
          })));
        }
        if (Array.isArray(data.b2b_tiers)) setTiers(data.b2b_tiers);
      })
      .catch(() => {
        // Fallback handled gracefully
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (/** @type {React.FormEvent<HTMLFormElement>} */ e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.entities.B2BInquiry.create({ ...form, status: 'new' });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <PageMeta title="Inquiry Sent" description="Thank you for contacting Arihant B2B Team." />
        <div className="w-20 h-20 rounded-full bg-accent-soft border border-accent/40 flex items-center justify-center mx-auto shadow-glow">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>
        <h1 className="font-serif-display text-4xl font-bold tracking-tight">Wholesale Inquiry Received</h1>
        <p className="text-muted-foreground font-light text-base leading-relaxed max-w-md mx-auto">
          Thank you for reaching out to Arihant Enterprise Division. Our dedicated account executive will review your specifications and contact you within 1 business day.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-xs font-semibold hover:bg-accent transition-colors shadow-lift"
        >
          Explore Catalog <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="Enterprise & Wholesale B2B Stationery" description="Bulk corporate gifting, custom logo foil debossing, and volume pricing from Arihant." />

      {/* Luxury Dark B2B Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground py-24 md:py-32">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Reveal>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-white/10 border border-white/20 px-4 py-1.5 rounded-full inline-block backdrop-blur-md">
                  <Building2 className="w-3.5 h-3.5 inline mr-1" /> Arihant Enterprise Division
                </span>
              </Reveal>
              <Reveal delay={100}>
                <h1 className="font-serif-display text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
                  Custom Branding.<br />
                  <span className="text-gradient-gold italic">Wholesale Scale.</span>
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-primary-foreground/80 font-light text-base sm:text-lg leading-relaxed max-w-lg">
                  Outfit your global workforce with bespoke leather notebooks, archival fountain pens, and executive gift boxes — complete with blind debossing and GST invoices.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => { setMode('wholesale'); navigate('/shop'); }}
                    className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent/90 transition-all shadow-glow hover:scale-105 active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" /> Shop Wholesale Mode
                  </button>
                  <a
                    href="#inquiry"
                    className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-all"
                  >
                    Request Custom Quote <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal delay={200}>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-lift relative">
                <Image
                  src="https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&q=80"
                  alt="Wholesale"
                  className="w-full h-full object-cover"
                  fittingType="fill"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white">
                  <p className="text-xs font-bold text-accent">Archival Quality & Handcrafting</p>
                  <p className="text-[11px] text-white/80 font-light">Custom foil stamping & laser engraving for 50 to 50,000+ units.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* B2B Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <Reveal className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block">
            Enterprise Advantage
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">Built for Enterprise Operations</h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="bg-card border border-border/80 rounded-3xl p-7 space-y-4 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                  {(() => { const Icon = b.icon; return <Icon className="w-6 h-6" />; })()}
                </div>
                <h3 className="font-serif-display text-xl font-bold text-foreground">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-light">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Volume Tier Cards */}
      <section className="bg-secondary/40 py-24 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block">
              Transparent Pricing
            </span>
            <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">Volume Discount Tiers</h2>
            <p className="text-muted-foreground font-light text-sm">Automated tiered pricing discounts applied at checkout.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`rounded-3xl p-8 text-center transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between ${
                  i === 2
                    ? 'bg-primary text-primary-foreground shadow-lift scale-105 border border-white/20'
                    : 'bg-card border border-border/80 shadow-soft hover:shadow-card'
                }`}>
                  {i === 2 && (
                    <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-3 py-1 rounded-full shadow-glow">
                      Most Popular
                    </span>
                  )}
                  <div className="space-y-2">
                    <p className={`text-xs uppercase tracking-widest font-bold ${i === 2 ? 'text-accent' : 'text-muted-foreground'}`}>{t.qty} Units</p>
                    <p className="font-serif-display text-5xl font-bold my-2">{t.discount}<span className="text-2xl font-serif">%</span></p>
                    <p className={`text-xs font-light ${i === 2 ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{t.desc}</p>
                  </div>
                  <div className="pt-6">
                    <button
                      onClick={() => { setMode('wholesale'); navigate('/shop'); }}
                      className={`w-full py-3 rounded-full text-xs font-semibold transition-all ${
                        i === 2
                          ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow'
                          : 'bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      Shop Tier Rate
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <Reveal className="text-center max-w-xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block">
            Custom Quotation
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight">Request a Wholesale Quote</h2>
          <p className="text-muted-foreground font-light text-sm">Our B2B team will deliver a custom proposal and digital proof within 24 hours.</p>
        </Reveal>

        <Reveal delay={150}>
          <form onSubmit={handleSubmit} className="bg-card border border-border/80 rounded-3xl p-8 sm:p-10 space-y-5 shadow-lift">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Company Name *</label>
                <input
                  required
                  value={form.company_name}
                  onChange={e => setForm({ ...form, company_name: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Contact Person *</label>
                <input
                  required
                  value={form.contact_name}
                  onChange={e => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="Priya Sharma"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Work Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="priya@acme.com"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number *</label>
                <input
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">GST Identification Number (Optional)</label>
              <input
                value={form.gst_number}
                onChange={e => setForm({ ...form, gst_number: e.target.value })}
                placeholder="29AAAAA0000A1Z5"
                className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Products of Interest</label>
                <input
                  value={form.products}
                  onChange={e => setForm({ ...form, products: e.target.value })}
                  placeholder="e.g. Leather Notebooks, Fountain Pens"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Estimated Quantity</label>
                <input
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  placeholder="e.g. 250 Gift Sets"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Branding & Additional Specifications</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Specify foil colors (Gold/Silver), delivery timelines, and multi-location logistics details..."
                className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-lift disabled:opacity-50"
            >
              {submitting ? 'Submitting Quotation Request...' : 'Submit Custom B2B Quotation'}
            </button>
          </form>
        </Reveal>
      </section>
    </div>
  );
}