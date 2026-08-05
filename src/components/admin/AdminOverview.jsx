import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import AnimatedCount from '@/components/AnimatedCount';

const statusColor = (s) => ({
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
}[String(s || '').toLowerCase()] || 'bg-secondary text-muted-foreground border-border/60');

export default function AdminOverview({ onNavigate }) {
  const [stats, setStats] = useState({ products: 0, orders: 0, inquiries: 0, lowStock: [], recentOrders: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.entities.Product.list('-created_date', 200),
      apiClient.entities.Order.list('-created_date', 5),
      apiClient.entities.B2BInquiry.filter({ status: 'new' }),
    ]).then(([products, orders, inquiries]) => {
      const prodList = Array.isArray(products) ? products : [];
      const ordList = Array.isArray(orders) ? orders : [];
      const inqList = Array.isArray(inquiries) ? inquiries : [];
      setStats({
        products: prodList.length,
        orders: ordList.length,
        inquiries: inqList.length,
        lowStock: prodList.filter(p => (p.stock || 0) < 50).sort((a, b) => (a.stock || 0) - (b.stock || 0)).slice(0, 5),
        recentOrders: ordList,
      });
    }).catch(() => {
      setStats({ products: 0, orders: 0, inquiries: 0, lowStock: [], recentOrders: [] });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Catalog Items', value: `${stats.products}`, icon: Package, tab: 'products', color: 'text-accent' },
    { label: 'Total Customer Orders', value: `${stats.orders}`, icon: ShoppingCart, tab: 'orders', color: 'text-accent' },
    { label: 'New B2B Inquiries', value: `${stats.inquiries}`, icon: Mail, tab: 'inquiries', color: 'text-accent' },
    { label: 'Low Stock Warnings', value: `${stats.lowStock.length}`, icon: AlertTriangle, tab: 'products', color: 'text-destructive' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-secondary animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => onNavigate(c.tab)}
            className="text-left bg-card border border-border/80 rounded-3xl p-6 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center">
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
            <p className="font-serif-display text-4xl font-bold text-foreground">
              <AnimatedCount value={c.value} />
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{c.label}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Low Stock Widget */}
        <div className="bg-card border border-border/80 rounded-3xl p-7 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-serif-display text-xl font-bold text-foreground">Low Stock Inventory</h3>
            <span className="text-xs text-muted-foreground font-semibold">Threshold: &lt; 50 units</span>
          </div>

          {stats.lowStock.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light py-4">All catalog items are currently well-stocked.</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-secondary/40 border border-border/40">
                  <span className="font-semibold text-foreground truncate flex-1">{p.name}</span>
                  <span className={`font-bold ml-3 px-3 py-1 rounded-full text-[11px] ${
                    (p.stock || 0) < 20 ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-accent-soft text-accent border border-accent/20'
                  }`}>
                    {p.stock} units remaining
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Widget */}
        <div className="bg-card border border-border/80 rounded-3xl p-7 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-serif-display text-xl font-bold text-foreground">Recent Orders</h3>
            <button onClick={() => onNavigate('orders')} className="text-xs text-accent font-semibold hover:underline">
              View All Orders
            </button>
          </div>

          {stats.recentOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground font-light py-4">No recent orders recorded.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-secondary/40 border border-border/40">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{o.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground">{o.order_type || 'Retail'} · ₹{(o.total || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ml-3 shrink-0 ${statusColor(o.status)}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}