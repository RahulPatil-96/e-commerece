import { useEffect, useState } from 'react';
import { Plus, X, Loader2, AlertCircle, Save } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const DEFAULT_FONT = { label: '', value: '' };
const DEFAULT_COLOR = { label: '', value: '#000000' };

/**
 * @typedef {Object} FontOption
 * @property {string} label
 * @property {string} value
 * @typedef {Object} ColorOption
 * @property {string} label
 * @property {string} value
 * @typedef {Object} CustomizationRules
 * @property {boolean} [enabled]
 * @property {number} [maxLength]
 * @property {FontOption[]} [fonts]
 * @property {ColorOption[]} [colors]
 */

export default function CustomizationRulesManager() {
  /** @type {[CustomizationRules | null, import('react').Dispatch<import('react').SetStateAction<CustomizationRules | null>>]} */
  const [rules, setRules] = useState(/** @type {CustomizationRules | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    setError('');
    try {
      const data = /** @type {CustomizationRules} */ (await apiClient.entities.CustomizationRule.get());
      setRules(data);
    } catch (/** @type {any} */ err) {
      setError(err.message || 'Failed to load customization rules');
    } finally {
      setLoading(false);
    }
  }

  /**
   * @param {string} field
   * @param {unknown} value
   */
  function updateField(field, value) {
    setRules((prev) => ({ ...(prev ?? {}), [field]: value }));
  }

  function addFont() {
    setRules((prev) => ({
      ...(prev ?? {}),
      fonts: [...((prev?.fonts) || []), { ...DEFAULT_FONT }],
    }));
  }

  /**
   * @param {number} index
   * @param {string} field
   * @param {unknown} value
   */
  function updateFont(index, field, value) {
    setRules((prev) => {
      const fonts = [...((prev?.fonts) || [])];
      fonts[index] = { ...fonts[index], [field]: value };
      return { ...(prev ?? {}), fonts };
    });
  }

  /**
   * @param {number} index
   */
  function removeFont(index) {
    setRules((prev) => ({
      ...(prev ?? {}),
      fonts: ((prev?.fonts) || []).filter((/** @type {unknown} */ _, /** @type {number} */ i) => i !== index),
    }));
  }

  function addColor() {
    setRules((prev) => ({
      ...(prev ?? {}),
      colors: [...((prev?.colors) || []), { ...DEFAULT_COLOR }],
    }));
  }

  /**
   * @param {number} index
   * @param {string} field
   * @param {unknown} value
   */
  function updateColor(index, field, value) {
    setRules((prev) => {
      const colors = [...((prev?.colors) || [])];
      colors[index] = { ...colors[index], [field]: value };
      return { ...(prev ?? {}), colors };
    });
  }

  /**
   * @param {number} index
   */
  function removeColor(index) {
    setRules((prev) => ({
      ...(prev ?? {}),
      colors: ((prev?.colors) || []).filter((/** @type {unknown} */ _, /** @type {number} */ i) => i !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.entities.CustomizationRule.update(/** @type {import('@/api/apiClient').JsonObject} */ (rules));
      toast({
        title: 'Rules saved',
        description: 'Customization rules have been updated successfully.',
      });
    } catch (/** @type {any} */ err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save rules',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-3" />
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={loadRules} className="text-sm text-accent hover:underline mt-2">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-medium">Customization Rules</h2>
          <p className="text-sm text-muted-foreground">Manage fonts, colors, and limits for product personalization</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Enabled toggle */}
      <div className="bg-card border border-border rounded-sm p-5">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-medium text-sm">Enable Personalization</p>
            <p className="text-xs text-muted-foreground mt-0.5">Allow customers to personalize products</p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={rules?.enabled ?? true}
              onChange={(e) => updateField('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-muted rounded-full peer-checked:bg-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
          </div>
        </label>
      </div>

      {/* Max Length */}
      <div className="bg-card border border-border rounded-sm p-5">
        <label className="block">
          <p className="font-medium text-sm mb-1">Max Character Length</p>
          <p className="text-xs text-muted-foreground mb-3">Maximum number of characters allowed for personalization text</p>
          <input
            type="number"
            min={1}
            max={50}
            value={rules?.maxLength ?? 20}
            onChange={(e) => updateField('maxLength', parseInt(e.target.value, 10) || 1)}
            className="w-24 px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      {/* Fonts */}
      <div className="bg-card border border-border rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-sm">Font Options</p>
            <p className="text-xs text-muted-foreground mt-0.5">Available font choices for engraving</p>
          </div>
          <Button variant="outline" size="sm" onClick={addFont}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Font
          </Button>
        </div>
        <div className="space-y-3">
          {(rules?.fonts || []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No fonts configured. Click "Add Font" to create one.</p>
          ) : (
            (rules?.fonts || []).map((font, index) => (
              <div key={index} className="flex items-center gap-3 bg-secondary/30 rounded-sm px-3 py-2">
                <div className="flex-1">
                  <input
                    value={font.label}
                    onChange={(e) => updateFont(index, 'label', e.target.value)}
                    placeholder="Label (e.g. Serif)"
                    className="w-full px-2 py-1.5 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-1.5"
                  />
                  <input
                    value={font.value}
                    onChange={(e) => updateFont(index, 'value', e.target.value)}
                    placeholder="CSS font-family value (e.g. 'Georgia', serif)"
                    className="w-full px-2 py-1.5 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <button
                  onClick={() => removeFont(index)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  aria-label="Remove font"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Colors */}
      <div className="bg-card border border-border rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-sm">Color Options</p>
            <p className="text-xs text-muted-foreground mt-0.5">Available engraving colors</p>
          </div>
          <Button variant="outline" size="sm" onClick={addColor}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Color
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(rules?.colors || []).length === 0 ? (
            <div className="col-span-full text-sm text-muted-foreground py-4 text-center">No colors configured. Click "Add Color" to create one.</div>
          ) : (
            (rules?.colors || []).map((color, index) => (
              <div key={index} className="flex items-center gap-2 bg-secondary/30 rounded-sm px-3 py-2">
                <input
                  type="color"
                  value={color.value}
                  onChange={(e) => updateColor(index, 'value', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border bg-background shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <input
                    value={color.label}
                    onChange={(e) => updateColor(index, 'label', e.target.value)}
                    placeholder="Color name"
                    className="w-full px-2 py-1 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-1"
                  />
                  <input
                    value={color.value}
                    onChange={(e) => updateColor(index, 'value', e.target.value)}
                    placeholder="#hex"
                    className="w-full px-2 py-1 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <button
                  onClick={() => removeColor(index)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  aria-label="Remove color"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

