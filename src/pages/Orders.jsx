import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, XCircle, CreditCard, Banknote, MapPin, Calendar, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import PageMeta from '@/components/PageMeta';
import ReorderButton from '@/components/ReorderButton';
import { Image } from '@/components/ui/image';

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
 *   payment_status?: string,
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'shipped':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Truck className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'cancelled':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span className="capitalize">{status}</span>
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <PageMeta title="My Orders" description="View your past order history and tracking details from Arihant Stationery." />
        <div className="h-10 bg-secondary animate-pulse rounded-md w-48 mb-8" />
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse p-6" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <PageMeta title="My Orders" description="View your order history." />
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Link to="/" className="text-accent hover:underline text-sm font-medium">Return to Home</Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <PageMeta title="My Orders" description="View your order history." />
        <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
        <h1 className="font-display text-3xl font-medium mb-3">No orders found</h1>
        <p className="text-muted-foreground mb-8">You haven't placed any orders yet. Explore our handcrafted collection!</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors">
          Browse Shop <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <PageMeta title="My Orders" description="View your order history, delivery status, and order details." />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Showing {orders.length} order{orders.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline self-start sm:self-auto">
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">Order #{order.id}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Placed on {formatDate(order.created_date || order.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Total Amount</span>
                  <span className="font-display text-lg font-bold">₹{order.total.toLocaleString('en-IN')}</span>
                </div>
                <ReorderButton items={order.items || []} orderType={order.order_type || 'retail'} />
              </div>
            </div>

            {/* Content Body */}
            <div className="grid md:grid-cols-3 gap-6 pt-5">
              {/* Items List */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ordered Items</h3>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-secondary/40 p-3 rounded-lg border border-border/40">
                    <div className="w-12 h-14 bg-secondary rounded overflow-hidden shrink-0">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} className="w-full h-full object-cover" fittingType="fill" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.customization && (
                        <p className="text-xs text-accent flex items-center gap-1.5 flex-wrap">
                          <span>✦ Personalized: {item.customization.name || item.customization.text || 'Custom'}</span>
                          {item.customization.color && (
                            <span className="inline-flex items-center gap-1">
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-black/10"
                                style={{ backgroundColor: item.customization.color }}
                                aria-hidden="true"
                              />
                              <span className="font-mono text-muted-foreground/80">{item.customization.color}</span>
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">₹{(item.qty * item.price).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Info & Delivery details */}
              <div className="space-y-4 bg-secondary/20 p-4 rounded-lg border border-border/50 text-xs">
                <div>
                  <h4 className="font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent" /> Shipping Address
                  </h4>
                  <p className="font-medium text-foreground">{order.customer_name}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {order.address}{order.city ? `, ${order.city}` : ''}{order.pincode ? ` - ${order.pincode}` : ''}
                  </p>
                  {order.phone && <p className="text-muted-foreground mt-1">Phone: {order.phone}</p>}
                </div>

                <div className="border-t border-border/60 pt-3">
                  <h4 className="font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    {order.payment_method === 'cod' ? (
                      <Banknote className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5 text-accent" />
                    )}
                    Payment Info
                  </h4>
                  <p className="font-medium capitalize text-foreground">
                    Method: {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}
                  </p>
                  <p className="text-muted-foreground capitalize">
                    Payment Status: <span className={order.payment_status === 'paid' ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{order.payment_status || 'Pending'}</span>
                  </p>
                </div>

                {order.tracking_number && (
                  <div className="border-t border-border/60 pt-3">
                    <h4 className="font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-accent" /> Tracking
                    </h4>
                    <p className="font-mono font-medium text-accent">{order.tracking_number}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
