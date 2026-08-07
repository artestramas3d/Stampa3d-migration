import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicListino, sendProductInquiry } from '../lib/api';
import { Package, X, ChevronLeft, ChevronRight, Send, ShoppingBag, Wrench, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { PublicBannerSlot } from '../components/PublicBannerSlot';
import { SeoHead } from '../components/SeoHead';
import { AffiliateLinks } from '../components/AffiliateLinks';

function ProductCard({ p, index, primary }) {
  const photos = p.photos?.length ? p.photos : (p.photo ? [p.photo] : []);
  const [idx, setIdx] = useState(0);
  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); };
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setIdx(i => (i + 1) % photos.length); };
  const detailUrl = `/shop/prodotto/${p.slug || p.id}`;
  return (
    <Link to={detailUrl} className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all group" data-testid={`listino-product-${index}`}>
      <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
        {photos.length > 0 ? (
          <>
            <img src={photos[idx]} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-testid={`product-photo-${index}`} />
            {photos.length > 1 && (
              <>
                <button onClick={prev} aria-label="Foto precedente" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`prev-photo-${index}`}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={next} aria-label="Foto successiva" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`next-photo-${index}`}>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, pi) => (
                    <button key={pi} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(pi); }} aria-label={`Foto ${pi + 1}`} className="w-2 h-2 rounded-full transition-colors" style={{ background: pi === idx ? 'white' : 'rgba(255,255,255,0.5)' }} />
                  ))}
                </div>
              </>
            )}
            {p.is_customizable && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow" style={{ background: primary }}>Personalizzabile</span>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Package className="w-14 h-14 text-gray-200" /></div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-800 text-lg group-hover:underline">{p.name}</h3>
          {p.show_price !== false ? (
            <div className="text-right shrink-0">
              {p.price_from && <div className="text-[10px] text-gray-500 italic leading-none">a partire da</div>}
              <span className="text-xl font-bold" style={{ color: primary }}>&euro;{parseFloat(p.price).toFixed(2)}</span>
            </div>
          ) : (
            <span className="text-[11px] font-semibold shrink-0 px-2 py-1 rounded-full text-right whitespace-nowrap" style={{ color: primary, background: `${primary}15` }} data-testid={`ask-price-${index}`}>Scrivici per il prezzo</span>
          )}
        </div>
        {p.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {p.category && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: `${primary}15`, color: primary }}>{p.category}</span>}
          {p.subcategory && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">{p.subcategory}</span>}
          {p.materials && <span className="text-[11px] text-gray-400">{p.materials}</span>}
        </div>
        <div
          className="mt-4 w-full py-2.5 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all group-hover:gap-3"
          style={{ background: primary }}
          data-testid={`buy-product-${index}`}
        >
          <ShoppingBag className="w-4 h-4" /> Vedi Dettagli <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

function InquiryForm({ isCustom, onClose, selectedProduct, primary, onSubmit }) {
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!form.customer_name || !form.customer_email || !form.message) return;
    setSending(true);
    try {
      await onSubmit(form, isCustom, selectedProduct);
      setSent(true);
    } catch { /* handled */ }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} data-testid="inquiry-backdrop">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" data-testid="inquiry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-800">
            {isCustom ? 'Richiedi Prodotto Personalizzato' : `Richiedi Info: ${selectedProduct?.name}`}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${primary}20` }}>
              <Send className="w-6 h-6" style={{ color: primary }} />
            </div>
            <h4 className="font-bold text-lg text-gray-800 mb-2">Richiesta Inviata!</h4>
            <p className="text-gray-500 text-sm">Ti risponderemo il prima possibile a {form.customer_email}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ background: primary }}>Chiudi</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {!isCustom && selectedProduct && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                {selectedProduct.photos?.[0] ? (
                  <img src={selectedProduct.photos[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                )}
                <div>
                  <p className="font-semibold text-sm text-gray-800">{selectedProduct.name}</p>
                  <p className="font-bold text-sm" style={{ color: primary }}>
                    {selectedProduct.price_from && <span className="text-[10px] text-gray-500 italic font-normal mr-1">a partire da</span>}
                    &euro;{parseFloat(selectedProduct.price).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400" placeholder="Il tuo nome" data-testid="inquiry-name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" value={form.customer_email} onChange={e => setForm(f => ({...f, customer_email: e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400" placeholder="la.tua@email.com" data-testid="inquiry-email" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefono</label>
              <input value={form.customer_phone} onChange={e => setForm(f => ({...f, customer_phone: e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400" placeholder="Opzionale" data-testid="inquiry-phone" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{isCustom ? 'Descrivi il prodotto che vorresti *' : 'Messaggio *'}</label>
              <textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} rows={4} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400 resize-none" placeholder={isCustom ? 'Descrivi il prodotto personalizzato che vorresti realizzare...' : 'Scrivi la tua richiesta...'} data-testid="inquiry-message" />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !form.customer_name || !form.customer_email || !form.message}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
              style={{ background: primary }}
              data-testid="inquiry-submit"
            >
              {sending ? 'Invio...' : 'Invia Richiesta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicListinoPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [priceMax, setPriceMax] = useState(null); // null = no filter

  // Precompila i filtri dalla query string ?cat=X&subcat=Y (usato dalla HomeShopPage)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    const sub = params.get('subcat');
    if (cat) setFilter(cat);
    if (sub) setSubFilter(sub);
  }, []);
  const [sort, setSort] = useState('default'); // default | price_asc | price_desc | name
  const [modal, setModal] = useState(null); // null | 'custom'

  useEffect(() => {
    getPublicListino().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Aggiorna il <title> del browser in base al dominio (shop vs listino)
  useEffect(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const brand = data?.site?.brand_name || 'Artes&Tramas';
    if (host.startsWith('shop.')) {
      document.title = `${brand} | Shop Stampa 3D`;
    } else if (host.startsWith('listino.')) {
      document.title = `${brand} | Listino Prodotti`;
    } else {
      document.title = `${brand} | Vetrina Prodotti`;
    }
  }, [data]);

  const closeModal = () => setModal(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const openCustom = () => setModal('custom');

  const submitInquiry = async (form, isCustom) => {
    await sendProductInquiry({
      product_id: null,
      product_name: 'Richiesta Personalizzata',
      ...form,
      is_custom: true
    });
  };

  if (loading) return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><div className="animate-pulse text-gray-400 text-lg">Caricamento...</div></div>;
  if (!data) return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><p className="text-gray-500">Vetrina non disponibile</p></div>;

  const primary = data.primary_color || '#f97316';
  const products = data.products || [];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  // Sottocategorie disponibili per la categoria attualmente selezionata
  const subcategories = filter
    ? [...new Set(products.filter(p => p.category === filter).map(p => p.subcategory).filter(Boolean))]
    : [];
  const maxProductPrice = Math.max(0, ...products.map(p => parseFloat(p.price) || 0));
  let filtered = filter ? products.filter(p => p.category === filter) : products;
  if (subFilter) filtered = filtered.filter(p => p.subcategory === subFilter);
  if (priceMax != null) filtered = filtered.filter(p => parseFloat(p.price) <= priceMax);
  if (sort === 'price_asc') filtered = [...filtered].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  else if (sort === 'price_desc') filtered = [...filtered].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  else if (sort === 'name') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen" style={{ background: '#fafafa' }} data-testid="public-listino-page">
      <SeoHead
        title={filter ? `${filter} · ${data.brand_name || 'Artes&Tramas'}` : `Catalogo Prodotti · ${data.brand_name || 'Artes&Tramas'}`}
        description={filter ? `Scopri i nostri ${filter.toLowerCase()} personalizzati in stampa 3D artigianale.` : 'Sfoglia tutti i nostri prodotti: cake topper, portachiavi, lampade LED e regali personalizzati stampati in 3D.'}
        image={products[0]?.photos?.[0] || products[0]?.photo || ''}
        type="website"
        siteName={data.brand_name || 'Artes&Tramas'}
      />
      {/* Header */}
      <header className="text-white py-12 px-6 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
          {data.brand_name}
        </h1>
        <p className="mt-2 text-white/80 text-base sm:text-lg">Vetrina Prodotti</p>
        <p className="mt-1 text-white/60 text-sm">{products.length} prodotti disponibili</p>
        <div className="mt-5 flex justify-center gap-3">
          <button onClick={openCustom} className="px-5 py-2.5 rounded-full bg-white/20 text-white font-semibold text-sm hover:bg-white/30 transition-colors flex items-center gap-2" data-testid="custom-request-btn">
            <Wrench className="w-4 h-4" /> Richiedi Prodotto Personalizzato
          </button>
        </div>
      </header>

      <PublicBannerSlot page="shop" position="header" />

      {/* Filters bar */}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-2">
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3" data-testid="category-filters">
            <button onClick={() => { setFilter(''); setSubFilter(''); }} className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors" style={!filter ? { background: primary, color: 'white' } : { background: '#e5e7eb', color: '#555' }}>Tutti</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => { setFilter(cat); setSubFilter(''); }} className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors" style={filter === cat ? { background: primary, color: 'white' } : { background: '#e5e7eb', color: '#555' }}>{cat}</button>
            ))}
          </div>
        )}
        {filter && subcategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3 pl-3 border-l-2" style={{ borderColor: `${primary}66` }} data-testid="subcategory-filters">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sotto&#8209;categoria:</span>
            <button onClick={() => setSubFilter('')} className="px-3 py-1 rounded-full text-xs font-medium transition-colors" style={!subFilter ? { background: primary, color: 'white' } : { background: 'white', color: '#555', border: '1px solid #e5e7eb' }}>Tutte</button>
            {subcategories.map(sub => (
              <button key={sub} onClick={() => setSubFilter(sub)} className="px-3 py-1 rounded-full text-xs font-medium transition-colors" style={subFilter === sub ? { background: primary, color: 'white' } : { background: 'white', color: '#555', border: '1px solid #e5e7eb' }} data-testid={`subcat-${sub.toLowerCase().replace(/\s+/g, '-')}`}>{sub}</button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-gray-500"><SlidersHorizontal className="w-4 h-4" />Filtri:</span>
          {maxProductPrice > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full" data-testid="price-filter">
              <span className="text-xs text-gray-500">Prezzo max:</span>
              <input
                type="range"
                min={0}
                max={Math.ceil(maxProductPrice)}
                step={1}
                value={priceMax ?? Math.ceil(maxProductPrice)}
                onChange={e => setPriceMax(parseFloat(e.target.value))}
                className="w-24 sm:w-32 accent-orange-500"
                data-testid="price-slider"
              />
              <span className="text-xs font-semibold" style={{ color: primary }}>€{(priceMax ?? Math.ceil(maxProductPrice)).toFixed(0)}</span>
              {priceMax != null && <button onClick={() => setPriceMax(null)} className="text-xs text-gray-400 hover:text-gray-700" aria-label="Reset prezzo">×</button>}
            </div>
          )}
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 focus:outline-none" data-testid="sort-select">
            <option value="default">Ordina: Predefinito</option>
            <option value="price_asc">Prezzo crescente</option>
            <option value="price_desc">Prezzo decrescente</option>
            <option value="name">Nome A-Z</option>
          </select>
          <span className="ml-auto text-xs text-gray-400">{filtered.length} risultati</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">Nessun prodotto trovato</p>
            <button onClick={openCustom} className="mt-4 px-5 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ background: primary }}>
              <Wrench className="w-4 h-4 inline mr-1.5" />Richiedi Prodotto Personalizzato
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, i) => (
              <ProductCard key={p.id || i} p={p} index={i} primary={primary} />
            ))}
          </div>
        )}
      </div>

      {/* Custom Request Section */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <PublicBannerSlot page="shop" position="content" />
        <div className="rounded-2xl p-8 text-center text-white" style={{ background: `linear-gradient(135deg, ${primary}ee, ${primary}aa)` }}>
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-bold mb-2">Vuoi qualcosa di unico?</h3>
          <p className="text-white/80 text-sm mb-4">Realizziamo prodotti personalizzati in stampa 3D su misura per te</p>
          <button onClick={openCustom} className="px-6 py-2.5 rounded-lg bg-white font-semibold text-sm transition-colors hover:bg-gray-50" style={{ color: primary }} data-testid="custom-request-bottom">
            Richiedi Prodotto Personalizzato
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100 space-y-2">
        <PublicBannerSlot page="shop" position="footer" />
        <div className="max-w-4xl mx-auto px-4">
          <AffiliateLinks placement="shop_footer" compact />
        </div>
        <p>{data.brand_name} &mdash; Creazioni in Stampa 3D</p>
        <p>
          <a href="mailto:info@artestramas3d.it" className="hover:text-gray-600">info@artestramas3d.it</a>
          {' | '}
          <a href="/cookie-policy" className="hover:text-gray-600 underline underline-offset-2">Cookie Policy</a>
        </p>
      </footer>

      {/* Modals - key forza il reset dello state interno alla chiusura/cambio prodotto */}
      {modal === 'custom' && (
        <InquiryForm
          key="custom"
          isCustom={true}
          onClose={closeModal}
          selectedProduct={null}
          primary={primary}
          onSubmit={submitInquiry}
        />
      )}
    </div>
  );
}
