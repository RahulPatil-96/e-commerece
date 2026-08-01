import { useEffect, useState } from 'react';
import { Truck, MapPin, ChevronDown, ChevronUp, Package, Zap } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusColor = (s) => ({
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}[s] || 'bg-secondary text-muted-foreground');

// Known engraving colors (hex → readable label). Used to show a swatch + label alongside the code.
const CUSTOM_COLOR_LABELS = {
  '#1a1612': 'Black',
  '#c08a3e': 'Gold',
  '#9a9a9a': 'Silver',
  '#1e3a5f': 'Navy',
  '#7a2e3a': 'Burgundy',
  '#2d5a3d': 'Forest',
};

// Known engraving font styles (value → readable label).
const CUSTOM_FONT_LABELS = {
  "'Fraunces', serif": 'Serif',
  "'Inter', sans-serif": 'Modern',
  "'Brush Script MT', cursive": 'Script',
  'ui-monospace, monospace': 'Mono',
};

// Resolve the name/initials from an item's customization payload.
// `name` is the current field; `text` was used by older orders.
const customName = (c) => c?.name || c?.text || '';

// Resolve a readable label for a stored hex color, falling back to the raw value.
const colorLabel = (hex) => {
  const key = String(hex || '').trim().toLowerCase();
  if (CUSTOM_COLOR_LABELS[key]) return CUSTOM_COLOR_LABELS[key];
  const match = Object.keys(CUSTOM_COLOR_LABELS).find(
    (h) => h.toLowerCase() === key
  );
  return match ? CUSTOM_COLOR_LABELS[match] : (hex || '');
};

// Resolve a readable label for a stored font value, falling back to the raw value.
const fontLabel = (font) => {
  const key = String(font || '').trim();
  if (CUSTOM_FONT_LABELS[key]) return CUSTOM_FONT_LABELS[key];
  const match = Object.keys(CUSTOM_FONT_LABELS).find(
    (f) => f.trim().toLowerCase() === key.toLowerCase()
  );
  return match ? CUSTOM_FONT_LABELS[match] : (font || '');
};

// Determine whether a stored hex color is a known engraving color.
const isKnownColor = (hex) => {
  const key = String(hex || '').trim().toLowerCase();
  return Boolean(CUSTOM_COLOR_LABELS[key] || Object.keys(CUSTOM_COLOR_LABELS).find((h) => h.toLowerCase() === key));
};

export default function OrdersManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetch = () => {
    setLoading(true);
    apiClient.entities.Order.list('-created_date', 200)
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  const updateStatus = async (id, status) => {
    await apiClient.entities.Order.update(id, { status });
    toast({ title: 'Order status updated', description: `Marked as ${status}` });
    fetch();
  };

  const updateTracking = async (id, tracking_number) => {
    await apiClient.entities.Order.update(id, { tracking_number });
    toast({ title: 'Tracking number saved' });
    fetch();
  };

  if (loading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-secondary animate-pulse rounded-sm" />)}</div>;
  }

  if (orders.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">No orders yet.</div>;
  }

  return (
    <div className="space-y-4">
      {orders.map(o => (
        <div key={o.id} className="bg-card border border-border rounded-sm overflow-hidden hover:border-accent/40 transition-colors">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-5 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">Order #{o.id}</h3>
                <span className="text-xs text-muted-foreground">{o.customer_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${o.order_type === 'wholesale' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>{o.order_type || 'retail'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(o.status)}`}>{o.status || 'pending'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{o.email}{o.phone ? ` · ${o.phone}` : ''}</p>
              <p className="text-xs text-muted-foreground">
                {(o.items || []).length} items · ₹{(o.total || 0).toLocaleString('en-IN')} · {o.created_date ? new Date(o.created_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={o.status || 'pending'}
                onChange={e => updateStatus(o.id, e.target.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${statusColor(o.status)}`}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                className="p-1.5 hover:bg-secondary rounded-sm transition-colors"
              >
                {expandedOrderId === o.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Shipping address */}
          {o.address && (
            <div className="px-5 pb-3 text-xs text-muted-foreground flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {o.address}{o.city ? `, ${o.city}` : ''}{o.state ? `, ${o.state}` : ''}{o.pincode ? ` - ${o.pincode}` : ''}
              </span>
            </div>
          )}

          {/* Tracking */}
          <div className="border-t border-border px-5 py-3 bg-secondary/30">
            <form
              key={`form-${o.id}`}
              onSubmit={e => {
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
              <button type="submit" className="text-xs font-medium px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-accent transition-colors shrink-0">Save Tracking</button>
            </form>
          </div>

          {/* Items Summary */}
          {(o.items || []).length > 0 && (
            <div className="border-t border-border px-5 py-3 space-y-1.5">
              {(o.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate flex-1">{item.name || 'Product'} × {item.qty || 1}</span>
                  <span className="font-medium ml-3">₹{((item.price || 0) * (item.qty || 1)).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Expanded Details */}
          {expandedOrderId === o.id && (
            <div className="border-t border-border px-5 py-4 bg-secondary/50 space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{o.payment_method || 'cod'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <p className={`font-medium capitalize ${o.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{o.payment_status || 'pending'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">₹{(o.subtotal || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shipping</p>
                  <p className="font-medium">₹{(o.shipping || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Detailed Items with Customizations */}
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

                    {/* Customization Details */}
                    {item.customization && (
                      <div className="pt-2 border-t border-border/30 space-y-1.5">
                        <p className="font-medium flex items-center gap-1 text-accent">
                          <Zap className="w-3 h-3" /> Customization
                        </p>

                        {/* Name / Initials */}
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

                        {/* Color — swatch + readable label + code */}
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

                        {/* Font — readable label + raw value */}
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

              {/* Order Total */}
              <div className="border-t border-border/30 pt-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Order Total</p>
                  <p className="font-medium text-lg">₹{(o.total || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}