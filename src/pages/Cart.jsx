import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { apiClient } from '@/api/apiClient';
import { Image } from '@/components/ui/image';

export default function Cart() {
  const { items, removeItem, updateQty, subtotal, mode, clearCart, itemPrice } = useCart();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [form, setForm] = useState({ customer_name: '', email: '', phone: '', address: '', city: '', pincode: '' });

  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 49;
  const total = subtotal + shipping;

  const moqViolations = items.filter(i => mode === 'wholesale' && i.bulk_min_qty && i.qty < i.bulk_min_qty);
  const canCheckout = moqViolations.length === 0;

  const loadRazorpayScript = async () => {
    if (window.Razorpay) return true;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Unable to load Razorpay payment gateway.'));
      document.body.appendChild(script);
    });
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setCheckingOut(true);
    setPaymentError('');

    try {
      const paymentConfig = await apiClient.payments.config();
      if (!paymentConfig?.isConfigured || !paymentConfig.publishableKey) {
        throw new Error('Razorpay is not configured yet.');
      }

      const paymentOrder = await apiClient.payments.createOrder({
        amount: total,
        currency: 'inr',
        order_id: `order_${Date.now()}`,
        metadata: {
          customer_name: form.customer_name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
          order_type: mode,
        },
      });

      await loadRazorpayScript();

      const options = {
        key: paymentOrder.keyId || paymentConfig.publishableKey,
        amount: Math.round(paymentOrder.amount * 100),
        currency: paymentOrder.currency || 'INR',
        name: 'Arihant',
        description: `Order for ${items.length} item${items.length > 1 ? 's' : ''}`,
        order_id: paymentOrder.orderId,
        prefill: {
          name: form.customer_name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: '#A67C52',
        },
        modal: {
          ondismiss: () => {
            setPaymentError('Payment was cancelled.');
          },
        },
        handler: async (response) => {
          await apiClient.entities.Order.create({
            ...form,
            items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: itemPrice(i), customization: i.customization || null })),
            subtotal,
            shipping,
            total,
            order_type: mode,
            status: 'paid',
            payment_id: response.razorpay_payment_id,
            order_id: paymentOrder.orderId,
            razorpay_signature: response.razorpay_signature,
          });
          clearCart();
          setPlaced(true);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to start payment.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (placed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-6" />
        <h1 className="font-display text-3xl font-medium mb-3">Order placed!</h1>
        <p className="text-muted-foreground mb-8">Thank you for your order. We've received your details and will reach out shortly with confirmation and tracking.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors">
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
        <h1 className="font-display text-3xl font-medium mb-3">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors">
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl font-medium mb-2">Your Cart</h1>
      <p className="text-muted-foreground mb-10">{mode === 'wholesale' ? 'Wholesale pricing applied' : 'Retail pricing'} · {items.length} item{items.length > 1 ? 's' : ''}</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.lineId} className="flex gap-4 bg-card border border-border rounded-sm p-4">
              <Link to={`/product/${item.id}`} className="w-20 h-24 shrink-0 rounded-sm overflow-hidden bg-secondary">
                <Image src={item.image_url} alt={item.name} className="w-full h-full object-cover" fittingType="fill" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.id}`} className="font-display text-base font-medium hover:text-accent transition-colors block truncate">{item.name}</Link>
                {item.customization && (
                  <div className="text-xs text-accent font-medium mt-0.5 mb-1">
                    {item.customization.type === 'giftbox' ? (
                      <div className="space-y-0.5">
                        <p>✦ Custom Gift Box · {item.customization.occasion}</p>
                        <p className="text-muted-foreground">{item.customization.items?.length} items · {item.customization.packaging}</p>
                        {item.customization.message && <p className="text-muted-foreground italic truncate">"{item.customization.message}"</p>}
                      </div>
                    ) : (
                      <p>✦ "{item.customization.name}" — {item.customization.font?.includes('Fraunces') ? 'Serif' : item.customization.font?.includes('Inter') ? 'Sans' : item.customization.font?.includes('Brush') ? 'Script' : 'Mono'}</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground capitalize mb-2">{mode === 'wholesale' ? 'Wholesale' : 'Retail'} price</p>
                <p className="text-sm font-semibold">₹{itemPrice(item).toLocaleString('en-IN')}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-full">
                    <button onClick={() => updateQty(item.lineId, item.qty - 1)} className="p-2 hover:text-accent transition-colors" aria-label="Decrease">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <button onClick={() => updateQty(item.lineId, item.qty + 1)} className="p-2 hover:text-accent transition-colors" aria-label="Increase">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.lineId)} className="text-muted-foreground hover:text-destructive transition-colors p-2" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">₹{(itemPrice(item) * item.qty).toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary + Checkout */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-sm p-6 sticky top-24">
            <h2 className="font-display text-xl font-medium mb-5">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
                <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout form */}
            <form onSubmit={placeOrder} className="mt-6 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Shipping Details</h3>
              <input required value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} placeholder="Full name" className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              <input required value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Address" className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              <div className="grid grid-cols-2 gap-3">
                <input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                <input required value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="Pincode" className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              {moqViolations.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-sm p-3 text-xs text-destructive space-y-1">
                  <p className="font-medium">Minimum order quantities not met:</p>
                  {moqViolations.map(i => (
                    <p key={i.lineId}>• {i.name}: {i.qty} ordered, {i.bulk_min_qty} min</p>
                  ))}
                </div>
              )}
              {paymentError && (
                <p className="text-sm text-destructive">{paymentError}</p>
              )}
              <button
                type="submit"
                disabled={checkingOut || !canCheckout}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                {checkingOut ? 'Preparing payment...' : `Pay with Razorpay · ₹${total.toLocaleString('en-IN')}`}
              </button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-3">Secure checkout · Cash on delivery available</p>
          </div>
        </div>
      </div>
    </div>
  );
}