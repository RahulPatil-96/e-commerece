import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingBag, ArrowLeft, Truck, RotateCcw, ShieldCheck, Heart, Share2, Sparkles } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import CustomizationStudio from '@/components/CustomizationStudio';
import ReviewsSection from '@/components/ReviewsSection';
import PageMeta from '@/components/PageMeta';
import ProductCard from '@/components/ProductCard';

/** @typedef {{ id?: string | number, name?: string, slug?: string, description?: string, long_description?: string, price?: number, wholesale_price?: number, category?: string, image_url?: string, gallery?: string[], personalizable?: boolean, customization_price?: number, bulk_min_qty?: number, tags?: string[], rating?: number, dimensions?: string, material?: string, weight?: string, care_instructions?: string, sku?: string, [key: string]: any }} Product */

const DEFAULT_CUSTOM = { name: '', font: "'Fraunces', serif", color: '#c08a3e' };

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(/** @type {Product | null} */ (null));
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
      .then(async (p) => {
        setProduct(p);
        const rel = await apiClient.entities.Product.filter({ category: p.category }, '-created_date', 5);
        const relatedItems = Array.isArray(rel) ? rel : [];
        setRelated(relatedItems.filter((r) => String(r.id) !== String(p.id)).slice(0, 4));
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
          <div className="aspect-[4/5] bg-secondary animate-pulse rounded-3xl" />
          <div className="space-y-6">
            <div className="h-10 bg-secondary animate-pulse rounded-2xl w-3/4" />
            <div className="h-8 bg-secondary animate-pulse rounded-2xl w-1/3" />
            <div className="h-32 bg-secondary animate-pulse rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="font-serif-display text-2xl font-bold">Product Not Found</p>
        <p className="text-muted-foreground text-sm font-light">The requested stationery item is unavailable.</p>
        <Link to="/shop" className="inline-block bg-primary text-primary-foreground px-7 py-3 rounded-full text-xs font-semibold shadow-soft">
          Return to Shop
        </Link>
      </div>
    );
  }

  const specs = [
    product.dimensions ? { label: 'Dimensions', value: product.dimensions } : null,
    product.material ? { label: 'Material', value: product.material } : null,
    product.weight ? { label: 'Weight', value: product.weight } : null,
  ].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <PageMeta
        title={product?.name || 'Product'}
        description={product ? `${product.name} — ${product.description || 'Premium stationery from Arihant.'}` : 'View product details from Arihant Stationery.'}
      />

      {/* Back button */}
      <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* Photo Gallery Column */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-secondary border border-border/80 shadow-lift">
            <Image
              src={gallery[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              fittingType="fill"
            />
            {product.personalizable && customization.name && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                <span
                  style={{ fontFamily: customization.font, color: customization.color }}
                  className="text-4xl md:text-6xl font-bold drop-shadow-2xl text-center"
                >
                  {customization.name}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0 shadow-soft ${
                    activeImage === i ? 'border-accent ring-2 ring-accent/30 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt="" className="w-full h-full object-cover" fittingType="fill" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Form */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block mb-3 border border-accent/20">
              {product.category || 'Stationery'}
            </span>
            <h1 className="font-serif-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.05]">
              {product.name}
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1 text-accent">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating || 4.8) ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {(product.rating || 4.8).toFixed(1)} Rating · Archival Grade
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pt-2">
            <span className="font-serif-display text-4xl font-bold text-foreground">
              ₹{unitPrice.toLocaleString('en-IN')}
            </span>
            {savings > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                <span className="text-xs font-bold text-accent uppercase tracking-wider bg-accent-soft px-2.5 py-1 rounded-full">
                  Save ₹{savings.toLocaleString('en-IN')}
                </span>
              </>
            )}
            {customCost > 0 && (
              <span className="text-xs text-muted-foreground">incl. ₹{customCost} customization</span>
            )}
          </div>

          {/* Wholesale Callout */}
          {mode === 'wholesale' && (
            <div className="bg-accent-soft border border-accent/30 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Wholesale Tiered Pricing Active
              </p>
              <p className="text-xs text-muted-foreground font-light">
                Minimum order quantity: {product.bulk_min_qty || 1} units. Displayed prices reflect high-volume B2B discount rates.
              </p>
            </div>
          )}

          {/* Description */}
          <p className="text-muted-foreground font-light leading-relaxed text-sm sm:text-base">
            {product.long_description || product.description}
          </p>

          {/* Personalization Studio Component */}
          {product.personalizable && (
            <CustomizationStudio product={product} customization={customization} setCustomization={setCustomization} />
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="text-[11px] font-semibold uppercase tracking-wider bg-secondary px-3.5 py-1.5 rounded-full text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Quantity Selector & Main Buttons */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border/80 rounded-full bg-secondary p-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-card transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-foreground">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-card transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-lift"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Shopping Bag
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBuyNow}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-full text-sm font-semibold hover:bg-accent/90 transition-all shadow-glow"
              >
                Instant Buy Now
              </button>

              <button
                onClick={() => setWishlisted(!wishlisted)}
                className={`w-14 h-14 rounded-full border border-border/80 flex items-center justify-center transition-all ${
                  wishlisted ? 'bg-accent text-white border-accent shadow-soft' : 'hover:bg-secondary'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="w-14 h-14 rounded-full border border-border/80 flex items-center justify-center hover:bg-secondary transition-all"
                aria-label="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Specifications */}
          {specs.length > 0 && (
            <div className="border-t border-border/60 pt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">Specifications</h3>
              <dl className="grid grid-cols-2 gap-4 text-xs">
                {specs.map((s) => (
                  <div key={s.label} className="p-3 rounded-2xl bg-secondary/50 border border-border/40">
                    <dt className="text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">{s.label}</dt>
                    <dd className="font-semibold text-foreground text-sm mt-0.5">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Trust Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border/60">
            {[
              { icon: Truck, label: 'Complimentary Delivery' },
              { icon: RotateCcw, label: '30-Day Guarantee' },
              { icon: ShieldCheck, label: 'Enterprise Quality' },
            ].map((b, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-card border border-border/80 shadow-soft space-y-2">
                <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center mx-auto text-accent">
                  <b.icon className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-semibold text-foreground">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-28">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-accent bg-accent-soft px-4 py-1.5 rounded-full inline-block mb-3">
              Curated Pairings
            </span>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-bold tracking-tight">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {product && product.id && <ReviewsSection productId={Number(product.id)} />}
    </div>
  );
}
