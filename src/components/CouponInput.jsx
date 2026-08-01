import { useState } from 'react';
import { Tag, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

/**
 * Reusable coupon input component for cart/checkout.
 * @param {{ subtotal: number, mode: 'retail' | 'wholesale', onApply: (coupon: any) => void, onRemove: () => void, appliedCoupon: any | null }} props
 */
export default function CouponInput({ subtotal, mode = 'retail', onApply, onRemove, appliedCoupon }) {
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a coupon code.');
      return;
    }

    setApplying(true);
    setError('');

    try {
      // Validate the coupon first
      const coupon = await apiClient.entities.Coupon.validate(trimmed, mode, subtotal);

      if (!coupon) {
        setError('Coupon code not found or expired.');
        setApplying(false);
        return;
      }

      // Apply the coupon (increment usage count)
      await apiClient.entities.Coupon.apply(trimmed);
      onApply(coupon);
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply coupon.');
    } finally {
      setApplying(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-sm p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Coupon applied: <span className="font-mono">{appliedCoupon.code}</span>
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                {appliedCoupon.discount_type === 'percentage'
                  ? `${appliedCoupon.discount_value}% off`
                  : `₹${appliedCoupon.discount_value} off`}
                {appliedCoupon.description ? ` — ${appliedCoupon.description}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Remove coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Enter coupon code"
            maxLength={50}
            className="w-full pl-9 pr-3 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent uppercase tracking-wider"
            disabled={applying}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={applying || !code.trim()}
          className="px-4 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {applying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Enter a valid coupon code to get discounts on your order.
      </p>
    </div>
  );
}
