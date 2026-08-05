import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, Loader2, Sparkles, Command, ArrowRight } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

export default function SearchSuggestions({ onSelect = () => {} }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceTimer = useRef(null);
  const inputRef = useRef(null);

  const fetchSuggestions = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await apiClient.entities.Product.filter({ search: searchTerm }, '-created_date', 20);
      const unique = Array.isArray(results) ? results : [];
      
      const deduped = Array.from(
        new Map(unique.map(p => [p.name, p])).values()
      ).slice(0, 8);

      setSuggestions(deduped);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cmd/Ctrl + K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);

    clearTimeout(debounceTimer.current);
    if (value.trim()) {
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (product) => {
    setQuery('');
    setOpen(false);
    setSuggestions([]);
    onSelect(product);
  };

  return (
    <div className="relative w-full">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Search luxury stationery..."
          className="w-full pl-11 pr-14 py-2.5 rounded-full bg-secondary/80 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent focus:bg-background transition-all shadow-soft"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          ) : (
            <kbd className="hidden xl:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-background border border-border rounded-md shadow-sm">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          )}
        </div>
      </div>

      {/* Apple Spotlight Modal / Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-lift overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Input */}
            <div className="p-4 border-b border-border/60 flex items-center gap-3">
              <Search className="w-5 h-5 text-accent shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search notebooks, luxury pens, corporate kits..."
                className="w-full bg-transparent text-base focus:outline-none placeholder:text-muted-foreground/60 font-medium"
              />
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">ESC to close</span>
            </div>

            {/* Content Area */}
            <div className="p-4 max-h-[60vh] overflow-y-auto thin-scrollbar">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                  <span>Searching Arihant catalog...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-3 py-1.5">Products ({suggestions.length})</p>
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      className="w-full p-3 rounded-2xl text-left hover:bg-secondary transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-secondary shrink-0 shadow-soft group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate capitalize">{product.category || 'Stationery'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-sm font-semibold text-foreground">₹{(product.price || 0).toLocaleString('en-IN')}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No products found for "{query}"
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-3">Popular Searches</p>
                  <div className="flex flex-wrap gap-2 px-3">
                    {['Leather Notebooks', 'Executive Pens', 'Welcome Kits', 'Desk Pads', 'Eco Collection'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setQuery(tag);
                          fetchSuggestions(tag);
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-secondary border border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
