import { Link } from 'react-router-dom';
import { Star, Plus } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';

export default function ProductCard({ product }) {
  const { addItem, mode } = useCart();
  const { toast } = useToast();

  const displayPrice = mode === 'wholesale'
    ? (product.wholesale_price || product.price)
    : product.price;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast({ title: 'Added to cart', description: product.name });
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary rounded-sm">
        <Image
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          fittingType="fill"
        />
        <button
          onClick={handleAdd}
          className="absolute bottom-3 right-3 w-10 h-10 bg-background/95 backdrop-blur rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-accent hover:text-accent-foreground"
          aria-label="Add to cart"
        >
          <Plus className="w-4 h-4" />
        </button>
        {product.featured && (
          <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Bestseller
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{product.category}</p>
        <h3 className="font-display text-lg font-medium leading-snug group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${i < Math.round(product.rating || 0) ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
            />
          ))}
        </div>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="font-display text-lg font-medium">₹{displayPrice.toLocaleString('en-IN')}</span>
          {mode === 'wholesale' && product.wholesale_price && (
            <span className="text-xs text-muted-foreground line-through">₹{product.price.toLocaleString('en-IN')}</span>
          )}
        </div>
        {mode === 'wholesale' && product.bulk_min_qty > 1 && (
          <p className="text-[11px] text-accent font-medium tracking-wide pt-0.5">MOQ: {product.bulk_min_qty} units</p>
        )}
      </div>
    </Link>
  );
}