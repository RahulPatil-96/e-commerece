import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, Tags, Headphones, Truck, ArrowRight, ShoppingBag } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import PageMeta from '@/components/PageMeta';

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
          setBenefits(data.b2b_benefits.map((/** @type {{icon: string, title: string, desc: string}} */ b) => ({
            ...b,
            icon: ICON_MAP[b.icon] || Package,
          })));
        }
        if (Array.isArray(data.b2b_tiers)) setTiers(data.b2b_tiers);
      })
      .catch(() => {
        // Empty state handled gracefully
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
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-6" />
        <h1 className="font-display text-3xl font-medium mb-3">Inquiry received!</h1>
        <p className="text-muted-foreground mb-8">Thank you for your interest in Arihant wholesale. Our B2B team will review your requirements and get back within 1 business day.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors">
          Browse Products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title="B2B" description="Request bulk stationery quotes for your business and discover wholesale pricing from Arihant." />
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="text-xs font-medium uppercase tracking-widest text-accent">Arihant for Business</span>
              <h1 className="font-display text-4xl md:text-6xl font-medium leading-[1.1]">
                Stationery at<br />scale, done right.
              </h1>
              <p className="text-primary-foreground/70 leading-relaxed max-w-md">
                From startups to enterprises, we supply premium stationery in bulk — with custom branding, competitive wholesale pricing, and reliable delivery across India.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setMode('wholesale'); navigate('/shop'); }} className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent/90 transition-colors">
                  <ShoppingBag className="w-4 h-4" /> Shop Wholesale
                </button>
                <a href="#inquiry" className="inline-flex items-center gap-2 border border-primary-foreground/30 text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-primary-foreground/10 transition-colors">
                  Request a Quote <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-card">
              <Image src="https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&q=80" alt="Wholesale" className="w-full h-full object-cover" fittingType="fill" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs font-medium uppercase tracking-widest text-accent">Why Arihant B2B</span>
          <h2 className="font-display text-4xl md:text-5xl font-medium mt-3">Built for business</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-card border border-border/70 rounded-2xl p-6 space-y-3 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center">
                {(() => { const Icon = b.icon; return <Icon className="w-5 h-5 text-accent" />; })()}
              </div>
              <h3 className="font-display text-lg font-medium">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="bg-card/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-medium uppercase tracking-widest text-accent">Bulk Discounts</span>
            <h2 className="font-display text-4xl md:text-5xl font-medium mt-3">Volume pricing tiers</h2>
            <p className="text-muted-foreground mt-3">The more you order, the more you save.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((t, i) => (
              <div key={i} className={`rounded-2xl p-6 text-center transition-all duration-300 ${i === 2 ? 'bg-primary text-primary-foreground shadow-card scale-[1.02] relative overflow-hidden' : 'bg-background border border-border/70 shadow-soft hover:shadow-card hover:-translate-y-1'}`}>
                {i === 2 && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/60 to-accent" />}
                <p className={`text-xs uppercase tracking-wider ${i === 2 ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{t.qty} units</p>
                <p className="font-display text-5xl font-medium my-3">{t.discount}<span className="text-2xl">%</span></p>
                <p className={`text-xs ${i === 2 ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{t.desc}</p>
                {i === 2 && <span className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-wider bg-accent text-accent-foreground px-3 py-1 rounded-full">Popular</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section id="inquiry" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center mb-10">
          <span className="text-xs font-medium uppercase tracking-widest text-accent">Get Started</span>
          <h2 className="font-display text-4xl md:text-5xl font-medium mt-3">Request a wholesale quote</h2>
          <p className="text-muted-foreground mt-3">Tell us what you need — we'll send a tailored quote within 1 business day.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-border/70 rounded-3xl p-6 md:p-8 space-y-4 shadow-card">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Company Name *</label>
              <input required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contact Name *</label>
              <input required value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Work Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone *</label>
              <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">GST Number</label>
            <input value={form.gst_number} onChange={e => setForm({...form, gst_number: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Products of Interest</label>
              <input value={form.products} onChange={e => setForm({...form, products: e.target.value})} placeholder="e.g. Notebooks, pens, desk sets" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estimated Quantity</label>
              <input value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="e.g. 500 units" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Additional Details</label>
            <textarea rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Branding requirements, timeline, custom needs..." className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all resize-none" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Submit Inquiry'}
          </button>
        </form>
      </section>
    </div>
  );
}