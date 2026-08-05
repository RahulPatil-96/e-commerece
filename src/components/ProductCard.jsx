import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import FeaturedBadge from '@/components/FeaturedBadge';

/**
 * @typedef {Object} Product
 * @property {string | number} id
 * @property {string} name
 * @property {string} [category]
 * @property {string} [image_url]
 * @property {number} price
 * @property {number} [wholesale_price]
 * @property {number} [bulk_min_qty]
 * @property {number} [rating]
 * @property {boolean} [featured]
 * @property {string} [material]
 */

/**
 * @param {{ product: Product }} props
 */
export default function ProductCard({ product }) {
  const { addItem, mode } = useCart();
  const { toast } = useToast();
  const [wished, setWished] = useState(false);

  const displayPrice = mode === 'wholesale'
    ? (product.wholesale_price || product.price)
    : product.price;

  const discount = mode === 'wholesale' && product.wholesale_price && product.price
    ? Math.round(((product.price - product.wholesale_price) / product.price) * 100)
    : 0;

  const handleAdd = (/** @type {React.MouseEvent<HTMLButtonElement>} */ e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      addItem(product, 1);
      toast({ title: 'Added to cart', description: product.name });
    } catch (err) {
      toast({ title: 'Cannot add to cart', description: err instanceof Error ? err.message : 'Please check minimum quantity.', variant: 'destructive' });
    }
  };

  const toggleWishlist = (/** @type {React.MouseEvent<HTMLButtonElement>} */ e) => {
    e.preventDefault();
    e.stopPropagation();
    setWished(!wished);
    toast({
      title: !wished ? 'Saved to Wishlist' : 'Removed from Wishlist',
      description: product.name,
    });
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      data-cursor-text="View"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary rounded-3xl border border-border/60 shadow-soft group-hover:shadow-lift transition-all duration-700 group-hover:-translate-y-1.5">
        <Image
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          fittingType="fill"
        />
        {/* Soft luxury dark gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div>{product.featured && <FeaturedBadge />}</div>
          <div className="flex items-center gap-2 pointer-events-auto">
            {discount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-md">
                {discount}% OFF
              </span>
            )}
            <button
              onClick={toggleWishlist}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-soft ${
                wished ? 'bg-accent text-white scale-105' : 'bg-white/80 text-foreground hover:bg-white'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${wished ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Add Button */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <span className="text-[10px] uppercase font-semibold tracking-widest text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
            Quick View
          </span>
          <button
            onClick={handleAdd}
            className="pointer-events-auto w-11 h-11 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-full flex items-center justify-center shadow-lift opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105 active:scale-95"
            aria-label="Add to cart"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-1.5 px-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{product.category || 'Stationery'}</span>
          <div className="flex items-center gap-1">
            <Star className={`w-3.5 h-3.5 ${(product.rating || 0) > 0 ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
            <span className="text-xs font-semibold text-foreground">{(product.rating || 4.8).toFixed(1)}</span>
          </div>
        </div>

        <h3 className="font-serif-display text-lg font-bold leading-snug tracking-tight group-hover:text-accent transition-colors text-foreground">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="font-serif-display text-lg font-bold text-foreground">₹{displayPrice.toLocaleString('en-IN')}</span>
          {mode === 'wholesale' && product.wholesale_price && (
            <span className="text-xs text-muted-foreground line-through">₹{product.price.toLocaleString('en-IN')}</span>
          )}
        </div>

        {mode === 'wholesale' && (product.bulk_min_qty || 0) > 1 && (
          <p className="text-[11px] text-accent font-semibold tracking-wide pt-0.5 inline-flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" /> MOQ: {product.bulk_min_qty} units
          </p>
        )}
      </div>
    </Link>
  );
}
