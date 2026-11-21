import { useEffect, useRef, useState } from 'react';
import { Save, Plus, X, Upload, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';

const SECTIONS = [
  { key: 'home_banner', label: 'Homepage Banner', type: 'home_banner' },
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

export default function SiteContentManager() {
  const { toast } = useToast();
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
  const bannerFileRef = useRef(null);

  useEffect(() => {
    loadAllContent();
  }, []);

  async function loadAllContent() {
    setLoading(true);
    try {
      const data = await apiClient.entities.SiteContent.getAll();
      setContent(data || {});
    } catch (err) {
      toast({ title: 'Failed to load site content', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const getValue = (key) => {
    const val = content[key];
    return Array.isArray(val) ? val : [];
  };

  const updateItem = (sectionKey, index, field, value) => {
    setContent(prev => {
      const arr = [...(Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [])];
      if (!arr[index]) return prev;
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [sectionKey]: arr };
    });
  };

  const addItem = (sectionKey) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;
    const template = EMPTY_ITEM[section.type] || {};
    setContent(prev => {
      const arr = [...(Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [])];
      return { ...prev, [sectionKey]: [...arr, { ...template }] };
    });
  };

  const removeItem = (sectionKey, index) => {
    setContent(prev => {
      const arr = [...(Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [])];
      arr.splice(index, 1);
      return { ...prev, [sectionKey]: arr };
    });
  };

  const handleSaveSection = async (key) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const value = key === 'home_banner' ? content[key] || {} : getValue(key);
      await apiClient.entities.SiteContent.update(key, value);
      toast({ title: 'Saved successfully', description: `${key} updated.` });
    } catch (err) {
      toast({ title: 'Failed to save', description: err instanceof Error ? err.message : 'Error updating content', variant: 'destructive' });
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-secondary animate-pulse rounded-3xl" />)}</div>;
  }

  const currentSection = SECTIONS.find(s => s.key === activeSection) || SECTIONS[0];
  const currentItems = getValue(currentSection.key);
  const banner = content.home_banner || { type: 'image', url: '' };
  const updateBanner = (field, value) => {
    setContent(prev => ({
      ...prev,
      home_banner: { ...(prev.home_banner || { type: 'image', url: '' }), [field]: value },
    }));
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({ title: 'Invalid file type', description: 'Choose an image or video file.', variant: 'destructive' });
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const result = await apiClient.upload.toImageKit(file, '/banners');
      updateBanner('url', result.url);
      updateBanner('type', file.type.startsWith('video/') ? 'video' : 'image');
      toast({ title: 'Banner uploaded', description: 'The media is ready to save.' });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not upload banner media.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation pills */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-secondary/60 border border-border/80 overflow-x-auto no-scrollbar shadow-soft">
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === sec.key ? 'bg-primary text-primary-foreground shadow-lift' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Content Editor Panel */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div>
            <h2 className="font-serif-display text-2xl font-bold text-foreground">{currentSection.label}</h2>
            <p className="text-xs text-muted-foreground">
              {currentSection.type === 'home_banner' ? (banner.url ? 'Banner media configured' : 'No banner media configured') : `${currentItems.length} items configured`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentSection.type !== 'home_banner' && (
              <button
                onClick={() => addItem(currentSection.key)}
                className="inline-flex items-center gap-2 border border-border/80 bg-secondary px-4 py-2 rounded-full text-xs font-semibold hover:bg-card transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            )}
            <button
              onClick={() => handleSaveSection(currentSection.key)}
              disabled={saving[currentSection.key]}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent/90 transition-all shadow-glow"
            >
              <Save className="w-4 h-4" /> {saving[currentSection.key] ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {currentSection.type === 'home_banner' ? (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Add an image or muted looping video to the background of the homepage hero. Leave the URL empty and save to remove it.
            </p>
            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <input
                type="url"
                value={banner.url || ''}
                onChange={(event) => updateBanner('url', event.target.value)}
                placeholder="Paste an image or video URL"
                aria-label="Homepage banner media URL"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => bannerFileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-secondary border border-border/80 text-xs font-semibold hover:bg-card transition-colors disabled:opacity-60"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload image or video'}
              </button>
              <input
                ref={bannerFileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </div>
            <label className="block max-w-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Media type</span>
              <select
                value={banner.type || 'image'}
                onChange={(event) => updateBanner('type', event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
            {banner.url && (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-secondary">
                {banner.type === 'video' ? (
                  <video src={banner.url} controls muted playsInline className="max-h-64 w-full object-contain" />
                ) : (
                  <img src={banner.url} alt="Homepage banner preview" className="max-h-64 w-full object-contain" />
                )}
              </div>
            )}
          </div>
        ) : (
        <div className="space-y-4">
          {currentItems.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-secondary/40 border border-border/40 space-y-3 relative group">
              <button
                onClick={() => removeItem(currentSection.key, idx)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {currentSection.type === 'string_list' ? (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Occasion Label</label>
                  <input
                    value={typeof item === 'string' ? item : item?.label || ''}
                    onChange={(e) => {
                      setContent(prev => {
                        const arr = [...(Array.isArray(prev[currentSection.key]) ? prev[currentSection.key] : [])];
                        arr[idx] = e.target.value;
                        return { ...prev, [currentSection.key]: arr };
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  {Object.keys(item).map((field) => (
                    <div key={field}>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">{field}</label>
                      <input
                        value={item[field] || ''}
                        onChange={(e) => updateItem(currentSection.key, idx, field, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-card border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
