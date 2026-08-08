import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CheckCircle2, CreditCard, Banknote, AlertCircle, Truck, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/apiClient';
import { Image } from '@/components/ui/image';
import PageMeta from '@/components/PageMeta';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDIAN_STATES, validateShippingDetails } from '@/utils/indianValidation';

/** @typedef {{ customer_name: string, email: string, phone: string, address: string, city: string, state: string, pincode: string }} ShippingForm */
/** @typedef {{ id?: string | number, label?: string, full_name?: string, phone?: string, address?: string, city?: string, state?: string, pincode?: string, is_default?: boolean }} SavedAddress */
/** @typedef {{ code: string, discount_type: string, discount_value: number | string, [key: string]: any }} Coupon */
/** @typedef {{ customer_name?: string, email?: string, phone?: string, address?: string, city?: string, state?: string, pincode?: string }} ValidationErrors */
/** @typedef {{ razorpay_payment_id: string, razorpay_signature: string, razorpay_order_id?: string }} RazorpayResponse */
/** @typedef {{ keyId?: string, amount: number, currency?: string, orderId: string, isConfigured?: boolean, publishableKey?: string }} PaymentOrder */
/** @typedef {any} RazorpayCtor */

export default function Cart() {
  const { items, removeItem, updateQty, subtotal, mode, clearCart, itemPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [validationErrors, setValidationErrors] = useState(/** @type {ValidationErrors} */ ({}));
  const [paymentMethod, setPaymentMethod] = useState(/** @type {'online' | 'cod'} */ ('online'));
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(/** @type {Coupon | null} */ (null));
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState(/** @type {SavedAddress[]} */ ([]));
  const [selectedAddressId, setSelectedAddressId] = useState(/** @type {string | number | ''} */ (''));
  const [saveAddressChecked, setSaveAddressChecked] = useState(false);
  const [form, setForm] = useState(/** @type {ShippingForm} */ ({
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  }));

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    let mounted = true;
    apiClient.entities.User.addresses.list()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setSavedAddresses(list);
        const def = list.find(a => a.is_default) || list[0];
        if (def) {
          setSelectedAddressId(def.id || '');
          setForm({
            customer_name: def.full_name || '',
            email: user?.email || '',
            phone: def.phone || '',
            address: def.address || '',
            city: def.city || '',
            state: def.state || '',
            pincode: def.pincode || '',
          });
        } else if (user?.email) {
          setForm(prev => ({ ...prev, email: user.email }));
        }
      })
      .catch(() => {
        if (mounted && user?.email) {
          setForm(prev => ({ ...prev, email: user.email }));
        }
      });
    return () => { mounted = false; };
  }, [user?.id, user?.email]);

  const applySavedAddress = (/** @type {SavedAddress | undefined} */ addr) => {
    if (!addr) return;
    setSelectedAddressId(addr.id || '');
    setForm({
      customer_name: addr.full_name || '',
      email: user?.email || form.email || '',
      phone: addr.phone || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
  };

  const saveShippingAddress = async () => {
    if (!user || !saveAddressChecked) return;
    try {
      await apiClient.entities.User.addresses.create({
        label: 'Home',
        full_name: form.customer_name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        is_default: savedAddresses.length === 0,
      });
    } catch (error) {
      console.warn('Failed to save address during checkout:', error);
    }
  };

  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 49;
  const discount = couponApplied
    ? (couponApplied.discount_type === 'percentage'
        ? Math.floor((subtotal * Number(couponApplied.discount_value)) / 100)
        : Number(couponApplied.discount_value))
    : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const freeShippingThreshold = 999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const moqViolations = items.filter(i => mode === 'wholesale' && i.bulk_min_qty && i.qty < i.bulk_min_qty);
  const canCheckout = moqViolations.length === 0;

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');
    try {
      // Validate the coupon (usage is only incremented at order creation,
      // so abandoned carts / failed orders never consume coupon limits).
      const coupon = await apiClient.entities.Coupon.validate(
        couponCode.toUpperCase(),
        mode,
        subtotal
      );

      setCouponApplied(coupon);
      setCouponCode('');
      setCouponError('');
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : 'Unable to apply coupon.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  };

  const loadRazorpayScript = async () => {
    if (/** @type {RazorpayCtor} */ (window).Razorpay) return true;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Unable to load Razorpay payment gateway.'));
      document.body.appendChild(script);
    });
  };

  const placeOrder = async (/** @type {import('react').FormEvent<HTMLFormElement>} */ e) => {
    e.preventDefault();
    setValidationErrors({});
    setPaymentError('');

    const validation = validateShippingDetails(form);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setCheckingOut(true);

    try {
      if (paymentMethod === 'cod') {
        await apiClient.entities.Order.create({
          ...form,
          items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, product_id: i.id, customization: i.customization || null })),
          order_type: mode,
          status: 'pending',
          payment_method: 'cod',
          payment_status: 'pending',
          coupon_code: couponApplied?.code || null,
        });
        saveShippingAddress();
        clearCart();
        setPlaced(true);
      } else {
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
            state: form.state,
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
            color: '#C7A451',
          },
          modal: {
            ondismiss: () => {
              setPaymentError('Payment was cancelled.');
              setCheckingOut(false);
            },
          },
          handler: async (/** @type {RazorpayResponse} */ response) => {
            await apiClient.entities.Order.create({
              ...form,
              items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, product_id: i.id, customization: i.customization || null })),
              order_type: mode,
              status: 'pending',
              payment_method: 'razorpay',
              payment_status: 'paid',
              payment_id: response.razorpay_payment_id,
              order_id: paymentOrder.orderId,
              razorpay_signature: response.razorpay_signature,
              coupon_code: couponApplied?.code || null,
            });
            saveShippingAddress();
            clearCart();
            setPlaced(true);
          },
        };

        const RazorpayCtor = /** @type {RazorpayCtor} */ (window).Razorpay;
        const rzp = new RazorpayCtor(options);
        rzp.open();
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to place order.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (placed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <PageMeta title="Order Placed" description="Thank you for your order with Arihant Stationery." />
        <div className="w-20 h-20 rounded-full bg-accent-soft border border-accent/40 flex items-center justify-center mx-auto shadow-glow">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>
        <h1 className="font-serif-display text-4xl font-bold tracking-tight">Order Confirmed!</h1>
        <p className="text-muted-foreground font-light text-base leading-relaxed max-w-md mx-auto">
          {paymentMethod === 'cod'
            ? 'Your order has been confirmed with Cash on Delivery. You can pay upon delivery.'
            : 'Thank you for your business. We have received your payment and will begin white-glove packaging.'}
        </p>
        <p className="text-xs text-muted-foreground font-medium">Tracking and invoice sent to {form.email || form.phone}</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-xs font-semibold hover:bg-accent transition-colors shadow-lift"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-6">
        <PageMeta title="Shopping Bag" description="Your shopping cart is currently empty." />
        <div className="w-20 h-20 rounded-full bg-secondary border border-border/80 flex items-center justify-center mx-auto shadow-soft">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h1 className="font-serif-display text-4xl font-bold">Your Bag is Empty</h1>
        <p className="text-muted-foreground font-light text-sm">Discover our executive notebooks, pens, and personalized gifts.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-xs font-semibold hover:bg-accent transition-colors shadow-lift"
        >
          Explore Catalog <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <PageMeta title="Cart & Checkout" description="Review items and complete your order with Arihant." />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Review Bag</span>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Shopping Bag</h1>
        </div>
        <Link to="/shop" className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline">
          ← Continue Browsing Catalog
        </Link>
      </div>

      {/* Free Shipping Progress Bar */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-accent" />
          </div>
          {remainingForFreeShipping > 0 ? (
            <p className="text-sm font-light">
              Add <span className="font-bold text-foreground">₹{remainingForFreeShipping.toLocaleString('en-IN')}</span> more for <span className="font-bold text-accent">Complimentary Express Shipping</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Unlocked Complimentary Express Shipping!
            </p>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${shippingProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-accent/60 to-accent'}`}
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Cart Items & Shipping Form */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Items List */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Order Items ({items.length})</h2>
            
            {items.map((item) => {
              const price = itemPrice(item);
              const isMoqViolated = mode === 'wholesale' && item.bulk_min_qty && item.qty < item.bulk_min_qty;
              return (
                <div key={item.id} className="bg-card border border-border/80 rounded-3xl p-5 flex gap-5 shadow-soft hover:shadow-card transition-all">
                  <div className="w-24 h-28 rounded-2xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                    <Image src={item.image_url} alt={item.name} className="w-full h-full object-cover" fittingType="fill" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-accent">{item.category}</p>
                        <h3 className="font-serif-display text-lg font-bold text-foreground truncate">{item.name}</h3>
                      </div>
                      <button
                        onClick={() => removeItem(item.lineId ?? item.id)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.customization?.name && (
                      <p className="text-xs font-medium text-accent italic">
                        Personalization: "{item.customization.name}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-border/80 rounded-full bg-secondary p-1">
                        <button
                          onClick={() => updateQty(item.lineId ?? item.id, Math.max(1, item.qty - 1))}
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-card transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.lineId ?? item.id, item.qty + 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-card transition-colors"
                          aria-label="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="font-serif-display text-lg font-bold text-foreground">
                        ₹{(price * item.qty).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {isMoqViolated && (
                      <p className="text-xs font-semibold text-destructive pt-1">
                        Minimum wholesale quantity required: {item.bulk_min_qty} units
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shipping Details Form */}
          <form onSubmit={placeOrder} className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-soft">
            <h2 className="font-serif-display text-2xl font-bold tracking-tight">Shipping & Delivery Details</h2>

            {/* Saved Addresses Selector */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Saved Address</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => applySavedAddress(addr)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-accent bg-accent-soft/40 shadow-soft'
                          : 'border-border/80 bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <p className="text-xs font-bold text-foreground">{addr.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{addr.address}, {addr.city}</p>
                      <p className="text-[11px] text-muted-foreground">{addr.state} - {addr.pincode}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name *</label>
                <input
                  required
                  value={form.customer_name}
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Rahul Patil"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {validationErrors.customer_name && <p className="text-[11px] text-destructive mt-1">{validationErrors.customer_name}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email Address *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {validationErrors.email && <p className="text-[11px] text-destructive mt-1">{validationErrors.email}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mobile Number *</label>
              <input
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {validationErrors.phone && <p className="text-[11px] text-destructive mt-1">{validationErrors.phone}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Street Address *</label>
              <input
                required
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Suite 402, Indiranagar 100ft Road"
                className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {validationErrors.address && <p className="text-[11px] text-destructive mt-1">{validationErrors.address}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">City *</label>
                <input
                  required
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="Bengaluru"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">State *</label>
                <Select
                  value={form.state}
                  onValueChange={val => setForm({ ...form, state: val })}
                >
                  <SelectTrigger className="w-full bg-secondary">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pincode *</label>
                <input
                  required
                  value={form.pincode}
                  onChange={e => setForm({ ...form, pincode: e.target.value })}
                  placeholder="560038"
                  className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {user && (
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveAddressChecked}
                  onChange={e => setSaveAddressChecked(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-xs font-semibold text-muted-foreground">Save address for future purchases</span>
              </label>
            )}

            {/* Payment Method Tabs */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    paymentMethod === 'online'
                      ? 'border-accent bg-accent-soft/40 shadow-soft'
                      : 'border-border/80 bg-secondary/50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Razorpay Online</p>
                    <p className="text-[10px] text-muted-foreground">UPI, Cards, NetBanking</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-accent bg-accent-soft/40 shadow-soft'
                      : 'border-border/80 bg-secondary/50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Cash on Delivery</p>
                    <p className="text-[10px] text-muted-foreground">Pay upon arrival</p>
                  </div>
                </button>
              </div>
            </div>

            {paymentError && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {paymentError}
              </div>
            )}

            <button
              type="submit"
              disabled={checkingOut || !canCheckout}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingOut ? 'Processing Payment...' : `Complete Order · ₹${total.toLocaleString('en-IN')}`}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 space-y-6 sticky top-28">
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-lift">
            <h2 className="font-serif-display text-2xl font-bold tracking-tight">Order Summary</h2>

            {/* Coupon Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promotional Code</label>
              {couponApplied ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-accent-soft border border-accent/30">
                  <div>
                    <p className="text-xs font-bold text-accent">{couponApplied.code}</p>
                    <p className="text-[10px] text-muted-foreground">Discount Applied</p>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-destructive hover:underline font-semibold">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="ARIHANT10"
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-secondary border border-border/80 text-xs font-medium uppercase focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applyingCoupon}
                    className="bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl text-xs font-semibold hover:bg-accent transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-[11px] text-destructive">{couponError}</p>}
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 text-xs pt-4 border-t border-border/60">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-semibold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-accent font-semibold">
                  <span>Coupon Savings</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Express Shipping</span>
                <span className="font-semibold text-foreground">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-foreground pt-4 border-t border-border/60">
                <span>Total Amount</span>
                <span className="font-serif-display text-2xl text-accent">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground space-y-1 text-center font-light pt-2">
              <p>Includes all applicable GST taxes.</p>
              <p>256-bit encrypted SSL checkout.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
