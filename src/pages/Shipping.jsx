import { Link } from 'react-router-dom';
import PageMeta from '@/components/PageMeta';
import { Truck, PackageCheck, Timer, MapPin, RotateCcw } from 'lucide-react';

const SHIPPING_METHODS = [
  { title: 'Standard Shipping', time: '3–6 business days', cost: 'Free over ₹999 · ₹49 below', icon: Truck },
  { title: 'Express Shipping', time: '1–3 business days', cost: '₹99 flat', icon: Timer },
  { title: 'Same-Day Delivery', time: 'Same day (metro cities)', cost: '₹199 · order before 2 PM', icon: PackageCheck },
];

const FAQs = [
  {
    q: 'When will my order ship?',
    a: 'Most orders are dispatched within 24–48 hours of confirmation. Personalised and customised items may take 3–5 business days for production before shipping.',
  },
  {
    q: 'How can I track my order?',
    a: 'Once your order ships, we send a tracking number via email and SMS. You can also view live tracking under the "My Orders" section of your account.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Currently we ship across India. International shipping is available for select wholesale (B2B) orders — contact our team for a quote.',
  },
  {
    q: 'What if my package arrives damaged?',
    a: 'Please photograph the damaged packaging and items, and contact us within 48 hours of delivery. We will arrange a free replacement or refund.',
  },
];

export default function Shipping() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <PageMeta title="Shipping & Delivery" description="Shipping rates, delivery timelines, and tracking information for Arihant Stationery orders." />

      <div className="mb-10 pb-6 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Truck className="w-6 h-6 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Support</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-medium mb-3">Shipping & Delivery</h1>
        <p className="text-muted-foreground">Fast, reliable, plastic-free delivery across India.</p>
      </div>

      {/* Shipping methods */}
      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {SHIPPING_METHODS.map((method) => (
          <div key={method.title} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            <method.icon className="w-7 h-7 text-accent mb-3" />
            <h3 className="font-display text-lg font-medium mb-1">{method.title}</h3>
            <p className="text-sm font-medium text-accent mb-1">{method.time}</p>
            <p className="text-sm text-muted-foreground">{method.cost}</p>
          </div>
        ))}
      </div>

      {/* Coverage */}
      <div className="bg-secondary/30 border border-border rounded-xl p-6 mb-12 flex items-start gap-4">
        <MapPin className="w-6 h-6 text-accent shrink-0 mt-0.5" />
        <div>
          <h2 className="font-display text-lg font-medium mb-1">Pan-India Coverage</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We deliver to 19,000+ pincodes across all 28 states and 8 union territories via trusted courier partners.
            Metro cities enjoy faster 1–2 day delivery windows. Remote and North-East regions may take 5–8 business days.
          </p>
        </div>
      </div>

      {/* FAQs */}
      <h2 className="font-display text-2xl font-medium mb-5">Frequently Asked Questions</h2>
      <div className="space-y-4 mb-12">
        {FAQs.map((faq) => (
          <div key={faq.q} className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-1.5">{faq.q}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* Returns */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 flex items-start gap-4">
        <RotateCcw className="w-6 h-6 text-accent shrink-0 mt-0.5" />
        <div>
          <h2 className="font-display text-lg font-medium mb-1">Easy Returns</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Changed your mind? Return eligible items within 30 days of delivery in original condition.
            Personalised items are non-returnable unless defective. See our{' '}
            <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link> for details.
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-accent transition-colors">
          Start Shopping
        </Link>
        <Link to="/orders" className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm font-medium hover:bg-secondary transition-colors">
          Track My Order
        </Link>
      </div>
    </div>
  );
}

