import { useEffect, useState } from 'react';
import { Truck, MapPin } from 'lucide-react';
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

export default function OrdersManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    apiClient.entities.Order.list('-created_date', 200).then(setOrders).finally(() => setLoading(false));
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
                <h3 className="font-medium">{o.customer_name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${o.order_type === 'wholesale' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>{o.order_type || 'retail'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(o.status)}`}>{o.status || 'pending'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{o.email}{o.phone ? ` · ${o.phone}` : ''}</p>
              <p className="text-xs text-muted-foreground">
                {(o.items || []).length} items · ₹{(o.total || 0).toLocaleString('en-IN')} · {o.created_date ? new Date(o.created_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </p>
            </div>
            <div className="shrink-0">
              <select
                value={o.status || 'pending'}
                onChange={e => updateStatus(o.id, e.target.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${statusColor(o.status)}`}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Shipping address */}
          {o.address && (
            <div className="px-5 pb-3 text-xs text-muted-foreground flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{o.address}{o.city ? `, ${o.city}` : ''}{o.pincode ? ` - ${o.pincode}` : ''}</span>
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

          {/* Items */}
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
        </div>
      ))}
    </div>
  );
}