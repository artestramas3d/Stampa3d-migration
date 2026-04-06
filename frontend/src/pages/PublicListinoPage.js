import { useState, useEffect } from 'react';
import { getPublicListino } from '../lib/api';
import { Package } from 'lucide-react';

export default function PublicListinoPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getPublicListino().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">Caricamento listino...</div>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <p className="text-gray-500">Listino non disponibile</p>
    </div>
  );

  const primary = data.primary_color || '#f97316';
  const products = data.products || [];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = filter ? products.filter(p => p.category === filter) : products;

  return (
    <div className="min-h-screen" style={{ background: '#fafafa' }} data-testid="public-listino-page">
      {/* Header */}
      <header className="text-white py-10 px-6 text-center" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
          {data.brand_name}
        </h1>
        <p className="mt-2 text-white/80 text-base sm:text-lg">Listino Prezzi</p>
        <p className="mt-1 text-white/60 text-sm">{products.length} prodotti disponibili</p>
      </header>

      {/* Filters */}
      {categories.length > 0 && (
        <div className="flex justify-center gap-2 py-4 px-4 flex-wrap">
          <button
            onClick={() => setFilter('')}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={!filter ? { background: primary, color: 'white' } : { background: '#e5e7eb', color: '#555' }}
          >
            Tutti
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={filter === cat ? { background: primary, color: 'white' } : { background: '#e5e7eb', color: '#555' }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">Nessun prodotto disponibile</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                data-testid={`listino-product-${i}`}
              >
                {p.photo ? (
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-50 flex items-center justify-center">
                    <Package className="w-14 h-14 text-gray-200" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                    <span className="text-lg font-bold shrink-0" style={{ color: primary }}>
                      {parseFloat(p.price).toFixed(2)}
                    </span>
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {p.category && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: `${primary}15`, color: primary }}>
                        {p.category}
                      </span>
                    )}
                    {p.materials && (
                      <span className="text-[11px] text-gray-400">{p.materials}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100 mt-6">
        {data.brand_name} &mdash; Listino aggiornato
      </footer>
    </div>
  );
}
