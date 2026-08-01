import { useEffect, useState } from 'react';
import { Ticket, Plus, X, Trash2, Copy, Check, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';

/**
 * @typedef {Object} Coupon
 * @property {number} id
 * @property {string} code
 * @property {string} description
 * @property {string} discount_type
 * @property {number} discount_value
 * @property {number | null} min_order_value
 * @property {number | null} max_uses
 * @property {number} current_uses
 * @property {string | null} valid_until
 * @property {boolean} is_active
 * @property {string} applicable_to
 * @property {string} created_at
 */

const generateCode = (/** @type {number} */ len = 10) => {
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
  /** @type {[Coupon[], import('react').Dispatch<import('react').SetStateAction<Coupon[]>>]} */
  const [coupons, setCoupons] = useState(/** @type {Coupon[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(/** @type {string | null} */ (null));
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
      .catch(/** @param {any} err */ err => setError(err.message || 'Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(loadCoupons, []);

  const handleGenerate = () => {
    setForm(f => ({ ...f, code: generateCode() }));
  };

  const handleCreate = async (/** @type {React.FormEvent} */ e) => {
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
    } catch (/** @param {any} err */ err) {
      toast({ title: 'Failed to create coupon', description: err.message || 'Error creating coupon', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (/** @type {Coupon} */ coupon) => {
    try {
      await apiClient.entities.Coupon.update(coupon.id, { is_active: !coupon.is_active });
      toast({ title: coupon.is_active ? 'Coupon deactivated' : 'Coupon activated', description: coupon.code });
      loadCoupons();
    } catch (/** @param {any} err */ err) {
      toast({ title: 'Error', description: err.message || 'Failed to update coupon', variant: 'destructive' });
    }
  };

  const handleDelete = async (/** @type {Coupon} */ coupon) => {
    try {
      await apiClient.entities.Coupon.delete(coupon.id);
      toast({ title: 'Coupon deleted', description: coupon.code });
      loadCoupons();
    } catch (/** @param {any} err */ err) {
      toast({ title: 'Error', description: err.message || 'Failed to delete coupon', variant: 'destructive' });
    }
  };

  const handleCopy = async (/** @type {string} */ code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable
    }
  };

  const formatDate = (/** @type {string | null} */ dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isExpired = (/** @type {Coupon} */ c) => c.valid_until && new Date(c.valid_until) < new Date();
  const isLimitReached = (/** @type {Coupon} */ c) => c.max_uses !== null && c.current_uses >= c.max_uses;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-3" />
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={loadCoupons} className="text-sm text-accent hover:underline mt-2">Try again</button>
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-medium">Coupons & Discounts</h2>
          <p className="text-sm text-muted-foreground">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''} created</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-all duration-300 shadow-md hover:shadow-glow"
        >
          <Plus className="w-4 h-4" /> Generate Coupon
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: coupons.filter(c => c.is_active && !isExpired(c) && !isLimitReached(c)).length, color: 'text-emerald-600' },
          { label: 'Inactive', value: coupons.filter(c => !c.is_active).length, color: 'text-muted-foreground' },
          { label: 'Expired', value: coupons.filter(isExpired).length, color: 'text-amber-600' },
          { label: 'Limit Reached', value: coupons.filter(c => isLimitReached(c) && !isExpired(c)).length, color: 'text-rose-600' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <p className={`font-display text-3xl font-medium ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Coupon list */}
      {coupons.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border/60 shadow-soft">
          <Ticket className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No coupons yet. Generate your first coupon to start driving sales.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const expired = isExpired(c);
            const limitReached = isLimitReached(c);
            return (
              <div key={c.id} className={`bg-card border rounded-2xl p-5 shadow-soft transition-all hover:shadow-card ${expired || limitReached ? 'border-amber-300/60' : 'border-border/60'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-mono text-base font-bold tracking-wider px-4 py-2 rounded-xl border-2 border-dashed ${c.is_active && !expired && !limitReached ? 'text-accent border-accent bg-accent-soft' : 'text-muted-foreground border-border bg-secondary/50'}`}>
                        {c.code}
                      </span>
                      <button
                        onClick={() => handleCopy(c.code)}
                        className="p-2 rounded-full hover:bg-secondary transition-colors"
                        aria-label="Copy code"
                        title="Copy code"
                      >
                        {copied === c.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.description || 'No description'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${c.discount_type === 'percentage' ? 'bg-accent-soft text-accent' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${Number(c.discount_value).toLocaleString('en-IN')} off`}
                        </span>
                        {c.min_order_value > 0 && <span className="px-2 py-0.5 rounded-full bg-secondary">Min ₹{Number(c.min_order_value).toLocaleString('en-IN')}</span>}
                        {c.applicable_to !== 'all' && <span className="px-2 py-0.5 rounded-full bg-secondary capitalize">{c.applicable_to} only</span>}
                        {c.max_uses !== null && <span className="px-2 py-0.5 rounded-full bg-secondary">{c.current_uses}/{c.max_uses} uses</span>}
                        <span className="px-2 py-0.5 rounded-full bg-secondary">Until {formatDate(c.valid_until)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {expired && <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-medium">Expired</span>}
                    {limitReached && !expired && <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 font-medium">Used up</span>}
                    {!expired && !limitReached && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-secondary text-muted-foreground'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                    <button
                      onClick={() => handleToggle(c)}
                      disabled={expired}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${expired ? 'opacity-40 cursor-not-allowed' : 'border-border hover:border-accent hover:text-accent'}`}
                    >
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Delete coupon"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setModalOpen(false)} />
          <div className="relative bg-background border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lift animate-fade-up">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-background/95 backdrop-blur z-10">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-accent" />
                <h3 className="font-display text-lg font-medium">Generate Coupon</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Coupon Code *</label>
                <div className="flex gap-2">
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE10"
                    className={`${inputClass} font-mono uppercase tracking-wider`}
                  />
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-1.5 shrink-0 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary hover:border-accent transition-all"
                    title="Generate random code"
                  >
                    <Wand2 className="w-4 h-4 text-accent" /> Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Festival sale discount"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {form.discount_type === 'percentage' ? 'Discount Value (%) *' : 'Discount Value (₹) *'}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percentage' ? '10' : '100'}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min Order Value (₹)</label>
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
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Uses</label>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Valid Until</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Applies To</label>
                  <select
                    value={form.applicable_to}
                    onChange={(e) => setForm({ ...form, applicable_to: e.target.value })}
                    className={inputClass}
                  >
                    <option value="all">All Orders</option>
                    <option value="retail">Retail Only</option>
                    <option value="wholesale">Wholesale Only</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-border py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

