import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Pencil, Trash2, X, Search, Upload, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AUDIENCES = ['both', 'retail', 'wholesale'];

/** @typedef {{ id: string | number, name: string, description?: string, long_description?: string, price?: number, wholesale_price?: number, category?: string, audience?: string, image_url?: string, stock?: number, sku?: string, bulk_min_qty?: number, featured?: boolean, tags?: string[], dimensions?: string, material?: string, weight?: string, care_instructions?: string, color?: string, personalizable?: boolean, customization_price?: number, gallery?: string[], [key: string]: any }} Product */
/** @typedef {{ name: string, description: string, long_description: string, price: string, wholesale_price: string, category: string, audience: string, image_url: string, stock: string, sku: string, bulk_min_qty: number, featured: boolean, tags: string[], dimensions: string, material: string, weight: string, care_instructions: string, color: string, personalizable: boolean, customization_price: string, gallery: string[] }} ProductForm */

/** @type {ProductForm} */
const EMPTY = {
  name: '', description: '', long_description: '', price: '', wholesale_price: '',
  category: '', audience: 'both', image_url: '', stock: '', sku: '',
  bulk_min_qty: 1, featured: false, tags: [],
  dimensions: '', material: '', weight: '', care_instructions: '', color: '',
  personalizable: false, customization_price: '', gallery: []
};

/**
 * ImageUploadButton — file picker that uploads directly to ImageKit.
 * Falls back to URL input if ImageKit is not configured.
 */
function ImageUploadButton({ onUploaded, label = 'Upload Image', folder = '/products' }) {
  const { toast } = useToast();
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max image size is 10 MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const result = await apiClient.upload.toImageKit(file, folder);
      onUploaded(result.url);
      toast({ title: 'Image uploaded', description: 'Stored in ImageKit successfully.' });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not upload image.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-all disabled:opacity-60 shadow-glow"
    >
      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      {uploading ? 'Uploading…' : label}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </button>
  );
}

export default function ProductManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState(/** @type {Product[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(/** @type {Product | null} */ (null));
  const [form, setForm] = useState(/** @type {ProductForm} */ (EMPTY));
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState(/** @type {string[]} */ ([]));
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    Promise.all([
      apiClient.entities.Product.list('-created_date', 200),
      apiClient.entities.Category.list().catch(() => []),
    ])
      .then(([data, catList]) => {
        setProducts(Array.isArray(data) ? data : []);
        const cats = Array.isArray(catList) ? catList.map((c) => c.name).filter(Boolean) : [];
        setCategoryOptions(cats.length > 0 ? cats : []);
        if (cats.length > 0 && !form.category) {
          setForm(f => ({ ...f, category: cats[0] }));
        }
      })
      .catch(() => {
        setProducts([]);
        setCategoryOptions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setTagInput(''); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...EMPTY,
      ...p,
      price: p.price != null ? String(p.price) : '',
      wholesale_price: p.wholesale_price != null ? String(p.wholesale_price) : '',
      stock: p.stock != null ? String(p.stock) : '',
      bulk_min_qty: p.bulk_min_qty ?? 1,
      customization_price: p.customization_price != null ? String(p.customization_price) : '',
      color: p.color || '',
      tags: p.tags || [],
      gallery: p.gallery || [],
    });
    setTagInput('');
    setModalOpen(true);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await apiClient.entities.Product.delete(p.id);
      toast({ title: 'Product deleted' });
      fetchProducts();
    } catch (err) {
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const addNewCategory = async () => {
    if (!newCategoryInput.trim()) return;
    try {
      await apiClient.entities.Category.create({ name: newCategoryInput.trim() });
      setCategoryOptions([...categoryOptions, newCategoryInput.trim()]);
      setForm({ ...form, category: newCategoryInput.trim() });
      setNewCategoryInput('');
      toast({ title: 'Category created' });
    } catch (err) {
      toast({ title: 'Failed to create category', variant: 'destructive' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (!form.category) {
      toast({ title: 'Please select or create a category', variant: 'destructive' });
      setSaving(false);
      return;
    }
    // Bug 23: do NOT send slug — the server generates it
    const { slug: _slug, ...formWithoutSlug } = form;
    const payload = {
      ...formWithoutSlug,
      price: Number(form.price),
      wholesale_price: form.wholesale_price !== '' && form.wholesale_price !== null && form.wholesale_price !== undefined ? Number(form.wholesale_price) : null,
      stock: Number(form.stock) || 0,
      bulk_min_qty: Number(form.bulk_min_qty) || 1,
      customization_price: form.personalizable ? Number(form.customization_price) || 0 : 0,
      gallery: form.gallery || [],
    };
    try {
      let savedProduct;
      if (editing) {
        savedProduct = await apiClient.entities.Product.update(editing.id, payload);
        toast({ title: 'Product updated' });
      } else {
        savedProduct = await apiClient.entities.Product.create(payload);
        toast({ title: 'Product created' });
        setSearch('');
      }
      setProducts((current) => editing
        ? current.map((product) => product.id === savedProduct.id ? savedProduct : product)
        : [savedProduct, ...current.filter((product) => product.id !== savedProduct.id)]);
      setModalOpen(false);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const filtered = products.filter((product) =>
    String(product.name || '').toLowerCase().includes(searchTerm) ||
    String(product.sku || '').toLowerCase().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by title or SKU..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-card border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent shadow-soft"
          />
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all shadow-lift"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Luxury Data Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="overflow-x-auto border border-border/80 rounded-3xl bg-card shadow-soft">
          <table className="w-full text-xs min-w-[800px]">
            <thead className="bg-secondary/60 border-b border-border/60 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <tr>
                <th className="text-left px-5 py-4">Item Details</th>
                <th className="text-left px-5 py-4">Category</th>
                <th className="text-left px-5 py-4">Target Audience</th>
                <th className="text-right px-5 py-4">Retail Price</th>
                <th className="text-right px-5 py-4">Wholesale Rate</th>
                <th className="text-right px-5 py-4">Stock</th>
                <th className="text-center px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                        {p.image_url && <Image src={p.image_url} alt={p.name} className="w-full h-full object-cover" fittingType="fill" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-xs truncate">{p.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          {p.featured && <span className="text-[10px] text-accent font-bold">★ Bestseller</span>}
                          {p.personalizable && <span className="text-[10px] text-accent font-bold">✦ Personalizable</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-medium">{p.category}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary border border-border/60">
                      {p.audience}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-serif-display font-bold text-sm">₹{(p.price || 0).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground font-medium">
                    {p.wholesale_price ? `₹${p.wholesale_price.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] ${
                      (p.stock || 0) < 20 ? 'bg-destructive/10 text-destructive' : (p.stock || 0) < 50 ? 'bg-accent-soft text-accent' : 'text-foreground'
                    }`}>
                      {p.stock ?? 0} units
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 hover:text-accent transition-colors" aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-2 hover:text-destructive transition-colors" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground text-xs">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Add Modal */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div
            className="relative bg-card border border-border/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain shadow-lift animate-scale-in"
            data-lenis-prevent
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-serif-display text-xl font-bold">{editing ? 'Edit Catalog Item' : 'Add New Product'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">

              {/* Product Title */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Product Title *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>

              {/* Short Summary */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Short Summary</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>

              {/* Long Description */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Long Description</label>
                <textarea rows={3} value={form.long_description} onChange={e => setForm({...form, long_description: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
              </div>

              {/* Cover Image — ImageKit Upload */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-2">Main Cover Image *</label>
                <div className="flex items-start gap-3">
                  {/* Preview */}
                  <div className="w-24 h-28 rounded-2xl overflow-hidden bg-secondary border border-border/60 shrink-0 flex items-center justify-center">
                    {form.image_url ? (
                      <Image src={form.image_url} alt="preview" className="w-full h-full object-cover" fittingType="fill" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <ImageUploadButton
                      label="Upload from Device"
                      folder="/products/cover"
                      onUploaded={(url) => setForm({ ...form, image_url: url })}
                    />
                    <p className="text-muted-foreground text-[10px]">— or paste a URL —</p>
                    <input
                      value={form.image_url}
                      onChange={e => setForm({...form, image_url: e.target.value})}
                      placeholder="https://ik.imagekit.io/..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent text-[11px]"
                    />
                    {form.image_url && (
                      <a
                        href={form.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-accent hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> View full image
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-2">Gallery Images</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(form.gallery || []).map((url, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden bg-secondary border border-border/60">
                      <Image src={url} alt={`gallery-${idx}`} className="w-full h-full object-cover" fittingType="fill" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, gallery: (form.gallery || []).filter((_, i) => i !== idx) })}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        aria-label="Remove gallery image"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  {/* Upload new gallery image */}
                  <ImageUploadButton
                    label="Add Photo"
                    folder="/products/gallery"
                    onUploaded={(url) => setForm({ ...form, gallery: [...(form.gallery || []), url] })}
                  />
                </div>
                <p className="text-muted-foreground text-[10px]">Upload product photos directly — stored in ImageKit.</p>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Retail Price (₹) *</label>
                  <input required type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Wholesale Rate (₹)</label>
                  <input type="number" min="0" value={form.wholesale_price} onChange={e => setForm({...form, wholesale_price: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>

              {/* Category + Audience + Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Category *</label>
                  <Select value={form.category || undefined} onValueChange={val => setForm({...form, category: val})}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent className="z-[110]">
                      {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Audience</label>
                  <Select value={form.audience} onValueChange={val => setForm({...form, audience: val})}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[110]">
                      {AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Stock Units</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>

              {/* New Category */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Create New Category</label>
                <div className="flex gap-2">
                  <input
                    value={newCategoryInput}
                    onChange={e => setNewCategoryInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewCategory(); } }}
                    placeholder="e.g. Art Supplies"
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={addNewCategory}
                    className="px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* SKU + Bulk Min */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">SKU</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Bulk Min Qty</label>
                  <input type="number" min="1" value={form.bulk_min_qty} onChange={e => setForm({...form, bulk_min_qty: Number(e.target.value)})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>

              {/* Physical Attributes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Material</label>
                  <input value={form.material} onChange={e => setForm({...form, material: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Color</label>
                  <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Dimensions</label>
                  <input value={form.dimensions} onChange={e => setForm({...form, dimensions: e.target.value})} placeholder="e.g. 20×15×2 cm" className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Weight</label>
                  <input value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="e.g. 250g" className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>

              {/* Care Instructions */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Care Instructions</label>
                <input value={form.care_instructions} onChange={e => setForm({...form, care_instructions: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>

              {/* Tags */}
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {form.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-semibold">
                      {tag}
                      <button type="button" onClick={() => setForm({...form, tags: form.tags.filter((_, ti) => ti !== i)})} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add tag..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button type="button" onClick={addTag} className="px-4 py-2.5 rounded-2xl bg-secondary border border-border/80 font-semibold hover:bg-card transition-colors">Add</button>
                </div>
              </div>

              {/* Flags */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="rounded" />
                  <span className="font-bold uppercase tracking-wider text-muted-foreground">Featured / Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.personalizable} onChange={e => setForm({...form, personalizable: e.target.checked})} className="rounded" />
                  <span className="font-bold uppercase tracking-wider text-muted-foreground">Personalizable</span>
                </label>
              </div>
              {form.personalizable && (
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Customization Price (₹)</label>
                  <input type="number" min="0" value={form.customization_price} onChange={e => setForm({...form, customization_price: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border/60">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-border/80 py-3 rounded-full font-semibold hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:bg-accent transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
