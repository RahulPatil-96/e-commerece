import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Minus, Gift, Sparkles, ArrowRight, X, Package, Wand2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import PageMeta from '@/components/PageMeta';
import Reveal from '@/components/Reveal';

/** @typedef {{ id: string | number, image_url?: string, name: string, category?: string, price: number, audience?: string, [key: string]: any }} Product */
/** @typedef {{ product: Product, qty: number }} SelectedItem */

export default function GiftBuilder() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState(/** @type {Product[]} */([]));
  const [loading, setLoading] = useState(true);
  const [occasion, setOccasion] = useState('');
  const [selected, setSelected] = useState(/** @type {SelectedItem[]} */([]));
  const [packaging, setPackaging] = useState('');
  const [addCard, setAddCard] = useState(false);
  const [message, setMessage] = useState('');
  const [occasions, setOccasions] = useState(/** @type {string[]} */([]));
  const [packagingOptions, setPackagingOptions] = useState(/** @type {Array<{id: string, label: string, price: number, desc: string}>} */([]));

  useEffect(() => {
    apiClient.entities.SiteContent.getAll()
      .then(data => {
        if (Array.isArray(data.gift_occasions) && data.gift_occasions.length > 0) {
          setOccasions(data.gift_occasions);
          if (!occasion) setOccasion(data.gift_occasions[0]);
        }
        if (Array.isArray(data.gift_packaging) && data.gift_packaging.length > 0) {
          setPackagingOptions(data.gift_packaging);
          if (!packaging) setPackaging(data.gift_packaging[0].id);
        }
      })
      .catch(() => {
        // Fallback handled gracefully
      });
  }, []);

  useEffect(() => {
    apiClient.entities.Product.list('-created_date', 50)
      .then(data => setProducts((data || []).filter(p => (p.audience || 'both') !== 'wholesale')))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const isSelected = (/** @type {string | number} */ id) => selected.some(s => s.product.id === id);

  const toggleItem = (/** @type {Product} */ product) => {
    setSelected(prev =>
      prev.some(s => s.product.id === product.id)
        ? prev.filter(s => s.product.id !== product.id)
        : [...prev, { product, qty: 1 }]
    );
  };

  const updateQty = (/** @type {string | number} */ productId, /** @type {number} */ delta) => {
    setSelected(prev => prev.map(s =>
      s.product.id === productId ? { ...s, qty: Math.max(1, s.qty + delta) } : s
    ));
  };

  const removeItem = (/** @type {string | number} */ productId) => {
    setSelected(prev => prev.filter(s => s.product.id !== productId));
  };

  const itemsTotal = selected.reduce((sum, s) => sum + s.product.price * s.qty, 0);
  const packagingPrice = packagingOptions.find(p => String(p.id) === String(packaging))?.price || 0;
  const cardPrice = addCard ? 49 : 0;
  const total = itemsTotal + packagingPrice + cardPrice;
  const itemCount = selected.reduce((sum, s) => sum + s.qty, 0);

  const handleAddBox = () => {
    if (selected.length === 0) return;
    addItem({
      id: `giftbox_${Date.now()}`,
      name: `Custom Gift Set · ${occasion}`,
      image_url: selected[0].product.image_url,
      price: total,
      wholesale_price: total,
      bulk_min_qty: 1,
    }, 1, {
      type: 'giftbox',
      occasion,
      packaging: packagingOptions.find(p => String(p.id) === String(packaging))?.label,
      message: addCard && message ? message : '',
      items: selected.map(s => ({ name: s.product.name, qty: s.qty, price: s.product.price })),
    });
    toast({ title: 'Gift set added to cart', description: `${itemCount} items · ${occasion}` });
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Interactive Custom Gift Builder" description="Curate a bespoke stationery gift set with luxury packaging and personalized note." />

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center space-y-4">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block border border-accent/20">
            <Wand2 className="w-3.5 h-3.5 inline mr-1" /> Interactive Configurator
          </span>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="font-serif-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-balance">
            Curate a Gift They'll <span className="text-gradient-gold italic">Cherish.</span>
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="text-muted-foreground font-light text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Handpick artisanal items, select luxury rigid packaging, and compose a handwritten note.
          </p>
        </Reveal>
      </div>

      {/* Occasion Selector Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar justify-start lg:justify-center pb-2">
          {occasions.map((occ) => (
            <button
              key={occ}
              onClick={() => setOccasion(occ)}
              className={`shrink-0 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                occasion === occ
                  ? 'bg-primary text-primary-foreground shadow-lift scale-105'
                  : 'bg-card border border-border/80 text-foreground/80 hover:border-accent hover:scale-105'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Product Picker Grid */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h2 className="font-serif-display text-2xl font-bold">1. Select Gift Items</h2>
              <span className="text-xs font-semibold text-muted-foreground">{products.length} Products Available</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-secondary animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => {
                  const sel = isSelected(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleItem(p)}
                      className={`group relative text-left rounded-3xl overflow-hidden bg-card border transition-all duration-500 ${
                        sel
                          ? 'border-accent shadow-lift ring-2 ring-accent/30 scale-[1.02]'
                          : 'border-border/80 shadow-soft hover:shadow-card hover:scale-[1.02]'
                      }`}
                    >
                      <div className="aspect-square overflow-hidden bg-secondary">
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          fittingType="fill"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{p.category}</p>
                        <h3 className="font-serif-display text-sm font-bold text-foreground leading-tight truncate">{p.name}</h3>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-serif-display text-base font-bold text-foreground">₹{p.price.toLocaleString('en-IN')}</span>
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            sel ? 'bg-accent text-white shadow-glow' : 'bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white'
                          }`}>
                            {sel ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Gift Box Summary Panel */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="rounded-3xl bg-card border border-border/80 overflow-hidden shadow-lift space-y-6">
              
              {/* Box Banner Header */}
              <div className="p-6 bg-primary text-primary-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Bespoke Gift Box</span>
                </div>
                <h3 className="font-serif-display text-2xl font-bold">{occasion} Box</h3>
                <p className="text-xs text-primary-foreground/70 font-light">{itemCount} {itemCount === 1 ? 'item' : 'items'} selected</p>
              </div>

              <div className="p-6 space-y-6 max-h-[420px] overflow-y-auto thin-scrollbar">
                {/* Selected Items */}
                {selected.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs font-medium text-muted-foreground">Your gift box is currently empty.<br />Click products on the left to add them.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Selected Items</p>
                    {selected.map((s) => (
                      <div key={s.product.id} className="flex items-center gap-3 p-2 rounded-2xl bg-secondary/40 border border-border/40">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                          <Image src={s.product.image_url} alt={s.product.name} className="w-full h-full object-cover" fittingType="fill" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{s.product.name}</p>
                          <p className="text-[11px] text-muted-foreground">₹{s.product.price.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(s.product.id, -1)}
                            className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-card transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{s.qty}</span>
                          <button
                            onClick={() => updateQty(s.product.id, 1)}
                            className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-card transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeItem(s.product.id)} className="ml-1 text-muted-foreground hover:text-destructive">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Packaging Selection */}
                {selected.length > 0 && (
                  <div className="pt-4 border-t border-border/60 space-y-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">2. Select Packaging</h4>
                    <div className="space-y-2">
                      {packagingOptions.map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => setPackaging(pkg.id)}
                          className={`w-full text-left p-3.5 rounded-2xl transition-all ${
                            packaging === pkg.id
                              ? 'bg-accent-soft/50 border border-accent ring-1 ring-accent/30 shadow-soft'
                              : 'bg-secondary/40 border border-border/60 hover:bg-secondary'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{pkg.label}</span>
                            <span className="text-xs font-semibold text-accent">{pkg.price === 0 ? 'Included' : `+₹${pkg.price}`}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-light">{pkg.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Greeting Card Note */}
                {selected.length > 0 && (
                  <div className="pt-4 border-t border-border/60 space-y-3">
                    <button
                      onClick={() => setAddCard(!addCard)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span>Add Handwritten Greeting Card</span>
                      </div>
                      <span className="text-accent font-semibold">{addCard ? '✓ Added' : '+₹49'}</span>
                    </button>

                    {addCard && (
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        maxLength={200}
                        placeholder="Write your custom gift message here..."
                        className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Summary Footer */}
              <div className="p-6 bg-secondary/50 border-t border-border/60 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Selected Items ({itemCount})</span>
                    <span className="font-semibold text-foreground">₹{itemsTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {packagingPrice > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Packaging</span>
                      <span className="font-semibold text-foreground">₹{packagingPrice}</span>
                    </div>
                  )}
                  {cardPrice > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Greeting Card</span>
                      <span className="font-semibold text-foreground">₹{cardPrice}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-foreground pt-3 border-t border-border/60">
                    <span>Total Box Value</span>
                    <span className="font-serif-display text-2xl text-accent">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddBox}
                  disabled={selected.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-lift disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Custom Gift Set to Cart <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}