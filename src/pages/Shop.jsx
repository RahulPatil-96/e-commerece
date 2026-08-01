import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search, Check, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useCart } from '@/lib/cartContext';
import ProductCard from '@/components/ProductCard';
import PageMeta from '@/components/PageMeta';

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
  const [contentLoading, setContentLoading] = useState(true);
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
    // Fetch site content & categories from API
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
      })
      .finally(() => setContentLoading(false));
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
    else if (sort === 'featured') arr.sort((/** @type {any} */ a, /** @type {any} */ b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return arr;
  }, [searched, sort]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage, itemsPerPage]);

  // Reset to page 1 when filters/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sort, priceRange, selectedMaterials, selectedColors, activeCategory, search]);

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
              className={`block w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all ${activeCategory === cat ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-secondary text-foreground/80'}`}
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
            className="w-full px-3 py-2.5 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            min="0"
            value={priceRange.max}
            onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))}
            placeholder="Max"
            className="w-full px-3 py-2.5 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
                <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${selectedMaterials.includes(mat) ? 'bg-accent border-accent' : 'border-border group-hover:border-accent'}`}>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <PageMeta title="Shop" description="Browse the full Arihant stationery collection with filters for category, price, material, and color." />
      {/* Header */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-accent bg-accent-soft px-4 py-1.5 rounded-full">
          <Search className="w-3 h-3" /> Catalogue
        </span>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mt-3 tracking-tight">
          {activeCategory === 'All' ? 'All Products' : activeCategory}
        </h1>
        <p className="text-muted-foreground mt-3 text-base font-light">Discover stationery crafted with intention.</p>
        <div className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${mode === 'wholesale' ? 'bg-accent text-accent-foreground shadow-glow' : 'bg-secondary text-muted-foreground'}`}>
          Shopping in {mode === 'wholesale' ? 'Wholesale' : 'Retail'} mode
          {mode === 'wholesale' && ' · bulk pricing active'}
        </div>
      </div>

      {/* Category pills (mobile-friendly) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 lg:hidden">
        {['All', ...allCategories].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${activeCategory === cat ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card border border-border text-foreground/70'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="sticky top-28">
            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain pr-2 -mr-2 thin-scrollbar">
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <FilterPanel />
              </div>
            </div>
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
                className="w-full pl-10 pr-10 py-2.5 rounded-full bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all shadow-soft"
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
                className="md:hidden inline-flex items-center gap-2 text-sm font-medium border border-border px-4 py-2 rounded-full bg-card shadow-soft"
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
                  className="text-sm border border-border/60 bg-card rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer shadow-soft"
                >
                  <option value="newest">Newest</option>
                  <option value="featured">Featured</option>
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
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary animate-pulse rounded-2xl" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border/60 shadow-soft">
              <PackageSearch className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{search ? `No products match "${search}".` : 'No products found with these filters.'}</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="mt-4 text-sm text-accent hover:underline">Clear all filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {paginatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination Controls */}
              <div className="mt-10 border-t border-border pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Show per page:</span>
                    <div className="flex gap-2">
                      {[20, 50, 100].map(n => (
                        <button
                          key={n}
                          onClick={() => {
                            setItemsPerPage(n);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            itemsPerPage === n
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'border border-border hover:bg-secondary'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page info and pagination */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="text-sm text-muted-foreground text-center sm:text-right">
                      Page {currentPage} of {totalPages} • {sorted.length} total results
                    </span>
                    
                    <div className="flex items-center gap-2 justify-center sm:justify-end">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => {
                            if (totalPages <= 7) return true;
                            if (p === 1 || p === totalPages) return true;
                            if (p >= currentPage - 1 && p <= currentPage + 1) return true;
                            return false;
                          })
                          .map((p, i, arr) => {
                            const prev = arr[i - 1];
                            return (
                              <div key={p}>
                                {prev && p - prev > 1 && <span className="px-1 text-muted-foreground">…</span>}
                                <button
                                  onClick={() => setCurrentPage(p)}
                                  className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                                    currentPage === p
                                      ? 'bg-primary text-primary-foreground shadow-md'
                                      : 'border border-border hover:bg-secondary'
                                  }`}
                                >
                                  {p}
                                </button>
                              </div>
                            );
                          })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-background p-6 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-medium">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="p-2 rounded-full hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-full text-sm font-medium shadow-md"
            >
              Show {sorted.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

