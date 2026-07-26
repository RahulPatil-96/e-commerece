import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search, Check } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import ProductCard from '@/components/ProductCard';
import PageMeta from '@/components/PageMeta';

const MATERIAL_OPTIONS = [
  { label: 'Paper', match: ['paper'] },
  { label: 'Leather', match: ['leather'] },
  { label: 'Wood', match: ['wood', 'walnut', 'beech'] },
  { label: 'Metal', match: ['aluminum', 'aluminium', 'metal', 'steel', 'brass', 'iron'] },
  { label: 'Plastic', match: ['plastic', 'acrylic'] },
  { label: 'Fabric', match: ['fabric', 'cotton', 'linen', 'canvas'] },
];

const COLOR_SWATCHES = {
  'Black': '#1a1a1a',
  'Brown': '#6B4423',
  'Blue': '#2C5F8A',
  'Navy': '#1B2845',
  'Green': '#3A6B47',
  'Beige': '#D4C5A0',
  'Burgundy': '#6B2C39',
  'Gold': '#C9A84C',
  'Silver': '#B8B8B8',
  'White': '#F5F5F0',
  'Multicolor': 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #ffe66d)',
};

const LIGHT_COLORS = ['White', 'Beige', 'Silver', 'Gold'];

export default function Shop() {
  const [products, setProducts] = useState(/** @type {any[]} */([]));
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedMaterials, setSelectedMaterials] = useState(/** @type {string[]} */([]));
  const [selectedColors, setSelectedColors] = useState(/** @type {string[]} */([]));
  const [allCategories, setAllCategories] = useState(/** @type {string[]} */([]));
  const { mode } = useCart();

  const activeCategory = searchParams.get('category') || 'All';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    // Fetch categories from API
    apiClient.entities.SiteContent.get('shop_categories')
      .then(data => {
        if (Array.isArray(data)) setAllCategories(data);
      })
      .catch(() => {
        // Fallback to empty — component works with just API data
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory !== 'All') params.category = activeCategory;
    apiClient.entities.Product.filter(params, '-created_date', 50)
      .then(data => {
        const allow = mode === 'wholesale' ? ['wholesale', 'both'] : ['retail', 'both'];
        setProducts(data.filter(/** @param {any} p */ (p) => allow.includes(p.audience || 'both')));
      })
      .finally(() => setLoading(false));
  }, [activeCategory, mode]);

  const availableMaterials = useMemo(() => {
    const set = new Set();
    products.forEach(/** @param {any} p */ (p) => {
      if (!p.material) return;
      const mat = p.material.toLowerCase();
      MATERIAL_OPTIONS.forEach(m => {
        if (m.match.some(k => mat.includes(k))) set.add(m.label);
      });
    });
    return [...set];
  }, [products]);

  const availableColors = useMemo(() => {
    const set = new Set();
    products.forEach(/** @param {any} p */ (p) => { if (p.color) set.add(p.color); });
    return [...set];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(/** @param {any} p */ (p) => {
      if (priceRange.min && p.price < Number(priceRange.min)) return false;
      if (priceRange.max && p.price > Number(priceRange.max)) return false;
      if (selectedMaterials.length > 0) {
        const mat = (p.material || '').toLowerCase();
        const matches = selectedMaterials.some(label => {
          const opt = MATERIAL_OPTIONS.find(m => m.label === label);
          return opt ? opt.match.some(k => mat.includes(k)) : false;
        });
        if (!matches) return false;
      }
      if (selectedColors.length > 0 && !selectedColors.includes(p.color)) return false;
      return true;
    });
  }, [products, priceRange, selectedMaterials, selectedColors]);

  const searched = useMemo(() => {
    if (!search.trim()) return filtered;
    const q = search.toLowerCase();
    return filtered.filter(/** @param {any} p */ (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.tags || []).some(/** @param {string} t */ (t) => t.toLowerCase().includes(q))
    );
  }, [filtered, search]);

  const sorted = useMemo(() => {
    const arr = [...searched];
    if (sort === 'price-low') arr.sort((/** @type {any} */ a, /** @type {any} */ b) => a.price - b.price);
    else if (sort === 'price-high') arr.sort((/** @type {any} */ a, /** @type {any} */ b) => b.price - a.price);
    else if (sort === 'rating') arr.sort((/** @type {any} */ a, /** @type {any} */ b) => (b.rating || 0) - (a.rating || 0));
    return arr;
  }, [searched, sort]);

  const setCategory = (/** @type {string} */ cat) => {
    /** @type {Record<string, string>} */
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const updateSearch = (/** @type {string} */ q) => {
    /** @type {Record<string, string>} */
    const params = {};
    if (activeCategory !== 'All') params.category = activeCategory;
    if (q) params.search = q;
    setSearchParams(params);
  };

  const toggleMaterial = (/** @type {string} */ label) => {
    setSelectedMaterials(prev => prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]);
  };

  const toggleColor = (/** @type {string} */ color) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const clearAllFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedMaterials([]);
    setSelectedColors([]);
  };

  const activeFilterCount = (priceRange.min ? 1 : 0) + (priceRange.max ? 1 : 0) + selectedMaterials.length + selectedColors.length;

  const FilterPanel = () => (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Filters</h3>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="text-xs text-accent hover:underline">Clear all</button>
        )}
      </div>

      {/* Category */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Category</h4>
        <div className="space-y-1.5">
          {['All', ...allCategories].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`block w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground/80'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={priceRange.min}
            onChange={(e) => setPriceRange(p => ({ ...p, min: e.target.value }))}
            placeholder="Min"
            className="w-full px-3 py-2 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            min="0"
            value={priceRange.max}
            onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))}
            placeholder="Max"
            className="w-full px-3 py-2 rounded-sm bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {[
            { label: 'Under ₹500', min: '', max: '500' },
            { label: '₹500–1000', min: '500', max: '1000' },
            { label: '₹1000+', min: '1000', max: '' },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => setPriceRange({ min: preset.min, max: preset.max })}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Material */}
      {availableMaterials.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Material</h4>
          <div className="space-y-1.5">
            {availableMaterials.map(mat => (
              <button
                key={mat}
                onClick={() => toggleMaterial(mat)}
                className="flex items-center gap-2.5 w-full text-left group"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedMaterials.includes(mat) ? 'bg-accent border-accent' : 'border-border group-hover:border-accent'}`}>
                  {selectedMaterials.includes(mat) && <Check className="w-3 h-3 text-accent-foreground" />}
                </span>
                <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{mat}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color */}
      {availableColors.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">Color</h4>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(color => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                title={color}
                className={`relative w-8 h-8 rounded-full border-2 transition-all ${selectedColors.includes(color) ? 'border-accent scale-110 ring-2 ring-accent/20' : 'border-border hover:scale-105'}`}
                style={{ background: /** @type {Record<string, string>} */ (COLOR_SWATCHES)[color] || '#ccc' }}
              >
                {selectedColors.includes(color) && (
                  <Check className={`w-3.5 h-3.5 absolute inset-0 m-auto ${LIGHT_COLORS.includes(color) ? 'text-black' : 'text-white'}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <PageMeta title="Shop" description="Browse the full Lekha stationery collection with filters for category, price, material, and color." />
      {/* Header */}
      <div className="mb-10">
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Catalogue</span>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mt-3 tracking-tight">
          {activeCategory === 'All' ? 'All Products' : activeCategory}
        </h1>
        <p className="text-muted-foreground mt-3 text-base font-light">Discover stationery crafted with intention.</p>
        <div className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${mode === 'wholesale' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
          Shopping in {mode === 'wholesale' ? 'Wholesale' : 'Retail'} mode
          {mode === 'wholesale' && ' · bulk pricing active'}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search by name, category, or tag..."
                className="w-full pl-10 pr-10 py-2.5 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              />
              {search && (
                <button onClick={() => updateSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="md:hidden inline-flex items-center gap-2 text-sm font-medium border border-border px-4 py-2 rounded-full"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {activeFilterCount > 0 && <span className="bg-accent text-accent-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
              </button>
              <p className="text-sm text-muted-foreground hidden sm:block">{sorted.length} products</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-sm border border-border bg-card rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {priceRange.min && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                  Min ₹{priceRange.min}
                  <button onClick={() => setPriceRange(p => ({ ...p, min: '' }))}><X className="w-3 h-3" /></button>
                </span>
              )}
              {priceRange.max && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                  Max ₹{priceRange.max}
                  <button onClick={() => setPriceRange(p => ({ ...p, max: '' }))}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedMaterials.map(m => (
                <span key={m} className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                  {m}
                  <button onClick={() => toggleMaterial(m)}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {selectedColors.map(c => (
                <span key={c} className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                  {c}
                  <button onClick={() => toggleColor(c)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary animate-pulse rounded-sm" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">{search ? `No products match "${search}".` : 'No products found with these filters.'}</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="mt-4 text-sm text-accent hover:underline">Clear all filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sorted.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-background p-6 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-medium">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium"
            >
              Show {sorted.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}