import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
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

  const addGalleryImage = () => {
    const url = prompt('Enter image URL:');
    if (url?.trim()) {
      setForm({ ...form, gallery: [...(form.gallery || []), url.trim()] });
    }
  };

  const removeGalleryImage = (idx) => {
    setForm({ ...form, gallery: (form.gallery || []).filter((_, i) => i !== idx) });
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
    const payload = {
      ...form,
      price: Number(form.price),
      wholesale_price: form.wholesale_price !== '' && form.wholesale_price !== null && form.wholesale_price !== undefined ? Number(form.wholesale_price) : null,
      stock: Number(form.stock) || 0,
      bulk_min_qty: Number(form.bulk_min_qty) || 1,
      customization_price: form.personalizable ? Number(form.customization_price) || 0 : 0,
      gallery: form.gallery || [],
      slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    try {
      if (editing) {
        await apiClient.entities.Product.update(editing.id, payload);
        toast({ title: 'Product updated' });
      } else {
        await apiClient.entities.Product.create(payload);
        toast({ title: 'Product created' });
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

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
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div
            className="relative bg-card border border-border/80 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lift animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border/60 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-serif-display text-xl font-bold">{editing ? 'Edit Catalog Item' : 'Add New Product'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Product Title *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Short Summary</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Long Description</label>
                <textarea rows={3} value={form.long_description} onChange={e => setForm({...form, long_description: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Main Cover Image URL *</label>
                <input required value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                {form.image_url && <div className="mt-2 w-20 h-24 rounded-xl overflow-hidden bg-secondary border border-border/60"><Image src={form.image_url} alt="preview" className="w-full h-full object-cover" fittingType="fill" /></div>}
              </div>

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

              <div className="grid grid-cols-3 gap-4">
<div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Category *</label>
                  <Select value={form.category || undefined} onValueChange={val => setForm({...form, category: val})}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
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
                    <SelectContent>
                      {AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Stock Units</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-border/80 py-3 rounded-full font-semibold hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:bg-accent transition-colors disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
