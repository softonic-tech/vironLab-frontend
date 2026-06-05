import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { VIRION_LOCAL_PRODUCTS } from '@/data/viron-catalog';
import { loadProductsFromSupabase } from '@/lib/supabase-db';
import type { Product } from '@/products';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(VIRION_LOCAL_PRODUCTS);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadProductsFromSupabase()
      .then((dbProducts) => {
        if (cancelled) return;
        if (dbProducts.length > 0) setProducts(dbProducts);
      })
      .catch(() => {
        // Keep local fallback list.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        String(p.category ?? '')
          .toLowerCase()
          .includes(q)
    ).slice(0, 8);
  }, [query, products]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Container */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="bg-[#111827] rounded-2xl border border-[rgba(244,246,250,0.1)] shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-[rgba(244,246,250,0.08)]">
            <Search className="w-5 h-5 text-[#A9B3C7]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products..."
              className="flex-1 bg-transparent text-[#F4F6FA] placeholder-[#A9B3C7] outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[rgba(244,246,250,0.08)]"
            >
              <X className="w-5 h-5 text-[#A9B3C7]" />
            </button>
          </div>

          {/* Results */}
          {query.length >= 2 && (
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#A9B3C7]">No products found</p>
                </div>
              ) : (
                <div className="divide-y divide-[rgba(244,246,250,0.08)]">
                  {results.map((product) => (
                    <a
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={onClose}
                      className="flex items-center gap-4 p-4 hover:bg-[rgba(244,246,250,0.05)] transition-colors"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-contain rounded-lg bg-[rgba(7,10,18,0.5)]"
                      />
                      <div>
                        <p className="font-medium text-[#F4F6FA]">{product.name}</p>
                        <p className="text-sm text-[#A9B3C7] capitalize">
                          {String(product.category ?? '').replace(/-/g, ' ')}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Links */}
          {query.length < 2 && (
            <div className="p-4">
              <p className="text-xs text-[#A9B3C7] mb-3 uppercase tracking-wide">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['Tirzepatide', 'BPC-157', 'TB-500', 'GLOW', 'GHK-Cu'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-full bg-[rgba(244,246,250,0.08)] text-sm text-[#A9B3C7] hover:text-[#F4F6FA] hover:bg-[rgba(244,246,250,0.12)] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
