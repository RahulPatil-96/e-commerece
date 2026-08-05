import { useEffect, useState } from 'react';
import { Ticket, Plus, X, Trash2, Copy, Check, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const generateCode = (len = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const seg1 = len / 2;
  for (let i = 0; i < len; i++) {
    if (i === seg1) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: '',
    max_uses: '',
    valid_until: '',
    applicable_to: 'all',
  });
  const { toast } = useToast();

  const loadCoupons = () => {
    setLoading(true);
    setError('');
    apiClient.entities.Coupon.list()
      .then(data => setCoupons(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message || 'Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(loadCoupons, []);

  const handleGenerate = () => {
    setForm(f => ({ ...f, code: generateCode() }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.entities.Coupon.create({
        code: form.code,
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_value: form.min_order_value ? Number(form.min_order_value) : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        applicable_to: form.applicable_to,
      });
      toast({ title: 'Coupon created', description: `${form.code} is now active.` });
      setModalOpen(false);
      setForm({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_value: '',
        max_uses: '',
        valid_until: '',
        applicable_to: 'all',
      });
      loadCoupons();
    } catch (err) {
      toast({ title: 'Failed to create coupon', description: err instanceof Error ? err.message : 'Error creating coupon', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (coupon) => {
    try {
      await apiClient.entities.Coupon.update(coupon.id, { is_active: !coupon.is_active });
      toast({ title: coupon.is_active ? 'Coupon deactivated' : 'Coupon activated', description: coupon.code });
      loadCoupons();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update coupon', variant: 'destructive' });
    }
  };

  const handleDelete = async (coupon) => {
    try {
      await apiClient.entities.Coupon.delete(coupon.id);
      toast({ title: 'Coupon deleted', description: coupon.code });
      loadCoupons();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete coupon', variant: 'destructive' });
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isExpired = (c) => c.valid_until && new Date(c.valid_until) < new Date();
  const isLimitReached = (c) => c.max_uses !== null && c.current_uses >= c.max_uses;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-3" />
        <p className="text-xs text-destructive">{error}</p>
        <button onClick={loadCoupons} className="text-xs text-accent hover:underline mt-2">Try again</button>
      </div>
    );
  }

  const inputClass = 'w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-bold text-foreground">Coupons & Promotional Codes</h2>
          <p className="text-xs text-muted-foreground">{coupons.length} active coupons registered</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all shadow-lift"
        >
          <Plus className="w-4 h-4" /> Generate New Coupon
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: coupons.filter(c => c.is_active && !isExpired(c) && !isLimitReached(c)).length, color: 'text-emerald-600' },
          { label: 'Inactive', value: coupons.filter(c => !c.is_active).length, color: 'text-muted-foreground' },
          { label: 'Expired', value: coupons.filter(isExpired).length, color: 'text-amber-600' },
          { label: 'Limit Reached', value: coupons.filter(c => isLimitReached(c) && !isExpired(c)).length, color: 'text-rose-600' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft">
            <p className={`font-serif-display text-4xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Coupon List */}
      {coupons.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/80 shadow-soft">
          <Ticket className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-serif-display text-2xl font-bold">No Promotional Coupons</p>
          <p className="text-xs text-muted-foreground mt-1">Generate discounts to reward high-volume corporate clients.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((c) => {
            const expired = isExpired(c);
            const limitReached = isLimitReached(c);
            return (
              <div key={c.id} className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft hover:shadow-card transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-sm font-bold tracking-widest px-4 py-2 rounded-2xl border-2 border-dashed border-accent/60 bg-accent-soft text-accent">
                        {c.code}
                      </span>
                      <button onClick={() => handleCopy(c.code)} className="p-2 rounded-full hover:bg-secondary">
                        {copied === c.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-xs truncate">{c.description || 'No description provided'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="px-3 py-1 rounded-full font-bold bg-accent-soft text-accent">
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${Number(c.discount_value).toLocaleString('en-IN')} OFF`}
                        </span>
                        {c.min_order_value > 0 && <span className="px-3 py-1 rounded-full bg-secondary border border-border/60 font-medium">Min ₹{Number(c.min_order_value).toLocaleString('en-IN')}</span>}
                        {c.max_uses !== null && <span className="px-3 py-1 rounded-full bg-secondary border border-border/60 font-medium">{c.current_uses}/{c.max_uses} uses</span>}
                        <span className="px-3 py-1 rounded-full bg-secondary border border-border/60 font-medium">Valid until {formatDate(c.valid_until)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(c)}
                      disabled={expired}
                      className="text-xs font-semibold px-4 py-2 rounded-full border border-border/80 hover:border-accent hover:text-accent transition-colors"
                    >
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div
            className="relative bg-card border border-border/80 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lift animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-accent" />
                <h3 className="font-serif-display text-xl font-bold">Generate Coupon Code</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Code *</label>
                <div className="flex gap-2">
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="E.G. ARIHANT10"
                    className={`${inputClass} font-mono uppercase tracking-wider`}
                  />
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-1.5 shrink-0 px-4 py-3 rounded-2xl border border-border/80 font-semibold hover:bg-secondary"
                  >
                    <Wand2 className="w-4 h-4 text-accent" /> Auto Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Festival wholesale discount"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
<div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Discount Type</label>
                  <Select
                    value={form.discount_type}
                    onValueChange={(val) => setForm({ ...form, discount_type: val })}
                  >
                    <SelectTrigger className={`${inputClass}`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Value *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder="10"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_order_value}
                    onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Max Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-border/80 py-3 rounded-full font-semibold hover:bg-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:bg-accent">{creating ? 'Creating...' : 'Create Coupon'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
