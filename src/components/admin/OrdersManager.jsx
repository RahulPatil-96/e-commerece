import { Fragment, useEffect, useMemo, useState } from 'react';
import { Truck, MapPin, ChevronDown, ChevronUp, Package, Zap, FileDown, Search, X } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { downloadOrderReceiptPdf } from '@/utils/orderReceiptPdf';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const ORDER_TYPES = ['retail', 'wholesale', 'bulk', 'b2b'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

/** @typedef {{ name?: string, text?: string, placement?: string, color?: string, font?: string, [key: string]: any }} Customization */
/** @typedef {{ id: string | number, name: string, qty: number, price: number, customization?: Customization, customization_price?: number, [key: string]: any }} OrderLineItem */
/** @typedef {{ id: string | number, customer_name?: string, email?: string, phone?: string, order_type?: string, status?: string, address?: string, city?: string, state?: string, pincode?: string, tracking_number?: string, items?: OrderLineItem[], payment_method?: string, payment_status?: string, subtotal?: number, shipping?: number, total?: number, created_date?: string, [key: string]: any }} OrderItem */

const statusColor = (/** @type {string | undefined} */ s) => ({
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}[s || ''] || 'bg-secondary text-muted-foreground');

const paymentStatusColor = (/** @type {string | undefined} */ s) => ({
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
  pending: 'bg-yellow-100 text-yellow-800',
}[s || ''] || 'bg-secondary text-muted-foreground');

// Known engraving colors (hex → readable label). Used to show a swatch + label alongside the code.
/** @type {Record<string, string>} */
const CUSTOM_COLOR_LABELS = {
  '#1a1612': 'Black',
  '#c08a3e': 'Gold',
  '#9a9a9a': 'Silver',
  '#1e3a5f': 'Navy',
  '#7a2e3a': 'Burgundy',
  '#2d5a3d': 'Forest',
};

// Known engraving font styles (value → readable label).
/** @type {Record<string, string>} */
const CUSTOM_FONT_LABELS = {
  "'Fraunces', serif": 'Serif',
  "'Inter', sans-serif": 'Modern',
  "'Brush Script MT', cursive": 'Script',
  'ui-monospace, monospace': 'Mono',
};

// Resolve the name/initials from an item's customization payload.
const customName = (/** @type {Customization | undefined | null} */ c) => c?.name || c?.text || '';

// Resolve a readable label for a stored hex color, falling back to the raw value.
const colorLabel = (/** @type {string | undefined} */ hex) => {
  const key = String(hex || '').trim().toLowerCase();
  if (CUSTOM_COLOR_LABELS[key]) return CUSTOM_COLOR_LABELS[key];
  const match = Object.keys(CUSTOM_COLOR_LABELS).find(
    (h) => h.toLowerCase() === key
  );
  return match ? CUSTOM_COLOR_LABELS[match] : (hex || '');
};

// Resolve a readable label for a stored font value, falling back to the raw value.
const fontLabel = (/** @type {string | undefined} */ font) => {
  const key = String(font || '').trim();
  if (CUSTOM_FONT_LABELS[key]) return CUSTOM_FONT_LABELS[key];
  const match = Object.keys(CUSTOM_FONT_LABELS).find(
    (f) => f.trim().toLowerCase() === key.toLowerCase()
  );
  return match ? CUSTOM_FONT_LABELS[match] : (font || '');
};

// Determine whether a stored hex color is a known engraving color.
const isKnownColor = (/** @type {string | undefined} */ hex) => {
  const key = String(hex || '').trim().toLowerCase();
  return Boolean(CUSTOM_COLOR_LABELS[key] || Object.keys(CUSTOM_COLOR_LABELS).find((h) => h.toLowerCase() === key));
};

const formatDate = (/** @type {string | undefined} */ dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

export default function OrdersManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState(/** @type {OrderItem[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(/** @type {string | number | null} */ (null));

  // Search + filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const fetch = () => {
    setLoading(true);
    apiClient.entities.Order.list('-created_date', 200)
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const updateStatus = async (/** @type {string | number} */ id, /** @type {string} */ status) => {
    await apiClient.entities.Order.update(id, { status });
    toast({ title: 'Order status updated', description: `Marked as ${status}` });
    fetch();
  };

  const updateTracking = async (/** @type {string | number} */ id, /** @type {string | FormDataEntryValue | null} */ tracking_number) => {
    await apiClient.entities.Order.update(id, { tracking_number: tracking_number || '' });
    toast({ title: 'Tracking number saved' });
    fetch();
  };

  const downloadReceipt = async (/** @type {OrderItem} */ order) => {
    try {
      const fileName = await downloadOrderReceiptPdf(order);
      toast({ title: 'Receipt downloaded', description: `${fileName} saved` });
    } catch (err) {
      console.error('Failed to download receipt:', err);
      toast({
        title: 'Could not download receipt',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && (o.status || 'pending') !== statusFilter) return false;
      if (typeFilter !== 'all' && (o.order_type || 'retail') !== typeFilter) return false;
      if (paymentFilter !== 'all' && (o.payment_status || 'pending') !== paymentFilter) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const haystack = [
          String(o.id),
          o.customer_name,
          o.email,
          o.phone,
          o.tracking_number,
          o.address,
          o.city,
          o.state,
          o.pincode,
          ...(o.items || []).map((i) => i.name),
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, typeFilter, paymentFilter]);

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all' || paymentFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPaymentFilter('all');
  };

  const filterSelectClass = 'px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent';

  if (loading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-secondary animate-pulse rounded-sm" />)}</div>;
  }

  if (orders.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">No orders yet.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: search + filters */}
      <div className="bg-card border border-border rounded-sm p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer, email, phone, item or tracking..."
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">All Types</option>
            {ORDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">All Payments</option>
            {PAYMENT_STATUSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="text-center py-14 text-muted-foreground">
                  No orders match your search / filters.
                </TableCell>
              </TableRow>
            )}

            {filteredOrders.map((o) => {
              const isExpanded = expandedOrderId === o.id;
              return (
                <Fragment key={o.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-accent">#{o.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide ${o.order_type === 'wholesale' || o.order_type === 'b2b' || o.order_type === 'bulk' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                          {o.order_type || 'retail'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[140px]">
                        <p className="text-sm font-medium leading-tight">{o.customer_name || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{o.email}</p>
                        {o.phone && <p className="text-xs text-muted-foreground">{o.phone}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(o.created_date)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {(o.items || []).length}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      ₹{(o.total || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 min-w-[90px]">
                        <span className="text-xs capitalize">{o.payment_method || 'cod'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit capitalize ${paymentStatusColor(o.payment_status)}`}>
                          {o.payment_status || 'pending'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={o.status || 'pending'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${statusColor(o.status)}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadReceipt(o);
                          }}
                          title={`Download receipt for Order #${o.id}`}
                          className="p-1.5 rounded-sm bg-card border border-border text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors shrink-0"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedOrderId(isExpanded ? null : o.id);
                          }}
                          className="p-1.5 rounded-sm hover:bg-secondary transition-colors shrink-0"
                          aria-label={isExpanded ? 'Collapse order details' : 'Expand order details'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow key={`expanded-${o.id}`} className="hover:bg-transparent">
                      <TableCell colSpan={8} className="p-0">
                        <div className="border-t border-border bg-secondary/30 px-5 py-4 space-y-4">
                          {/* Customer + Shipping */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-card border border-border/60 rounded-sm p-4 text-xs space-y-1.5">
                              <p className="font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-accent" /> Customer &amp; Shipping
                              </p>
                              <p className="font-semibold">{o.customer_name || '—'}</p>
                              {o.email && <p className="text-muted-foreground">{o.email}</p>}
                              {o.phone && <p className="text-muted-foreground">Phone: {o.phone}</p>}
                              {o.address && (
                                <p className="text-muted-foreground leading-relaxed mt-1">
                                  {o.address}{o.city ? `, ${o.city}` : ''}{o.state ? `, ${o.state}` : ''}{o.pincode ? ` - ${o.pincode}` : ''}
                                </p>
                              )}
                            </div>

                            {/* Payment summary */}
                            <div className="bg-card border border-border/60 rounded-sm p-4 text-xs space-y-1.5">
                              <p className="font-medium text-muted-foreground uppercase tracking-wider">Payment</p>
                              <p className="capitalize"><span className="text-muted-foreground">Method:</span> {o.payment_method || 'cod'}</p>
                              <p className="capitalize"><span className="text-muted-foreground">Status:</span> <span className={o.payment_status === 'paid' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{o.payment_status || 'pending'}</span></p>
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <p className="text-muted-foreground">Subtotal</p>
                                  <p className="font-medium">₹{(o.subtotal || 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Shipping</p>
                                  <p className="font-medium">₹{(o.shipping || 0).toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                              <div className="pt-1 border-t border-border/50">
                                <p className="font-medium text-sm">Total: ₹{(o.total || 0).toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>

                          {/* Tracking */}
                          <div className="bg-card border border-border/60 rounded-sm px-4 py-3">
                            <form
                              key={`form-${o.id}`}
                              onSubmit={(e) => {
                                e.preventDefault();
                                const val = new FormData(e.currentTarget).get('tracking');
                                if (val !== (o.tracking_number || '')) updateTracking(o.id, val);
                              }}
                              className="flex items-center gap-2 flex-wrap"
                            >
                              <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
                              <input
                                name="tracking"
                                defaultValue={o.tracking_number || ''}
                                placeholder="Add tracking number..."
                                className="flex-1 min-w-[160px] px-3 py-1.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                              />
                              <button type="submit" className="text-xs font-medium px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-accent transition-colors shrink-0">
                                Save Tracking
                              </button>
                            </form>
                          </div>

                          {/* Itemized products */}
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" /> Product Details
                            </p>
                            {(o.items || []).map((item, i) => (
                              <div key={i} className="bg-card rounded-sm p-3 space-y-2 text-xs border border-border/50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-muted-foreground">Qty: {item.qty} @ ₹{(item.price || 0).toLocaleString('en-IN')} each</p>
                                  </div>
                                  <p className="font-medium shrink-0">₹{((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</p>
                                </div>

                                {item.customization && (
                                  <div className="pt-2 border-t border-border/30 space-y-1.5">
                                    <p className="font-medium flex items-center gap-1 text-accent">
                                      <Zap className="w-3 h-3" /> Customization
                                    </p>
                                    {customName(item.customization) && (
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">Name / Initials:</span> {customName(item.customization)}
                                      </p>
                                    )}
                                    {item.customization.placement && (
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">Placement:</span> {item.customization.placement}
                                      </p>
                                    )}
                                    {item.customization.color && (
                                      <p className="text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                        <span className="font-medium">Color:</span>
                                        <span
                                          className="inline-block w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                          style={{ backgroundColor: item.customization.color }}
                                          aria-hidden="true"
                                        />
                                        <span>{colorLabel(item.customization.color)}</span>
                                        {isKnownColor(item.customization.color) && (
                                          <span className="font-mono text-muted-foreground/70">({item.customization.color})</span>
                                        )}
                                      </p>
                                    )}
                                    {item.customization.font && (
                                      <p className="text-muted-foreground">
                                        <span className="font-medium">Font:</span> {fontLabel(item.customization.font)}
                                      </p>
                                    )}
                                    {item.customization_price && (
                                      <p className="text-accent font-medium">
                                        Customization Fee: +₹{(item.customization_price || 0).toLocaleString('en-IN')}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

