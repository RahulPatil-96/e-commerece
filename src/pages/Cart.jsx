import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CheckCircle2, CreditCard, Banknote, AlertCircle, Truck, MapPin, BookmarkPlus } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/apiClient';
import { Image } from '@/components/ui/image';
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

  // Load saved addresses when a user is logged in
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Non-fatal: never block order placement because of an address save issue
      console.warn('Failed to save address during checkout:', error);
    }
  };

  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 49;
  /** @type {number} */
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
      const coupon = await apiClient.entities.Coupon.validate(
        couponCode.toUpperCase(),
        mode,
        subtotal
      );

      setCouponApplied(coupon);
      setCouponCode('');
      setCouponError('');
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : 'Unable to apply coupon. Please try again.');
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

    // Validate all fields
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
          items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: itemPrice(i), product_id: i.id, customization: i.customization || null })),
          subtotal,
          shipping,
          total,
          order_type: mode,
          status: 'pending',
          payment_method: 'cod',
          payment_status: 'pending',
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
            color: '#A67C52',
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
              items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: itemPrice(i), product_id: i.id, customization: i.customization || null })),
              subtotal,
              shipping,
              total,
              order_type: mode,
              status: 'paid',
              payment_method: 'online',
              payment_status: 'paid',
              payment_id: response.razorpay_payment_id,
              order_id: paymentOrder.orderId,
              razorpay_signature: response.razorpay_signature,
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
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-soft shadow-glow mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Order placed successfully!</h1>
        <p className="text-muted-foreground mb-2">
          {paymentMethod === 'cod'
            ? 'Your order has been placed with Cash on Delivery. You can pay when your package arrives.'
            : "Thank you for your order. We've received your payment and will process your order immediately."}
        </p>
        <p className="text-xs text-muted-foreground mb-8">We will reach out to {form.phone || form.email} with confirmation and tracking details.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors shadow-md">
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary shadow-soft mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors shadow-md">
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-medium mb-2">Your Cart</h1>
          <p className="text-muted-foreground">{mode === 'wholesale' ? 'Wholesale pricing applied' : 'Retail pricing'} · {items.length} item{items.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-accent hover:underline self-start md:self-auto">
          ← Back to Shop
        </Link>
      </div>

      {/* Free shipping progress */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-soft mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-accent" />
          </div>
          {remainingForFreeShipping > 0 ? (
            <p className="text-sm">
              <span className="font-semibold text-foreground">Add ₹{remainingForFreeShipping.toLocaleString('en-IN')}</span>
              <span className="text-muted-foreground"> more to get <span className="font-medium text-accent">FREE shipping</span></span>
            </p>
          ) : (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              🎉 You've unlocked FREE shipping!
            </p>
          )}
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${shippingProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-accent/70 to-accent'}`}
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.lineId} className="flex gap-4 bg-card border border-border/70 rounded-2xl p-4 shadow-soft hover:shadow-card transition-shadow">
              <Link to={`/product/${item.id}`} className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-secondary">
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
          <div className="bg-card border border-border/70 rounded-2xl p-6 sticky top-24 shadow-card">
            <h2 className="font-display text-xl font-medium mb-5">Order Summary</h2>

            {/* Coupon input */}
            <div className="mb-4">
              {couponApplied ? (
                <div className="flex items-center justify-between bg-accent/10 border border-accent/30 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-accent uppercase tracking-wide">{couponApplied.code}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {couponApplied.discount_type === 'percentage'
                          ? `${couponApplied.discount_value}% off applied`
                          : `₹${couponApplied.discount_value} off applied`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Discount ({couponApplied?.code})</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
                <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout form */}
            <form onSubmit={placeOrder} className="mt-6 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Shipping Details</h3>

              {/* Saved address selector */}
              {user && savedAddresses.length > 0 && (
                <div className="bg-secondary/40 border border-border rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    Saved Addresses
                  </div>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => {
                      const addr = savedAddresses.find(a => String(a.id) === e.target.value);
                      applySavedAddress(addr);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">— Select a saved address —</option>
                    {savedAddresses.map(a => (
                      <option key={a.id} value={String(a.id)}>
                        {a.label || 'Address'} · {a.address}, {a.city} {a.pincode ? `- ${a.pincode}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input required value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} placeholder="Full name" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              <input 
                required 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
                placeholder="Phone (10 digits)"
                maxLength={10}
                className={`w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 ${validationErrors.phone ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-accent'}`} 
              />
              {validationErrors.phone && <p className="text-xs text-destructive mt-1">{validationErrors.phone}</p>}
              
              <input 
                required 
                value={form.address} 
                onChange={e => setForm({...form, address: e.target.value})} 
                placeholder="Address"
                className={`w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 ${validationErrors.address ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-accent'}`} 
              />
              {validationErrors.address && <p className="text-xs text-destructive mt-1">{validationErrors.address}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input 
                    required 
                    value={form.city} 
                    onChange={e => setForm({...form, city: e.target.value})} 
                    placeholder="City"
                    className={`w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 ${validationErrors.city ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-accent'}`} 
                  />
                  {validationErrors.city && <p className="text-xs text-destructive mt-1">{validationErrors.city}</p>}
                </div>
                <div>
                  <input 
                    required 
                    value={form.pincode} 
                    onChange={e => setForm({...form, pincode: e.target.value})} 
                    placeholder="Pincode (6 digits)"
                    maxLength={6}
                    className={`w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 ${validationErrors.pincode ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-accent'}`} 
                  />
                  {validationErrors.pincode && <p className="text-xs text-destructive mt-1">{validationErrors.pincode}</p>}
                </div>
              </div>

              <div>
                <select 
                  required 
                  value={form.state} 
                  onChange={e => setForm({...form, state: e.target.value})} 
                  className={`w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 ${validationErrors.state ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-accent'}`}
                >
                  <option value="">Select State / Union Territory</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {validationErrors.state && <p className="text-xs text-destructive mt-1">{validationErrors.state}</p>}
              </div>

              {/* Save address for logged-in users */}
              {user && (
                <label className="flex items-center gap-2.5 bg-secondary/40 border border-border rounded-xl p-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAddressChecked}
                    onChange={(e) => setSaveAddressChecked(e.target.checked)}
                    className="w-4 h-4 accent-accent shrink-0"
                  />
                  <BookmarkPlus className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-xs text-muted-foreground leading-snug">
                    Save this address to my account for faster checkout
                  </span>
                </label>
              )}

              {/* Payment Method Selector */}
              <div className="pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment Method</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      paymentMethod === 'online'
                        ? 'border-accent bg-accent/10 text-accent font-semibold shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Online Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-accent bg-accent/10 text-accent font-semibold shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Banknote className="w-4 h-4 shrink-0" />
                    <span>Cash on Delivery</span>
                  </button>
                </div>
                {paymentMethod === 'cod' && (
                  <p className="text-[11px] text-muted-foreground mt-2 bg-secondary/50 p-2.5 rounded-xl leading-relaxed">
                    💵 Pay with cash upon doorstep delivery. Please keep exact change ready.
                  </p>
                )}
              </div>

              {moqViolations.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive space-y-1">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Minimum order quantities not met:</p>
                      {moqViolations.map(i => (
                        <p key={i.lineId} className="ml-0">• {i.name}: {i.qty} ordered, min {i.bulk_min_qty}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {paymentError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{paymentError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={checkingOut || !canCheckout}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 shadow-md"
              >
                {checkingOut
                  ? (paymentMethod === 'cod' ? 'Placing order...' : 'Preparing payment...')
                  : (paymentMethod === 'cod'
                      ? `Place Order (Cash on Delivery) · ₹${total.toLocaleString('en-IN')}`
                      : `Pay with Razorpay · ₹${total.toLocaleString('en-IN')}`
                    )}
              </button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-3">Secure checkout · Online payment & COD available</p>
          </div>
        </div>
      </div>
    </div>
  );
}

