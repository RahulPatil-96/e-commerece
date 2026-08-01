import { Link } from 'react-router-dom';
import { Star, Plus, ShoppingBag } from 'lucide-react';
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
 */

/**
 * @param {{ product: Product }} props
 */
export default function ProductCard({ product }) {
  const { addItem, mode } = useCart();
  const { toast } = useToast();

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

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary rounded-2xl shadow-soft group-hover:shadow-lift transition-all duration-500 group-hover:-translate-y-1">
        <Image
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          fittingType="fill"
        />
        {/* gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {product.featured && <FeaturedBadge />}
        {discount > 0 && (
          <span className="absolute top-3 right-3 bg-destructive text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md z-10">
            {discount}% OFF
          </span>
        )}
        <button
          onClick={handleAdd}
          className="absolute bottom-3 right-3 w-11 h-11 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-lift opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-accent hover:text-accent-foreground z-10"
          aria-label="Add to cart"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{product.category}</p>
          <div className="flex items-center gap-1">
            <Star className={`w-3 h-3 ${(product.rating || 0) > 0 ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
            <span className="text-[11px] font-medium text-muted-foreground">{(product.rating || 0).toFixed(1)}</span>
          </div>
        </div>
        <h3 className="font-display text-lg font-medium leading-snug group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="font-display text-lg font-semibold">₹{displayPrice.toLocaleString('en-IN')}</span>
          {mode === 'wholesale' && product.wholesale_price && (
            <span className="text-xs text-muted-foreground line-through">₹{product.price.toLocaleString('en-IN')}</span>
          )}
        </div>
        {mode === 'wholesale' && (product.bulk_min_qty || 0) > 1 && (
          <p className="text-[11px] text-accent font-medium tracking-wide pt-0.5 inline-flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" /> MOQ: {product.bulk_min_qty} units
          </p>
        )}
      </div>
    </Link>
  );
}

