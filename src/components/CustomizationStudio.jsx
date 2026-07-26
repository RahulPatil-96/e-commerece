import { useEffect, useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

const DEFAULT_FONTS = [
  { label: 'Serif', value: "'Fraunces', serif" },
  { label: 'Modern', value: "'Inter', sans-serif" },
  { label: 'Script', value: "'Brush Script MT', cursive" },
  { label: 'Mono', value: "ui-monospace, monospace" },
];

const DEFAULT_COLORS = [
  { label: 'Black', value: '#1a1612' },
  { label: 'Gold', value: '#c08a3e' },
  { label: 'Silver', value: '#9a9a9a' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Burgundy', value: '#7a2e3a' },
  { label: 'Forest', value: '#2d5a3d' },
];

/**
 * @typedef {Object} CustomizationRules
 * @property {boolean} enabled
 * @property {number} maxLength
 * @property {{ label: string, value: string }[]} fonts
 * @property {{ label: string, value: string }[]} colors
 */

/**
 * @param {Object} props
 * @param {{ customization_price?: number }} props.product
 * @param {{ name?: string, font?: string, color?: string }} props.customization
 * @param {(prev: any) => any} props.setCustomization
 */
export default function CustomizationStudio({ product, customization, setCustomization }) {
  /** @type {[CustomizationRules | null, import('react').Dispatch<import('react').SetStateAction<CustomizationRules | null>>]} */
  const [rules, setRules] = useState(/** @type {CustomizationRules | null} */ (null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.entities.CustomizationRule.get()
      .then((/** @type {any} */ data) => setRules(/** @type {CustomizationRules} */(data)))
      .catch(() => {
        // Fall back to defaults
        setRules({ fonts: DEFAULT_FONTS, colors: DEFAULT_COLORS, maxLength: 20, enabled: true });
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * @param {string} field
   * @param {unknown} value
   */
  const update = (field, value) => setCustomization((/** @type {any} */ prev) => ({ ...(prev ?? {}), [field]: value }));
  const cost = (/** @type {any} */ (product)).customization_price || 0;
  const fonts = rules?.fonts || DEFAULT_FONTS;
  const colors = rules?.colors || DEFAULT_COLORS;
  const maxLength = rules?.maxLength || 20;
  const enabled = rules?.enabled !== false;

  if (!enabled) return null;

  if (loading) {
    return (
      <div className="border border-accent/30 rounded-sm p-5 bg-accent/5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="border border-accent/30 rounded-sm p-5 space-y-5 bg-accent/5">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-accent" />
        <h3 className="font-display text-lg font-medium">Personalize This Item</h3>
        {cost > 0 && <span className="text-xs text-muted-foreground ml-auto">+₹{cost} per item</span>}
      </div>

      <div>
        <label className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Name / Initials</label>
        <input
          value={customization.name || ''}
          onChange={(e) => update('name', e.target.value)}
          maxLength={maxLength}
          placeholder={`Enter name or initials (max ${maxLength} chars)...`}
          className="w-full px-4 py-2.5 rounded-sm bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Font Style</label>
        <div className="grid grid-cols-4 gap-2">
          {fonts.map((/** @type {{ label: string, value: string }} */ f) => (
            <button
              key={f.label}
              onClick={() => update('font', f.value)}
              className={`py-2.5 rounded-sm border text-base transition-all ${customization.font === f.value ? 'border-accent bg-accent/10' : 'border-border hover:border-foreground/30'}`}
              style={{ fontFamily: f.value }}
              title={f.label}
            >
              Aa
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Engraving Color</label>
        <div className="flex gap-2.5 flex-wrap">
          {colors.map((/** @type {{ label: string, value: string }} */ c) => (
            <button
              key={c.label}
              onClick={() => update('color', c.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${customization.color === c.value ? 'border-accent scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: c.value }}
              title={c.label}
              aria-label={c.label}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        A live preview is shown on the product image. {cost > 0 ? `Personalization adds ₹${cost} per item.` : 'Personalization is complimentary.'}
      </p>
    </div>
  );
}
