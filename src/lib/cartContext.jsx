import { createContext, useContext, useState, useCallback, useEffect } from 'react';

/** @typedef {{ id: string | number, name: string, slug?: string, image_url?: string, price?: number, wholesale_price?: number, bulk_min_qty?: number, customization?: any, customization_price?: number, qty: number, lineId: string | number, [key: string]: any }} CartItem */
/** @typedef {{ items: CartItem[], addItem: (product: any, qty?: number, customization?: any) => void, removeItem: (lineId: string | number) => void, updateQty: (lineId: string | number, qty: number) => void, clearCart: () => void, count: number, subtotal: number, mode: 'retail' | 'wholesale', setMode: (mode: 'retail' | 'wholesale') => void, itemPrice: (item: CartItem) => number }} CartContextValue */

/** @type {React.Context<CartContextValue | null>} */
const CartContext = createContext(/** @type {CartContextValue | null} */ (null));

const STORAGE_KEY = 'arihant_cart';
const MODE_KEY = 'arihant_mode';

/**
 * @returns {'retail' | 'wholesale'}
 */
function getInitialMode() {
  try {
    return localStorage.getItem(MODE_KEY) === 'wholesale' ? 'wholesale' : 'retail';
  } catch {
    return 'retail';
  }
}

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function CartProvider({ children }) {
  /** @type {[CartItem[], import('react').Dispatch<import('react').SetStateAction<CartItem[]>>]} */
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      // Migrate legacy items that lack a lineId
      return parsed.map(/** @param {any} i */ (i) => ({ ...i, lineId: i.lineId || i.id }));
    } catch {
      return [];
    }
  });

  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const addItem = useCallback((/** @type {any} */ product, /** @type {number} */ qty = 1, /** @type {any} */ customization = null) => {
    // Enforce MOQ check for wholesale
    if (mode === 'wholesale' && product.bulk_min_qty && qty < product.bulk_min_qty) {
      throw new Error(`Minimum order quantity for this product is ${product.bulk_min_qty} units`);
    }

    setItems(prev => {
      const lineId = customization
        ? `${product.id}__${customization.name}__${customization.font}__${customization.color}`
        : product.id;
      const existing = prev.find(i => i.lineId === lineId);

      if (existing) {
        const newQty = existing.qty + qty;
        // Re-check MOQ after update
        if (mode === 'wholesale' && product.bulk_min_qty && newQty < product.bulk_min_qty) {
          throw new Error(`Minimum order quantity for this product is ${product.bulk_min_qty} units`);
        }
        return prev.map(i =>
          i.lineId === lineId ? { ...i, qty: newQty } : i
        );
      }

      return [...prev, {
        lineId,
        id: product.id,
        name: product.name,
        slug: product.slug,
        image_url: product.image_url,
        price: product.price,
        wholesale_price: product.wholesale_price,
        bulk_min_qty: product.bulk_min_qty || 1,
        customization,
        customization_price: customization && product.customization_price ? product.customization_price : 0,
        qty
      }];
    });
  }, [mode]);

  const removeItem = useCallback((/** @type {string | number} */ lineId) => {
    setItems(prev => prev.filter(i => i.lineId !== lineId));
  }, []);

  const updateQty = useCallback((/** @type {string | number} */ lineId, /** @type {number} */ qty) => {
    if (qty < 1) return;

    setItems(prev => {
      const item = prev.find(i => i.lineId === lineId);
      // Enforce MOQ check for wholesale when updating quantity
      if (mode === 'wholesale' && item && item.bulk_min_qty && qty < item.bulk_min_qty) {
        throw new Error(`Minimum order quantity for this product is ${item.bulk_min_qty} units`);
      }
      return prev.map(i => i.lineId === lineId ? { ...i, qty } : i);
    });
  }, [mode]);

  const clearCart = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, i) => sum + i.qty, 0);

  const itemPrice = (/** @type {CartItem} */ item) => {
    const base = mode === 'wholesale'
      ? (item.wholesale_price || item.price || 0)
      : (item.price || 0);
    return base + (item.customization_price || 0);
  };

  const subtotal = items.reduce((sum, i) => sum + itemPrice(i) * i.qty, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      count, subtotal, mode, setMode, itemPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

