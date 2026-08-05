import { useState } from 'react';
import { Building2, X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CorporateQuoteWidget() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState('100');
  const [form, setForm] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    productType: 'Executive Notebooks',
  });

  // Calculate quick budget estimate
  const estimatedUnitPrice = qty >= 500 ? 450 : qty >= 100 ? 550 : 650;
  const estimatedTotal = parseInt(qty || '0', 10) * estimatedUnitPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.entities.B2BInquiry.create({
        company_name: form.company,
        contact_name: form.name,
        email: form.email,
        phone: form.phone,
        products: form.productType,
        quantity: `${qty} units`,
        message: `Instant widget quote request. Estimated Total: ₹${estimatedTotal.toLocaleString('en-IN')}`,
        status: 'new',
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setOpen(true)}
          className="group relative flex items-center gap-2.5 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground px-5 py-3.5 rounded-full shadow-lift border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
          data-cursor-text="Quote"
        >
          <Building2 className="w-4 h-4 text-accent group-hover:text-accent-foreground transition-colors" />
          <span className="text-xs font-semibold uppercase tracking-wider">Corporate Quote</span>
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </button>
      </div>

      {/* Expandable Consultation Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-lift overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-primary text-primary-foreground flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-white">Corporate Quote Assistant</h3>
                  <p className="text-xs text-primary-foreground/70 font-light">Instant Wholesale Pricing & Consultation</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto thin-scrollbar">
              {submitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto shadow-glow">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif-display text-2xl font-bold">Quote Request Received!</h4>
                  <p className="text-xs text-muted-foreground font-light max-w-xs mx-auto">
                    Our corporate account director will review your details and send a formal proposal within 4 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setOpen(false); }}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-semibold"
                  >
                    Close Assistant
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Budget Estimator Card */}
                  <div className="p-4 rounded-2xl bg-accent-soft/40 border border-accent/30 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground">Estimated Quantity:</span>
                      <span className="font-bold text-accent">{qty} Units</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="2000"
                      step="25"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full accent-accent cursor-pointer"
                    />
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-accent/20">
                      <span className="text-muted-foreground">Estimated Total Value:</span>
                      <span className="font-serif-display text-lg font-bold text-foreground">
                        ₹{estimatedTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">Company Name *</label>
                      <input
                        required
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="Company Ltd"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border/80 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">Contact Name *</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your Name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border/80 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">Work Email *</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="name@company.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border/80 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">Phone *</label>
                      <input
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border/80 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div>
<label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1">Product Line</label>
                    <Select
                      value={form.productType}
                      onValueChange={(val) => setForm({ ...form, productType: val })}
                    >
                      <SelectTrigger className="w-full bg-secondary">
                        <SelectValue placeholder="Select product line" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Executive Notebooks">Executive Notebooks</SelectItem>
                        <SelectItem value="Custom Gift Boxes">Custom Gift Boxes</SelectItem>
                        <SelectItem value="Fountain Pens">Fountain Pens</SelectItem>
                        <SelectItem value="Desk Accessories">Desk Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-lift flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting...' : 'Request Corporate Quotation'} <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
