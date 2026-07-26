import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Minus, Gift, Sparkles, ArrowRight, X, Package } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import PageMeta from '@/components/PageMeta';

const DEFAULT_OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Baby Shower', 'Graduation', "Teacher's Day", "Valentine's Day", 'Christmas', 'Diwali', 'Corporate'];

const DEFAULT_PACKAGING = [
  { id: 'classic', label: 'Classic Kraft', price: 0, desc: 'Recycled kraft box with twine' },
  { id: 'premium', label: 'Premium Wrap', price: 99, desc: 'Matte finish, satin ribbon' },
  { id: 'luxury', label: 'Luxury Hamper', price: 199, desc: 'Rigid magnetic-closure box' },
];

/** @typedef {{ id: string | number, image_url?: string, name: string, category?: string, price: number, audience?: string, [key: string]: any }} Product */
/** @typedef {{ product: Product, qty: number }} SelectedItem */

export default function GiftBuilder() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState(/** @type {Product[]} */([]));
  const [loading, setLoading] = useState(true);
  const [occasion, setOccasion] = useState('Birthday');
  const [selected, setSelected] = useState(/** @type {SelectedItem[]} */([]));
  const [packaging, setPackaging] = useState('classic');
  const [addCard, setAddCard] = useState(false);
  const [message, setMessage] = useState('');
  const [occasions, setOccasions] = useState(DEFAULT_OCCASIONS);
  const [packagingOptions, setPackagingOptions] = useState(DEFAULT_PACKAGING);

  useEffect(() => {
    // Fetch occasions and packaging from API
    apiClient.entities.SiteContent.getAll()
      .then(data => {
        if (data.gift_occasions) setOccasions(data.gift_occasions);
        if (data.gift_packaging) setPackagingOptions(data.gift_packaging);
      })
      .catch(() => {
        // Fallback to defaults
      });
  }, []);

  useEffect(() => {
    apiClient.entities.Product.list('-created_date', 50)
      .then(data => setProducts(data.filter(/** @param {any} p */ (p) => (p.audience || 'both') !== 'wholesale')))
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
  const packagingPrice = packagingOptions.find(p => p.id === packaging)?.price || 0;
  const cardPrice = addCard ? 49 : 0;
  const total = itemsTotal + packagingPrice + cardPrice;
  const itemCount = selected.reduce((sum, s) => sum + s.qty, 0);

  const handleAddBox = () => {
    if (selected.length === 0) return;
    addItem({
      id: `giftbox_${Date.now()}`,
      name: `Custom Gift Box · ${occasion}`,
      image_url: selected[0].product.image_url,
      price: total,
      wholesale_price: total,
      bulk_min_qty: 1,
    }, 1, {
      type: 'giftbox',
      occasion,
packaging: packagingOptions.find(p => p.id === packaging)?.label,
      message: addCard && message ? message : '',
      items: selected.map(s => ({ name: s.product.name, qty: s.qty, price: s.product.price })),
    });
    toast({ title: 'Gift box added to cart', description: `${itemCount} items · ${occasion}` });
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <PageMeta title="Gift Builder" description="Create a personalized gift box with curated stationery and premium packaging." />
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
          <Gift className="w-3.5 h-3.5" /> Build Your Own
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-light tracking-tight text-balance">
          Curate a gift<br />they'll <span className="italic text-accent">cherish.</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-5 max-w-lg mx-auto font-light">
          Handpick stationery, choose your packaging, add a personal note — we'll assemble it into a beautiful gift box.
        </p>
      </div>

      {/* Occasion selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 justify-start lg:justify-center">
          {occasions.map(occ => (
            <button
              key={occ}
              onClick={() => setOccasion(occ)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                occasion === occ
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'bg-card border border-border text-foreground/70 hover:border-foreground/30 hover:scale-105'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product picker */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-light">Choose Your Items</h2>
              <span className="text-sm text-muted-foreground">{products.length} available</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-secondary animate-pulse rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map(p => {
                  const sel = isSelected(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleItem(p)}
                      className={`group relative text-left rounded-2xl overflow-hidden bg-card transition-all duration-500 ${
                        sel ? 'ring-2 ring-accent shadow-xl scale-[1.02]' : 'ring-1 ring-border hover:shadow-lg hover:scale-[1.02]'
                      }`}
                    >
                      <div className="aspect-square overflow-hidden bg-secondary">
                        <Image src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" fittingType="fill" />
                      </div>
                      <div className="p-3.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{p.category}</p>
                        <h3 className="font-display text-sm font-medium leading-snug mt-0.5 line-clamp-2">{p.name}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-display text-base font-medium">₹{p.price.toLocaleString('en-IN')}</span>
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            sel ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground/50 group-hover:bg-primary group-hover:text-primary-foreground'
                          }`}>
                            {sel ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 rounded-3xl bg-card ring-1 ring-border overflow-hidden shadow-sm">
              {/* Box header */}
              <div className="p-6 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium uppercase tracking-wider text-accent">Your Gift Box</span>
                </div>
                <p className="font-display text-xl font-light">{occasion} Box</p>
                <p className="text-sm text-primary-foreground/60 mt-1">{itemCount} {itemCount === 1 ? 'item' : 'items'} selected</p>
              </div>

              <div className="p-6 space-y-5 max-h-[420px] overflow-y-auto">
                {/* Selected items */}
                {selected.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Your box is empty.<br />Tap products to add them.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selected.map(s => (
                      <div key={s.product.id} className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                          <Image src={s.product.image_url} alt={s.product.name} className="w-full h-full object-cover" fittingType="fill" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.product.name}</p>
                          <p className="text-xs text-muted-foreground">₹{s.product.price.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQty(s.product.id, -1)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-medium">{s.qty}</span>
                          <button onClick={() => updateQty(s.product.id, 1)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeItem(s.product.id)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Packaging */}
                {selected.length > 0 && (
                  <>
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Packaging</h4>
                      <div className="space-y-2">
                        {packagingOptions.map(pkg => (
                          <button
                            key={pkg.id}
                            onClick={() => setPackaging(pkg.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${
                              packaging === pkg.id ? 'bg-accent/10 ring-1 ring-accent' : 'ring-1 ring-border hover:ring-foreground/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{pkg.label}</span>
                              <span className="text-xs text-muted-foreground">{pkg.price === 0 ? 'Free' : `+₹${pkg.price}`}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{pkg.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Greeting card */}
                    <div className="pt-4 border-t border-border">
                      <button onClick={() => setAddCard(!addCard)} className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent" />
                          <span className="text-sm font-medium">Add Greeting Card</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{addCard ? '✓ Added' : '+₹49'}</span>
                      </button>
                      {addCard && (
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          maxLength={200}
                          placeholder="Write your personal message..."
                          className="w-full mt-3 px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer with total + add */}
              <div className="p-6 bg-secondary/50 border-t border-border space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items ({itemCount})</span>
                    <span>₹{itemsTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {packagingPrice > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Packaging</span>
                      <span>₹{packagingPrice}</span>
                    </div>
                  )}
                  {cardPrice > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Greeting Card</span>
                      <span>₹{cardPrice}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="font-display">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button
                  onClick={handleAddBox}
                  disabled={selected.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-100"
                >
                  Add Gift Box to Cart <ArrowRight className="w-4 h-4" />
                </button>
                {selected.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground">Select at least one item to build your box</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}