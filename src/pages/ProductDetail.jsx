import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingBag, ArrowLeft, Truck, RotateCcw, ShieldCheck, Heart, Share2, Wand2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import CustomizationStudio from '@/components/CustomizationStudio';
import PageMeta from '@/components/PageMeta';

/** @typedef {{ id?: string | number, name?: string, slug?: string, description?: string, long_description?: string, price?: number, wholesale_price?: number, category?: string, image_url?: string, gallery?: string[], personalizable?: boolean, customization_price?: number, bulk_min_qty?: number, tags?: string[], rating?: number, dimensions?: string, material?: string, weight?: string, care_instructions?: string, sku?: string, [key: string]: any }} Product */

const DEFAULT_CUSTOM = { name: '', font: "'Fraunces', serif", color: '#c08a3e' };

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  /** @type {[Product | null, React.Dispatch<React.SetStateAction<Product | null>>]} */
  const [product, setProduct] = useState(/** @type {Product | null} */ (null));
  /** @type {[Product[], React.Dispatch<React.SetStateAction<Product[]>>]} */
  const [related, setRelated] = useState(/** @type {Product[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [customization, setCustomization] = useState(DEFAULT_CUSTOM);
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem, mode } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setActiveImage(0);
    setCustomization(DEFAULT_CUSTOM);
    window.scrollTo(0, 0);
    apiClient.entities.Product.get(id)
      .then(async (/** @type {Product} */ p) => {
        setProduct(p);
        const rel = await apiClient.entities.Product.filter({ category: p.category }, '-created_date', 5);
        const relatedItems = Array.isArray(rel) ? rel : [];
        setRelated(relatedItems.filter((/** @type {Product} */ r) => String(r.id) !== String(p.id)).slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const displayPrice = product ? (mode === 'wholesale' ? (product.wholesale_price || product.price || 0) : (product.price || 0)) : 0;
  const savings = product && mode === 'wholesale' && product.wholesale_price && product.price
    ? product.price - product.wholesale_price : 0;
  const customCost = product?.personalizable && customization.name ? (product.customization_price || 0) : 0;
  const unitPrice = (displayPrice || 0) + customCost;

  const gallery = product ? [product.image_url, ...(product.gallery || [])].filter(Boolean) : [];

  const handleAdd = () => {
    if (!product) return;
    const customData = product.personalizable && customization.name ? { ...customization } : null;
    addItem(product, qty, customData);
    toast({ title: 'Added to cart', description: `${qty} × ${product.name}${customData ? ' (Personalized)' : ''}` });
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate('/cart');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast({ title: 'Link copied', description: 'Share this product with friends' });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-[4/5] bg-secondary animate-pulse rounded-sm" />
          <div className="space-y-4">
            <div className="h-8 bg-secondary animate-pulse rounded w-3/4" />
            <div className="h-6 bg-secondary animate-pulse rounded w-1/3" />
            <div className="h-24 bg-secondary animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/shop" className="text-accent hover:underline mt-2 inline-block">Back to shop</Link>
      </div>
    );
  }

  const specs = [
    product.dimensions ? { label: 'Dimensions', value: product.dimensions } : null,
    product.material ? { label: 'Material', value: product.material } : null,
    product.weight ? { label: 'Weight', value: product.weight } : null,
  ].filter((/** @type {{ label: string, value: string } | null} */ spec) => spec !== null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <PageMeta title={product?.name || 'Product'} description={product ? `${product.name} — ${product.description || 'Premium stationery from Arihant.'}` : 'View product details from Arihant Stationery.'} />
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-8 md:gap-14">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] rounded-sm overflow-hidden bg-secondary">
            <Image src={gallery[activeImage]} alt={product.name} className="w-full h-full object-cover" fittingType="fill" />
            {product.personalizable && customization.name && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span
                  style={{ fontFamily: customization.font, color: customization.color }}
                  className="text-4xl md:text-5xl font-medium drop-shadow-2xl"
                >
                  {customization.name}
                </span>
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-3">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-20 rounded-sm overflow-hidden border-2 transition-all ${activeImage === i ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <Image src={img} alt="" className="w-full h-full object-cover" fittingType="fill" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent mb-2 font-medium">{product.category}</p>
            <h1 className="font-display text-3xl md:text-5xl font-light leading-[1.1] tracking-tight">{product.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating || 0) ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{(product.rating || 0).toFixed(1)} · {(product.tags || []).length} tags</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl md:text-4xl font-medium">₹{unitPrice.toLocaleString('en-IN')}</span>
            {savings > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                <span className="text-sm font-medium text-accent">Save ₹{savings.toLocaleString('en-IN')}</span>
              </>
            )}
            {customCost > 0 && (
              <span className="text-xs text-muted-foreground">incl. ₹{customCost} personalization</span>
            )}
          </div>

          {mode === 'wholesale' && (
            <div className="bg-accent/10 border border-accent/20 rounded-sm p-3 text-sm">
              <p className="font-medium text-accent">Wholesale pricing active</p>
              <p className="text-muted-foreground text-xs mt-0.5">Minimum order: {product.bulk_min_qty || 1} units. Prices shown reflect bulk rates.</p>
            </div>
          )}

          <p className="text-muted-foreground leading-relaxed text-base">{product.long_description || product.description}</p>

          {product.personalizable && (
            <CustomizationStudio product={product} customization={customization} setCustomization={setCustomization} />
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}

          {/* Quantity + Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-full">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:text-accent transition-colors" aria-label="Decrease">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="p-3 hover:text-accent transition-colors" aria-label="Increase">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBuyNow}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3.5 rounded-full text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Buy Now
              </button>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full border border-border transition-colors ${wishlisted ? 'text-accent border-accent' : 'hover:border-foreground/30'}`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-accent' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-border hover:border-foreground/30 transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Specs */}
          {specs.length > 0 && (
            <div className="border-t border-border pt-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Specifications</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {specs.map((/** @type {{ label: string, value: string }} */ s) => (
                  <div key={s.label}>
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.care_instructions && (
            <div className="border-t border-border pt-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">Care Instructions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.care_instructions}</p>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
            {[
              { icon: Truck, label: 'Free shipping ₹999+' },
              { icon: RotateCcw, label: '30-day returns' },
              { icon: ShieldCheck, label: 'Secure checkout' },
            ].map((b, i) => (
              <div key={i} className="text-center space-y-1.5">
                <b.icon className="w-5 h-5 text-accent mx-auto" />
                <p className="text-xs text-muted-foreground">{b.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">SKU: {product.sku || '—'}</p>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-20 md:mt-28">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-8">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map(p => (
              <Link key={p.id} to={`/product/${p.id}`} className="group block">
                <div className="aspect-[4/5] rounded-sm overflow-hidden bg-secondary">
                  <Image src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" fittingType="fill" />
                </div>
                <h3 className="font-display text-sm font-medium mt-2 group-hover:text-accent transition-colors">{p.name}</h3>
                <p className="text-sm font-semibold">₹{(p.price || 0).toLocaleString('en-IN')}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}