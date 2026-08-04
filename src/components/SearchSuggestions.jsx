import { useState, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/apiClient';

export default function SearchSuggestions({ onSelect = () => {} }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceTimer = useRef(null);

  const fetchSuggestions = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await apiClient.entities.Product.filter({ search: searchTerm }, '-created_date', 20);
      const unique = Array.isArray(results) ? results : [];
      
      // Deduplicate and limit to 8 suggestions
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);

    // Debounce API calls
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
    setQuery(product.name);
    setOpen(false);
    setSuggestions([]);
    onSelect(product);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Search products..."
          className="w-full pl-10 pr-10 py-2.5 rounded-full bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {open && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-sm shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {suggestions.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full px-4 py-3 text-left hover:bg-secondary/50 border-b border-border/30 last:border-b-0 transition-colors flex items-center gap-3"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover bg-secondary"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                  </div>
                  <p className="text-sm font-medium shrink-0">₹{(product.price || 0).toLocaleString('en-IN')}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
