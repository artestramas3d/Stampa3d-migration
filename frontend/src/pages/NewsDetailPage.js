import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicNewsDetail } from '../lib/api';
import { Newspaper, ArrowLeft, Calendar, Eye, Home, Share2 } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { toast } from 'sonner';

export default function NewsDetailPage() {
  const { slug } = useParams();
  const [n, setN] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPublicNewsDetail(slug).then(setN).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]"><p className="text-gray-400">Caricamento...</p></div>;
  if (notFound || !n) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6 text-center">
      <div>
        <Newspaper className="w-14 h-14 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">Notizia non trovata</p>
        <Link to="/news" className="text-orange-500 font-semibold">← Torna alle notizie</Link>
      </div>
    </div>
  );

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: n.title, text: n.excerpt, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiato');
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: n.title,
    description: n.excerpt,
    image: n.cover_image,
    datePublished: n.created_at,
    dateModified: n.updated_at,
    author: { '@type': 'Person', name: n.author_name || 'Artes&Tramas' },
    articleSection: n.category,
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" data-testid="news-detail-page">
      <SeoHead
        title={`${n.title} · Artes&Tramas`}
        description={n.excerpt || n.title}
        image={n.cover_image || ''}
        type="article"
        jsonLd={jsonLd}
      />

      {n.cover_image && (
        <div className="relative h-64 sm:h-96 overflow-hidden">
          <img src={n.cover_image} alt={n.title} loading="eager" fetchPriority="high" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 py-8 -mt-16 relative">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10">
          <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-orange-500"><Home className="w-3 h-3" />Home</Link>
            <span>/</span>
            <Link to="/news" className="hover:text-orange-500">Notizie</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{n.category}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{n.title}</h1>

          <div className="flex flex-wrap items-center gap-3 mt-3 mb-6 text-xs text-gray-500 pb-4 border-b border-gray-100">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{(n.created_at || '').slice(0, 10)}</span>
            <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{n.views} letture</span>
            <span>di {n.author_name || 'Artes&Tramas'}</span>
            <button onClick={share} className="ml-auto inline-flex items-center gap-1 text-orange-500 font-semibold hover:text-orange-600" data-testid="news-share">
              <Share2 className="w-3.5 h-3.5" />Condividi
            </button>
          </div>

          <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-heading prose-a:text-orange-500" dangerouslySetInnerHTML={{ __html: n.content_html || '<p class="text-gray-400 italic">Contenuto non ancora disponibile.</p>' }} />

          <div className="mt-8 pt-6 border-t border-gray-100">
            <Link to="/news" className="inline-flex items-center gap-1.5 text-orange-500 font-semibold hover:text-orange-600" data-testid="news-back"><ArrowLeft className="w-4 h-4" />Torna alle notizie</Link>
          </div>
        </div>
      </article>
    </div>
  );
}
