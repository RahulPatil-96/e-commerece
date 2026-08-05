import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, FolderTree } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';

const EMPTY = {
  name: '',
  description: '',
  image_url: '',
  display_order: '',
};

export default function CategoryManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    apiClient.entities.Category.list()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchCategories, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image_url: cat.image_url || '',
      display_order: cat.display_order != null ? String(cat.display_order) : '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await apiClient.entities.Category.delete(cat.id);
      toast({ title: 'Category deleted' });
      fetchCategories();
    } catch {
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      display_order: form.display_order ? Number(form.display_order) : undefined,
    };
    try {
      if (editing) {
        await apiClient.entities.Category.update(editing.id, payload);
        toast({ title: 'Category updated' });
      } else {
        await apiClient.entities.Category.create(payload);
        toast({ title: 'Category created' });
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-card border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent shadow-soft"
          />
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-accent hover:text-accent-foreground transition-all shadow-lift"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-secondary animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cat) => (
            <div key={cat.id} className="bg-card border border-border/80 rounded-3xl p-6 shadow-soft hover:shadow-card transition-all flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-secondary border border-border/60 shrink-0">
                  {cat.image_url ? (
                    <Image src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" fittingType="fill" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-accent bg-accent-soft">
                      <FolderTree className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif-display font-bold text-base text-foreground truncate">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground font-light line-clamp-2 mt-0.5">{cat.description || 'No description'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                <span className="font-semibold text-muted-foreground">Order: #{cat.display_order ?? 0}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(cat)} className="p-2 hover:text-accent transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat)} className="p-2 hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="relative bg-card border border-border/80 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="font-serif-display text-xl font-bold">{editing ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Category Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Image URL</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="font-bold uppercase tracking-wider text-muted-foreground block mb-1">Display Order</label>
                <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-border/80 py-3 rounded-full font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground py-3 rounded-full font-semibold hover:bg-accent">{saving ? 'Saving...' : 'Save Category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
