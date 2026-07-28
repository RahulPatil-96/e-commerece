import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

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
    { label: 'Total Products', value: stats.products, icon: Package, tab: 'products', color: 'text-accent' },
    { label: 'Orders', value: stats.orders, icon: ShoppingCart, tab: 'orders', color: 'text-accent' },
    { label: 'New Inquiries', value: stats.inquiries, icon: Mail, tab: 'inquiries', color: 'text-accent' },
    { label: 'Low Stock Items', value: stats.lowStock.length, icon: AlertTriangle, tab: 'products', color: 'text-destructive' },
  ];

  if (loading) {
    return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-secondary animate-pulse rounded-sm" />)}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <button key={i} onClick={() => onNavigate(c.tab)} className="text-left bg-card border border-border rounded-sm p-5 hover:border-accent transition-colors">
            <div className="flex items-center justify-between mb-3">
              <c.icon className={`w-5 h-5 ${c.color}`} />
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="font-display text-3xl font-medium">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="bg-card border border-border rounded-sm p-6">
          <h3 className="font-display text-lg font-medium mb-4">Low Stock Alerts</h3>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well stocked.</p>
          ) : (
            <div className="space-y-3">
              {stats.lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{p.name}</span>
                  <span className={`font-medium ml-3 ${p.stock < 20 ? 'text-destructive' : 'text-accent'}`}>{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-card border border-border rounded-sm p-6">
          <h3 className="font-display text-lg font-medium mb-4">Recent Orders</h3>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.order_type} · ₹{(o.total || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary capitalize ml-3 shrink-0">{o.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}