import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, XCircle, Calendar, ArrowRight, Truck } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import PageMeta from '@/components/PageMeta';
import ReorderButton from '@/components/ReorderButton';
import { Image } from '@/components/ui/image';
import Reveal from '@/components/Reveal';

/**
 * @typedef {{
 *   id: number | string,
 *   customer_name: string,
 *   email: string,
 *   phone?: string,
 *   address?: string,
 *   city?: string,
 *   pincode?: string,
 *   items: Array<{ id: string | number, name: string, qty: number, price: number, image_url?: string, customization?: any }>,
 *   subtotal: number,
 *   shipping: number,
 *   total: number,
 *   order_type?: string,
 *   status: string,
 *   payment_method?: string,
 *   tracking_number?: string,
 *   created_date?: string,
 *   created_at?: string
 * }} OrderItem
 */

export default function Orders() {
  const [orders, setOrders] = useState(/** @type {OrderItem[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    apiClient.entities.Order.list()
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load order history');
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status = 'pending') => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'shipped':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Truck className="w-3.5 h-3.5 animate-pulse" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'cancelled':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
    }
  };

  const formatDate = (/** @type {string | undefined} */ dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <div className="h-10 bg-secondary animate-pulse rounded-2xl w-48" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-secondary animate-pulse rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-4">
        <p className="font-serif-display text-2xl font-bold">Unable to Load Orders</p>
        <p className="text-muted-foreground text-xs">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-xs font-semibold">
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-6">
        <PageMeta title="My Orders" description="View your stationery order history from Arihant." />
        <div className="w-20 h-20 rounded-full bg-secondary border border-border/80 flex items-center justify-center mx-auto shadow-soft">
          <Package className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h1 className="font-serif-display text-4xl font-bold">No Orders Yet</h1>
        <p className="text-muted-foreground font-light text-sm">Once you complete a purchase, tracking and receipt details will appear here.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-xs font-semibold hover:bg-accent transition-colors shadow-lift"
        >
          Browse Catalog <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-10">
      <PageMeta title="Order History & Fulfillment" description="View tracking details and reorder Arihant stationery products." />

      <div className="flex items-center justify-between pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Purchase Ledger</span>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Order History</h1>
        </div>
        <span className="text-xs font-semibold text-muted-foreground px-4 py-2 rounded-full bg-secondary">
          {orders.length} Total Orders
        </span>
      </div>

      <div className="space-y-6">
        {orders.map((order, idx) => (
          <Reveal key={order.id} delay={idx * 60}>
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-soft hover:shadow-card transition-all duration-300 space-y-6">
              
              {/* Order Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-serif-display text-xl font-bold text-foreground">Order #{order.id}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-accent" /> {formatDate(order.created_date || order.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total Amount</p>
                    <p className="font-serif-display text-2xl font-bold text-accent">₹{(order.total || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <ReorderButton order={order} />
                </div>
              </div>

              {/* Items Timeline Grid */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Items ({order.items?.length || 0})</p>
                <div className="grid gap-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/40 border border-border/40">
                      {item.image_url ? (
                        <div className="w-14 h-16 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                          <Image src={item.image_url} alt={item.name} className="w-full h-full object-cover" fittingType="fill" />
                        </div>
                      ) : (
                        <div className="w-14 h-16 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                        {item.customization?.name && (
                          <p className="text-[11px] font-medium text-accent italic">Personalization: "{item.customization.name}"</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">Quantity: {item.qty} × ₹{(item.price || 0).toLocaleString('en-IN')}</p>
                      </div>

                      <p className="font-serif-display text-sm font-bold text-foreground">
                        ₹{((item.price || 0) * item.qty).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking & Delivery Footer */}
              {order.tracking_number && (
                <div className="p-4 rounded-2xl bg-accent-soft/40 border border-accent/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-foreground">Tracking Code: {order.tracking_number}</span>
                  </div>
                  <span className="text-accent font-bold">Express Shipping</span>
                </div>
              )}

            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
