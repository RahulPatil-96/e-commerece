import { useState } from 'react';
import { Repeat, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

/**
 * Reorder button for order history pages.
 * Adds all items from a previous order to the cart.
 * @param {{ items: Array<{ id: string | number, product_id?: string | number, name: string, qty: number, price: number, image_url?: string, customization?: any }>, orderType?: string }} props
 */
export default function ReorderButton({ items, orderType = 'retail' }) {
  const [reordering, setReordering] = useState(false);
  const { addItem, setMode } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleReorder = async () => {
    if (!items || items.length === 0) {
      toast({ title: 'Nothing to reorder', description: 'This order has no items.' });
      return;
    }

    setReordering(true);
    try {
      // Switch to the appropriate mode
      if (orderType === 'wholesale' || orderType === 'b2b' || orderType === 'bulk') {
        setMode('wholesale');
      } else {
        setMode('retail');
      }

      // Add each item to cart
      let addedCount = 0;
      for (const item of items) {
        try {
          const productPayload = {
            id: item.id || item.product_id,
            name: item.name,
            price: item.price,
            image_url: item.image_url || '',
            bulk_min_qty: 1,
          };

          const customData = item.customization || null;
          addItem(productPayload, item.qty, customData);
          addedCount++;
        } catch (itemError) {
          console.warn('Failed to add item to cart:', item.name, itemError);
        }
      }

      if (addedCount > 0) {
        toast({
          title: 'Items added to cart',
          description: `${addedCount} item${addedCount > 1 ? 's' : ''} from order added to your cart.`,
        });
        navigate('/cart');
      } else {
        toast({
          title: 'Could not reorder',
          description: 'Unable to add items to cart. They may be unavailable.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Reorder failed',
        description: error instanceof Error ? error.message : 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setReordering(false);
    }
  };

  return (
    <button
      onClick={handleReorder}
      disabled={reordering || !items?.length}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Add all items from this order to your cart"
    >
      {reordering ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Repeat className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Reorder</span>
    </button>
  );
}
