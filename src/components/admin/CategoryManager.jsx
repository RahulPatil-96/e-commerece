import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = {
  name: '',
  description: '',
  image_url: '',
  display_order: '',
};

export default function CategoryManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState(/** @type {Array<{id: string|number, name: string, description?: string, slug?: string, image_url?: string, display_order?: number}>} */([]));
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(/** @type {{id: string|number, name: string, description?: string, image_url?: string, display_order?: number} | null} */(null));
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

  const openEdit = (/** @type {{id: string|number, name: string, description?: string, image_url?: string, display_order?: number}} */ cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image_url: cat.image_url || '',
      display_order: cat.display_order != null ? String(cat.display_order) : '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (/** @type {{id: string|number, name: string}} */ cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await apiClient.entities.Category.delete(cat.id);
      toast({ title: 'Category deleted' });
      fetchCategories();
    } catch {
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    }
  };

  const handleSave = async (/** @type {React.FormEvent<HTMLFormElement>} */ e) => {
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

  const filtered = categories.filter(
    (cat) =>
      cat.name?.toLowerCase().includes(search.toLowerCase()) ||
      cat.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-secondary animate-pulse rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-sm">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-center px-4 py-3 font-medium">Order</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate">{cat.name}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    {cat.slug}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                    {cat.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">{cat.display_order || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-2 hover:text-accent transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 hover:text-destructive transition-colors"
                        aria-label="Delete"
                      >
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-background border border-border rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-medium">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Image URL
                </label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-border py-3 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
