import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, FileDown, Search } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { downloadOrderReceiptPdf } from '@/utils/orderReceiptPdf';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const ORDER_TYPES = ['retail', 'wholesale', 'bulk', 'b2b'];

/** @typedef {{ name?: string, text?: string, placement?: string, color?: string, font?: string, [key: string]: any }} Customization */
/** @typedef {{ id: string | number, name: string, qty: number, price: number, customization?: Customization, customization_price?: number, [key: string]: any }} OrderLineItem */
/** @typedef {{ id: string | number, customer_name?: string, email?: string, phone?: string, order_type?: string, status?: string, address?: string, city?: string, state?: string, pincode?: string, tracking_number?: string, items?: OrderLineItem[], payment_method?: string, discount?: number, subtotal?: number, shipping?: number, total?: number, created_date?: string, [key: string]: any }} OrderItem */

const statusColor = (/** @type {string | undefined} */ s) => ({
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
}[s || ''] || 'bg-secondary text-muted-foreground border-border/60');

const CUSTOM_COLOR_LABELS = {
  '#1a1612': 'Black',
  '#c08a3e': 'Gold',
  '#9a9a9a': 'Silver',
  '#1e3a5f': 'Navy',
  '#7a2e3a': 'Burgundy',
  '#2d5a3d': 'Forest',
};

const CUSTOM_FONT_LABELS = {
  "'Fraunces', serif": 'Serif',
  "'Inter', sans-serif": 'Modern',
  "'Brush Script MT', cursive": 'Script',
  'ui-monospace, monospace': 'Mono',
};

const customName = (c) => c?.name || c?.text || '';

const colorLabel = (hex) => {
  const key = String(hex || '').trim().toLowerCase();
  if (CUSTOM_COLOR_LABELS[key]) return CUSTOM_COLOR_LABELS[key];
  const match = Object.keys(CUSTOM_COLOR_LABELS).find((h) => h.toLowerCase() === key);
  return match ? CUSTOM_COLOR_LABELS[match] : (hex || '');
};

const fontLabel = (font) => {
  const key = String(font || '').trim();
  if (CUSTOM_FONT_LABELS[key]) return CUSTOM_FONT_LABELS[key];
  const match = Object.keys(CUSTOM_FONT_LABELS).find((f) => f.trim().toLowerCase() === key.toLowerCase());
  return match ? CUSTOM_FONT_LABELS[match] : (font || '');
};

const formatDate = (dateStr) => {
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetch = () => {
    setLoading(true);
    apiClient.entities.Order.list('-created_date', 200)
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const updateStatus = async (id, status) => {
    try {
      await apiClient.entities.Order.update(id, { status });
      toast({ title: `Order status updated to ${status}` });
      fetch();
    } catch (err) {
      toast({ title: 'Failed to update order status', variant: 'destructive' });
    }
  };

  const updateTracking = async (id, tracking_number) => {
    try {
      await apiClient.entities.Order.update(id, { tracking_number });
      toast({ title: 'Tracking number saved' });
      fetch();
    } catch (err) {
      toast({ title: 'Failed to update tracking', variant: 'destructive' });
    }
  };

  const handleDownloadReceipt = (order) => {
    try {
      downloadOrderReceiptPdf(order);
      toast({ title: 'Receipt PDF generated', description: `Invoice downloaded for Order #${order.id}` });
    } catch (err) {
      toast({ title: 'Could not generate PDF receipt', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' });
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === 'all' || (o.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchType = typeFilter === 'all' || (o.order_type || 'retail').toLowerCase() === typeFilter.toLowerCase();
      
      const q = search.toLowerCase().trim();
      const matchSearch = !q || [
        String(o.id),
        o.customer_name,
        o.email,
        o.phone,
        o.tracking_number,
        o.city,
      ].some((field) => (field || '').toLowerCase().includes(q));

      return matchStatus && matchType && matchSearch;
    });
  }, [orders, statusFilter, typeFilter, search]);

  return (
    <div className="space-y-6">
      {/* Control Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, or phone..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-card border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent shadow-soft"
          />
        </div>

<div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Order Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Order Types</SelectItem>
              {ORDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="overflow-x-auto border border-border/80 rounded-3xl bg-card shadow-soft">
          <Table className="w-full text-xs">
            <TableHeader className="bg-secondary/60 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-5 py-4">Order ID</TableHead>
                <TableHead className="text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-5 py-4">Customer</TableHead>
                <TableHead className="text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-5 py-4">Date</TableHead>
                <TableHead className="text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-5 py-4">Type</TableHead>
                <TableHead className="text-right font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-5 py-4">Total</TableHead>
                <TableHead className="text-center font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-5 py-4">Status</TableHead>
                <TableHead className="text-center font-bold uppercase tracking-widest text-[10px] text-muted-foreground px-5 py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {filteredOrders.map((o) => {
                const isExpanded = expandedOrderId === o.id;
                return (
                  <Fragment key={o.id}>
                    <TableRow className="hover:bg-secondary/30 transition-colors">
                      <TableCell className="px-5 py-4 font-bold text-foreground font-serif-display">#{o.id}</TableCell>
                      <TableCell className="px-5 py-4">
                        <div>
                          <p className="font-bold text-foreground">{o.customer_name}</p>
                          <p className="text-[11px] text-muted-foreground">{o.email || o.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-muted-foreground font-medium">{formatDate(o.created_date)}</TableCell>
                      <TableCell className="px-5 py-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary border border-border/60">
                          {o.order_type || 'Retail'}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right font-serif-display font-bold text-sm text-foreground">
                        ₹{(o.total || 0).toLocaleString('en-IN')}
                      </TableCell>
<TableCell className="px-5 py-4 text-center">
                        <Select
                          value={o.status || 'pending'}
                          onValueChange={(val) => updateStatus(o.id, val)}
                        >
                          <SelectTrigger className={`w-36 h-9 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${statusColor(o.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDownloadReceipt(o)}
                            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-accent transition-colors"
                            title="Download PDF Receipt"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                        <TableCell colSpan={7} className="p-6">
                          <div className="space-y-4 bg-card border border-border/80 rounded-2xl p-6 shadow-soft">
                            <div className="grid sm:grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="font-bold text-foreground uppercase tracking-wider text-[10px] mb-1">Shipping Address</p>
                                <p className="font-medium text-foreground">{o.customer_name}</p>
                                <p className="text-muted-foreground">{o.address}, {o.city}</p>
                                <p className="text-muted-foreground">{o.state} - {o.pincode}</p>
                                <p className="text-muted-foreground pt-1">Phone: {o.phone}</p>
                              </div>

                              <div className="space-y-2">
                                <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">Logistics & Tracking</p>
                                <div className="flex gap-2">
                                  <input
                                    defaultValue={o.tracking_number || ''}
                                    placeholder="Enter tracking code..."
                                    onBlur={(e) => updateTracking(o.id, e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                                  />
                                </div>
                              </div>
                            </div>

{/* Line Items */}
                            <div className="space-y-2 pt-2 border-t border-border/60">
                              <p className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Order Items ({o.items?.length || 0})</p>
                              <div className="grid gap-2">
                                {o.items?.map((item, i) => {
                                  const cust = item.customization || {};
                                  const hasCustom = cust.name || cust.text || cust.font || cust.color;
                                  return (
                                    <div key={i} className="flex items-center justify-between text-xs p-3 rounded-xl bg-secondary/50 border border-border/40 gap-3">
                                      <div className="min-w-0">
                                        <p className="font-bold text-foreground">{item.name}</p>
                                        {hasCustom && (
                                          <div className="mt-1 space-y-0.5">
{(cust.name || cust.text) && (
                                              <p className="text-[11px] text-accent italic">Personalization: "{cust.name || cust.text}"</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                              {cust.font && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card border border-border/60">
                                                  Font: <span style={{ fontFamily: cust.font }} className="font-semibold text-foreground">{fontLabel(cust.font)}</span>
                                                </span>
                                              )}
                                              {cust.color && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-card border border-border/60">
                                                  <span
                                                    className="w-3 h-3 rounded-full border border-border/60"
                                                    style={{ backgroundColor: cust.color }}
                                                    title={cust.color}
                                                  />
                                                  Color: <span className="font-semibold text-foreground">{colorLabel(cust.color)}</span>
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">Qty: {item.qty} × ₹{(item.price || 0).toLocaleString('en-IN')}</p>
                                      </div>
                                      <p className="font-serif-display font-bold text-foreground shrink-0">
                                        ₹{((item.price || 0) * item.qty).toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Totals Breakdown */}
                            <div className="pt-2 border-t border-border/60">
                              <p className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground mb-2">Payment Summary</p>
                              <div className="max-w-xs ml-auto space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span className="font-semibold text-foreground">₹{(o.subtotal || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Shipping</span>
                                  <span className="font-semibold text-foreground">{o.shipping ? `₹${Number(o.shipping).toLocaleString('en-IN')}` : 'FREE'}</span>
                                </div>
                                {Number(o.discount || 0) > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-accent font-semibold">Discount</span>
                                    <span className="font-semibold text-accent">-₹{Number(o.discount).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-border/60">
                                  <span className="font-bold text-foreground">Total</span>
                                  <span className="font-serif-display font-bold text-sm text-foreground">₹{(o.total || 0).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
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
      )}
    </div>
  );
}
