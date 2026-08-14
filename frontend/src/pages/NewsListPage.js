import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPublicNews, getPublicNewsCategories } from '../lib/api';
import { Newspaper, ArrowRight, Calendar, Eye, Home } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';

export default function NewsListPage() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeCat = params.get('cat') || '';

  useEffect(() => {
    setLoading(true);
    const q = activeCat ? { category: activeCat } : {};
    Promise.all([getPublicNews(q), getPublicNewsCategories()])
      .then(([n, c]) => { setItems(n); setCats(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCat]);

  return (
    <div className="min-h-screen bg-[#fafafa]" data-testid="news-list-page">
      <SeoHead
        title="Notizie e Novità · Artes&Tramas 3D"
        description="Aggiornamenti, guide, offerte ed eventi dal mondo Artes&Tramas: stampa 3D artigianale, calcolatore costi, novità della vetrina."
      />
      <header className="bg-gradient-to-br from-orange-500 to-pink-500 text-white py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-3 opacity-80">
            <Link to="/" className="inline-flex items-center gap-1 hover:opacity-100"><Home className="w-3 h-3" />Home</Link>
            <span>/</span>
            <span>Notizie</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">Notizie & Novità</h1>
          <p className="mt-2 text-white/80">Aggiornamenti, guide, offerte ed eventi</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6" data-testid="news-cats">
            <button onClick={() => setParams({})} className={`px-4 py-1.5 rounded-full text-sm font-medium ${!activeCat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Tutte</button>
            {cats.map(c => (
              <button key={c} onClick={() => setParams({ cat: c })} className={`px-4 py-1.5 rounded-full text-sm font-medium ${activeCat === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c}</button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-12">Caricamento...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nessuna notizia {activeCat && `in "${activeCat}"`}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(n => <NewsCard key={n.id} n={n} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function NewsCard({ n }) {
  return (
    <Link to={`/news/${n.slug}`} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all block" data-testid={`news-card-${n.slug}`}>
      <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
        {n.cover_image ? (
          <img src={n.cover_image} alt={n.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-pink-100"><Newspaper className="w-12 h-12 text-orange-300" /></div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-orange-600">{n.category}</span>
      </div>
      <div className="p-4 space-y-2">
        <h2 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">{n.title}</h2>
        {n.excerpt && <p className="text-sm text-gray-500 line-clamp-2">{n.excerpt}</p>}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{(n.created_at || '').slice(0, 10)}</span>
          <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{n.views}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-orange-500 font-semibold">Leggi <ArrowRight className="w-3 h-3" /></span>
        </div>
      </div>
    </Link>
  );
}
