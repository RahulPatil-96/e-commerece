import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';

const CATEGORIES = ['Notebooks', 'Pens', 'Desk', 'Art', 'Planners'];
const AUDIENCES = ['both', 'retail', 'wholesale'];

const EMPTY = {
  name: '', description: '', long_description: '', price: '', wholesale_price: '',
  category: 'Notebooks', audience: 'both', image_url: '', stock: '', sku: '',
  bulk_min_qty: 1, featured: false, tags: [],
  dimensions: '', material: '', weight: '', care_instructions: '', color: '',
  personalizable: false, customization_price: ''
};

export default function ProductManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    apiClient.entities.Product.list('-created_date', 200)
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setTagInput(''); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...EMPTY, ...p, price: p.price || '', wholesale_price: p.wholesale_price || '', stock: p.stock ?? '', bulk_min_qty: p.bulk_min_qty ?? 1, customization_price: p.customization_price ?? '', color: p.color || '', tags: p.tags || [] });
    setTagInput('');
    setModalOpen(true);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    await apiClient.entities.Product.delete(p.id);
    toast({ title: 'Product deleted' });
    fetchProducts();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      wholesale_price: form.wholesale_price ? Number(form.wholesale_price) : undefined,
      stock: Number(form.stock) || 0,
      bulk_min_qty: Number(form.bulk_min_qty) || 1,
      customization_price: form.personalizable ? Number(form.customization_price) || 0 : 0,
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
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-accent transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary animate-pulse rounded-sm" />)}</div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-sm">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Audience</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Wholesale</th>
                <th className="text-right px-4 py-3 font-medium">Stock</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm overflow-hidden bg-secondary shrink-0">
                        {p.image_url && <Image src={p.image_url} alt={p.name} className="w-full h-full object-cover" fittingType="fill" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <div className="flex gap-1.5">
                          {p.featured && <span className="text-[10px] text-accent font-medium">★ Featured</span>}
                          {p.personalizable && <span className="text-[10px] text-accent font-medium">✦ Personalizable</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.audience === 'wholesale' ? 'bg-accent/10 text-accent' : p.audience === 'retail' ? 'bg-secondary text-muted-foreground' : 'bg-secondary text-muted-foreground'}`}>{p.audience}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">₹{(p.price || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{p.wholesale_price ? `₹${p.wholesale_price.toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${(p.stock || 0) < 20 ? 'text-destructive' : (p.stock || 0) < 50 ? 'text-accent' : ''}`}>{p.stock ?? 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 hover:text-accent transition-colors" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p)} className="p-2 hover:text-destructive transition-colors" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-background border border-border rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-medium">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Long Description</label>
                <textarea rows={3} value={form.long_description} onChange={e => setForm({...form, long_description: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Image URL *</label>
                <input required value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="https://..." className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                {form.image_url && <div className="mt-2 w-20 h-24 rounded-sm overflow-hidden bg-secondary"><Image src={form.image_url} alt="preview" className="w-full h-full object-cover" fittingType="fill" /></div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price (₹) *</label>
                  <input required type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Wholesale Price (₹)</label>
                  <input type="number" min="0" value={form.wholesale_price} onChange={e => setForm({...form, wholesale_price: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Audience</label>
                  <select value={form.audience} onChange={e => setForm({...form, audience: e.target.value})} className="w-full px-3 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                    {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">SKU</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bulk Min Qty</label>
                  <input type="number" min="1" value={form.bulk_min_qty} onChange={e => setForm({...form, bulk_min_qty: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags</label>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag..." className="flex-1 px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                  <button type="button" onClick={addTag} className="px-4 py-2.5 bg-secondary rounded-sm text-sm">Add</button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map(t => (
                      <span key={t} className="text-xs bg-secondary px-2.5 py-1 rounded-full flex items-center gap-1">
                        {t}
                        <button type="button" onClick={() => setForm({...form, tags: form.tags.filter(x => x !== t)})}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4 accent-accent" />
                <span className="text-sm">Featured product (show as bestseller)</span>
              </label>

              {/* Personalization */}
              <div className="border border-border rounded-sm p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.personalizable} onChange={e => setForm({...form, personalizable: e.target.checked})} className="w-4 h-4 accent-accent" />
                  <span className="text-sm font-medium">Allow personalization (name, font, color)</span>
                </label>
                {form.personalizable && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Personalization surcharge (₹)</label>
                    <input type="number" min="0" value={form.customization_price} onChange={e => setForm({...form, customization_price: e.target.value})} placeholder="0" className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                )}
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Dimensions</label>
                  <input value={form.dimensions} onChange={e => setForm({...form, dimensions: e.target.value})} placeholder="e.g. 21 × 14.8 cm" className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Material</label>
                  <input value={form.material} onChange={e => setForm({...form, material: e.target.value})} placeholder="e.g. 120 GSM paper" className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Weight</label>
                  <input value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} placeholder="e.g. 320 g" className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Color</label>
                  <input value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="e.g. Navy" className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Care Instructions</label>
                <textarea rows={2} value={form.care_instructions} onChange={e => setForm({...form, care_instructions: e.target.value})} className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-border py-3 rounded-full text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}