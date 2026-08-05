import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search, Check, ChevronLeft, ChevronRight, PackageSearch, Sparkles } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import ProductCard from '@/components/ProductCard';
import PageMeta from '@/components/PageMeta';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [materialOptions, setMaterialOptions] = useState(/** @type {Array<{label: string, match: string[]}>} */([]));
  const [colorSwatches, setColorSwatches] = useState(/** @type {Record<string, string>} */({}));
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const { mode } = useCart();

  const activeCategory = searchParams.get('category') || 'All';
  const search = searchParams.get('search') || '';

  const LIGHT_COLORS = useMemo(() => {
    const light = ['White', 'Beige', 'Silver', 'Gold', 'Beige'];
    return Object.keys(colorSwatches).filter(c => light.includes(c));
  }, [colorSwatches]);

  useEffect(() => {
    Promise.all([
      apiClient.entities.SiteContent.getAll().catch(() => ({})),
      apiClient.entities.Category.list().catch(() => ([])),
    ])
      .then(([contentData, categoryList]) => {
        const catNames = new Set(Array.isArray(contentData.shop_categories) ? contentData.shop_categories : []);
        if (Array.isArray(categoryList)) {
          categoryList.forEach(c => { if (c.name) catNames.add(c.name); });
        }
        setAllCategories([...catNames]);
        if (Array.isArray(contentData.shop_material_options)) setMaterialOptions(contentData.shop_material_options);
        if (contentData.shop_color_swatches) setColorSwatches(contentData.shop_color_swatches);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory !== 'All') params.category = activeCategory;
    apiClient.entities.Product.filter(params, '-created_date', 200)
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
      materialOptions.forEach(m => {
        if (m.match.some(k => mat.includes(k))) set.add(m.label);
      });
    });
    return [...set];
  }, [products, materialOptions]);

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
          const opt = materialOptions.find(m => m.label === label);
          return opt ? opt.match.some(k => mat.includes(k)) : false;
        });
        if (!matches) return false;
      }
      if (selectedColors.length > 0 && !selectedColors.includes(p.color)) return false;
      return true;
    });
  }, [products, priceRange, selectedMaterials, selectedColors, materialOptions]);

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
    if (sort === 'price-low') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') arr.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'featured') arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return arr;
  }, [searched, sort]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sort, priceRange, selectedMaterials, selectedColors, activeCategory, search]);

  const setCategory = (/** @type {string} */ cat) => {
    const params = {};
    if (cat !== 'All') params.category = cat;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const updateSearch = (/** @type {string} */ q) => {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">Filter Catalog</h3>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="text-xs text-accent font-semibold hover:underline">Clear all</button>
        )}
      </div>

      {/* Category */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Categories</h4>
        <div className="space-y-1.5">
          {['All', ...allCategories].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`block w-full text-left px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'hover:bg-secondary text-foreground/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Price Range (₹)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={priceRange.min}
            onChange={(e) => setPriceRange(p => ({ ...p, min: e.target.value }))}
            placeholder="Min"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            min="0"
            value={priceRange.max}
            onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))}
            placeholder="Max"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-secondary border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            { label: 'Under ₹500', min: '', max: '500' },
            { label: '₹500–1000', min: '500', max: '1000' },
            { label: '₹1000+', min: '1000', max: '' },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => setPriceRange({ min: preset.min, max: preset.max })}
              className="text-[11px] px-3 py-1 rounded-full border border-border/80 hover:border-accent hover:text-accent font-medium transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Material */}
      {availableMaterials.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Material</h4>
          <div className="space-y-2">
            {availableMaterials.map(mat => (
              <button
                key={mat}
                onClick={() => toggleMaterial(mat)}
                className="flex items-center gap-3 w-full text-left group"
              >
                <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                  selectedMaterials.includes(mat) ? 'bg-accent border-accent text-white' : 'border-border group-hover:border-accent'
                }`}>
                  {selectedMaterials.includes(mat) && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">{mat}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color */}
      {availableColors.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Colors</h4>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(color => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                title={color}
                className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColors.includes(color) ? 'border-accent scale-110 ring-2 ring-accent/30' : 'border-border/80 hover:scale-105'
                }`}
                style={{ background: colorSwatches[color] || '#ccc' }}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <PageMeta title="Shop Luxury Stationery" description="Explore Arihant handcrafted notebooks, fountain pens, executive gift kits, and desk accessories." />

      {/* Page Header */}
      <div className="mb-12 space-y-3">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-semibold text-accent bg-accent-soft px-4 py-1.5 rounded-full border border-accent/20">
          <Sparkles className="w-3.5 h-3.5" /> Luxury Catalog
        </span>
        <h1 className="font-serif-display text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
          {activeCategory === 'All' ? 'Complete Collection' : activeCategory}
        </h1>
        <p className="text-muted-foreground font-light text-base sm:text-lg max-w-xl">
          Stationery designed with archival paper, precision binding, and luxury aesthetic finish.
        </p>

        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${
          mode === 'wholesale' ? 'bg-accent text-accent-foreground shadow-glow' : 'bg-secondary text-foreground'
        }`}>
          Active Pricing Mode: {mode === 'wholesale' ? 'Wholesale (Tiered Bulk Rates)' : 'Standard Retail'}
        </div>
      </div>

      {/* Horizontal Category Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 lg:hidden">
        {['All', ...allCategories].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === cat ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-card border border-border text-foreground/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-10">
        {/* Desktop Sidebar Filter */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-28">
            <div className="bg-card rounded-3xl border border-border/80 p-6 shadow-soft max-h-[calc(100vh-9rem)] overflow-y-auto thin-scrollbar">
              <FilterPanel />
            </div>
          </div>
        </aside>

        {/* Main Products Grid Area */}
        <div className="flex-1 min-w-0">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search notebooks, pens, leather accessories..."
                className="w-full pl-11 pr-10 py-3 rounded-full bg-card border border-border/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 shadow-soft"
              />
              {search && (
                <button onClick={() => updateSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <button
                onClick={() => setShowFilters(true)}
                className="md:hidden inline-flex items-center gap-2 text-xs font-semibold border border-border px-4 py-2.5 rounded-full bg-card shadow-soft"
              >
                <SlidersHorizontal className="w-4 h-4 text-accent" /> Filter
                {activeFilterCount > 0 && (
                  <span className="bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <p className="text-xs font-semibold text-muted-foreground hidden sm:block">{sorted.length} Products</p>

<div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Sort:</span>
                <Select value={sort} onValueChange={(val) => setSort(val)}>
                  <SelectTrigger className="w-auto min-w-[9rem] bg-card shadow-soft">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                    <SelectItem value="featured">Featured Collections</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Client Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {priceRange.min && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-soft text-accent px-3.5 py-1.5 rounded-full border border-accent/20">
                  Min ₹{priceRange.min}
                  <button onClick={() => setPriceRange(p => ({ ...p, min: '' }))}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}
              {priceRange.max && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-soft text-accent px-3.5 py-1.5 rounded-full border border-accent/20">
                  Max ₹{priceRange.max}
                  <button onClick={() => setPriceRange(p => ({ ...p, max: '' }))}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}
              {selectedMaterials.map(m => (
                <span key={m} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-soft text-accent px-3.5 py-1.5 rounded-full border border-accent/20">
                  {m}
                  <button onClick={() => toggleMaterial(m)}><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
              {selectedColors.map(c => (
                <span key={c} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-soft text-accent px-3.5 py-1.5 rounded-full border border-accent/20">
                  {c}
                  <button onClick={() => toggleColor(c)}><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-secondary animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-3xl border border-border/80 shadow-soft p-8 space-y-4">
              <PackageSearch className="w-16 h-16 text-muted-foreground/40 mx-auto" />
              <h3 className="font-serif-display text-2xl font-bold">No Products Found</h3>
              <p className="text-muted-foreground text-sm font-light">
                {search ? `No products match "${search}".` : 'Try clearing filters to view available inventory.'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-xs font-semibold shadow-soft hover:bg-accent transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 pt-8 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span>Show:</span>
                    {[20, 50, 100].map(n => (
                      <button
                        key={n}
                        onClick={() => {
                          setItemsPerPage(n);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          itemsPerPage === n ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-secondary'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2.5 rounded-full border border-border/80 disabled:opacity-40 hover:bg-secondary transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2.5 rounded-full border border-border/80 disabled:opacity-40 hover:bg-secondary transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilters(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-85 max-w-sm bg-card p-6 overflow-y-auto animate-slide-in-right border-l border-border/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
              <h3 className="font-serif-display text-xl font-bold">Catalog Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-2 rounded-full bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-8 bg-primary text-primary-foreground py-3.5 rounded-full text-xs font-semibold shadow-lift"
            >
              Apply Filters ({sorted.length} Items)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
