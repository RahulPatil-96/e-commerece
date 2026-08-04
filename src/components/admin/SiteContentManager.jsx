import { useEffect, useState } from 'react';
import { Loader2, Save, Plus, X } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  { key: 'shop_material_options', label: 'Shop Material Options', type: 'material_options' },
  { key: 'shop_color_swatches', label: 'Shop Color Swatches', type: 'color_swatches' },
  { key: 'gift_occasions', label: 'Gift Occasions', type: 'string_list' },
  { key: 'gift_packaging', label: 'Gift Packaging', type: 'packaging' },
  { key: 'b2b_benefits', label: 'B2B Benefits', type: 'b2b_benefits' },
  { key: 'b2b_tiers', label: 'B2B Pricing Tiers', type: 'b2b_tiers' },
  { key: 'about_values', label: 'About Page Values', type: 'about_values' },
  { key: 'about_stats', label: 'About Page Stats', type: 'about_stats' },
];

const EMPTY_ITEM = {
  material_options: { label: '', match: [] },
  color_swatches: { label: '', value: '#000000' },
  packaging: { id: '', label: '', price: 0, desc: '' },
  b2b_benefits: { icon: 'Tags', title: '', desc: '' },
  b2b_tiers: { qty: '', discount: '', desc: '' },
  about_values: { icon: 'Award', title: '', desc: '' },
  about_stats: { num: '', label: '' },
};

const LIGHT_COLORS = ['White', 'Beige', 'Silver', 'Gold'];

export default function SiteContentManager() {
  const { toast } = useToast();
  const [content, setContent] = useState(/** @type {Record<string, any[]>} */({}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(/** @type {Record<string, boolean>} */({}));
  const [activeSection, setActiveSection] = useState(SECTIONS[0].key);

  useEffect(() => {
    loadAllContent();
  }, []);

  async function loadAllContent() {
    setLoading(true);
    try {
      const data = await apiClient.entities.SiteContent.getAll();
      setContent(data);
    } catch (err) {
      toast({ title: 'Failed to load site content', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const getValue = (/** @type {string} */ key) => {
    const val = content[key];
    return Array.isArray(val) ? val : [];
  };

  const updateItem = (/** @type {string} */ sectionKey, /** @type {number} */ index, /** @type {string} */ field, /** @type {any} */ value) => {
    setContent(prev => {
      const arr = [...(Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [])];
      if (!arr[index]) return prev;
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [sectionKey]: arr };
    });
  };

  const addItem = (/** @type {string} */ sectionKey) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;
    const template = /** @type {Record<string, any>} */(EMPTY_ITEM)[section.type] || {};
    setContent(prev => ({
      ...prev,
      [sectionKey]: [...(Array.isArray(prev[sectionKey]) ? prev[sectionKey] : []), { ...template }],
    }));
  };

  const removeItem = (/** @type {string} */ sectionKey, /** @type {number} */ index) => {
    setContent(prev => ({
      ...prev,
      [sectionKey]: (Array.isArray(prev[sectionKey]) ? prev[sectionKey] : []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (/** @type {string} */ sectionKey) => {
    setSaving(prev => ({ ...prev, [sectionKey]: true }));
    try {
      await apiClient.entities.SiteContent.update(sectionKey, content[sectionKey] || []);
      toast({ title: `${SECTIONS.find(s => s.key === sectionKey)?.label} saved` });
    } catch (err) {
      toast({ title: 'Failed to save', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    } finally {
      setSaving(prev => ({ ...prev, [sectionKey]: false }));
    }
  };

  const renderColorSwatchPreview = (/** @type {string} */ color) => {
    if (!color) return '#ccc';
    const swatches = content['shop_color_swatches'];
    if (Array.isArray(swatches)) {
      const found = swatches.find(s => s.label === color);
      if (found) return found.value;
    }
    return '#ccc';
  };

  const isLightColor = (/** @type {string} */ colorName) => LIGHT_COLORS.includes(colorName);

  const renderSection = (/** @type {typeof SECTIONS[0]} */ section) => {
    const items = getValue(section.key);

    if (section.type === 'material_options') {
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-secondary/30 rounded-sm p-4">
              <div className="flex-1 space-y-2">
                <input
                  value={item.label || ''}
                  onChange={(e) => updateItem(section.key, i, 'label', e.target.value)}
                  placeholder="Label (e.g. Paper)"
                  className="w-full px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={(item.match || []).join(', ')}
                  onChange={(e) => updateItem(section.key, i, 'match', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Keywords to match (comma separated, e.g. paper, cardstock)"
                  className="w-full px-3 py-2 rounded-sm border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button onClick={() => removeItem(section.key, i)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === 'color_swatches') {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/30 rounded-sm p-3">
              <input
                type="color"
                value={item.value || '#000000'}
                onChange={(e) => updateItem(section.key, i, 'value', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border bg-background shrink-0"
              />
              <div className="flex-1 min-w-0">
                <input
                  value={item.label || ''}
                  onChange={(e) => updateItem(section.key, i, 'label', e.target.value)}
                  placeholder="Color name"
                  className="w-full px-2 py-1.5 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-1"
                />
                <input
                  value={item.value || ''}
                  onChange={(e) => updateItem(section.key, i, 'value', e.target.value)}
                  placeholder="#hex"
                  className="w-full px-2 py-1 rounded-sm border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button onClick={() => removeItem(section.key, i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === 'string_list') {
      return (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/30 rounded-sm px-4 py-2">
              <input
                value={typeof item === 'string' ? item : item.label || item.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setContent(prev => {
                    const arr = [...(Array.isArray(prev[section.key]) ? prev[section.key] : [])];
                    arr[i] = typeof item === 'string' ? val : { ...item, label: val, name: val };
                    return { ...prev, [section.key]: arr };
                  });
                }}
                placeholder="Enter value..."
                className="flex-1 px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button onClick={() => removeItem(section.key, i)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === 'packaging') {
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-secondary/30 rounded-sm p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    value={item.id || ''}
                    onChange={(e) => updateItem(section.key, i, 'id', e.target.value)}
                    placeholder="ID (e.g. classic)"
                    className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    value={item.label || ''}
                    onChange={(e) => updateItem(section.key, i, 'label', e.target.value)}
                    placeholder="Label (e.g. Classic Kraft)"
                    className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.price || 0}
                    onChange={(e) => updateItem(section.key, i, 'price', Number(e.target.value))}
                    placeholder="Price"
                    className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    value={item.desc || ''}
                    onChange={(e) => updateItem(section.key, i, 'desc', e.target.value)}
                    placeholder="Description"
                    className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <button onClick={() => removeItem(section.key, i)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === 'b2b_benefits' || section.type === 'about_values') {
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-secondary/30 rounded-sm p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={item.icon || ''}
                      onChange={(e) => updateItem(section.key, i, 'icon', e.target.value)}
                      placeholder="Icon name (e.g. Tags, Package)"
                      className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      value={item.title || ''}
                      onChange={(e) => updateItem(section.key, i, 'title', e.target.value)}
                      placeholder="Title"
                      className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <textarea
                    value={item.desc || ''}
                    onChange={(e) => updateItem(section.key, i, 'desc', e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="w-full px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>
                <button onClick={() => removeItem(section.key, i)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === 'b2b_tiers') {
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-secondary/30 rounded-sm p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input
                    value={item.qty || ''}
                    onChange={(e) => updateItem(section.key, i, 'qty', e.target.value)}
                    placeholder="Qty range (e.g. 50–199)"
                    className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    value={item.discount || ''}
                    onChange={(e) => updateItem(section.key, i, 'discount', e.target.value)}
                    placeholder="Discount (e.g. 15%)"
                    className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <input
                    value={item.desc || ''}
                    onChange={(e) => updateItem(section.key, i, 'desc', e.target.value)}
                    placeholder="Description"
                    className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <button onClick={() => removeItem(section.key, i)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.type === 'about_stats') {
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-secondary/30 rounded-sm p-4">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  value={item.num || ''}
                  onChange={(e) => updateItem(section.key, i, 'num', e.target.value)}
                  placeholder="Number/Stat (e.g. 12k+)"
                  className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  value={item.label || ''}
                  onChange={(e) => updateItem(section.key, i, 'label', e.target.value)}
                  placeholder="Label (e.g. Customers served)"
                  className="px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button onClick={() => removeItem(section.key, i)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-medium">Site Content Management</h2>
          <p className="text-sm text-muted-foreground">Manage all dynamic content across the store</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-1">
        {SECTIONS.map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-sm transition-colors ${
              activeSection === section.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Active section */}
      {SECTIONS.filter(s => s.key === activeSection).map(section => (
        <div key={section.key} className="bg-card border border-border rounded-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-base">{section.label}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => addItem(section.key)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </Button>
              <Button size="sm" onClick={() => handleSave(section.key)} disabled={saving[section.key]}>
                {saving[section.key] ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-3.5 h-3.5 mr-1" /> Save</>
                )}
              </Button>
            </div>
          </div>
          {getValue(section.key).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No items yet. Click "Add Item" to create one.</p>
          ) : (
            renderSection(section)
          )}
        </div>
      ))}
    </div>
  );
}
