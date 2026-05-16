import { useState, useEffect } from 'react';
import { getPublicListino, sendProductInquiry } from '../lib/api';
import { Package, X, ChevronLeft, ChevronRight, Send, ShoppingBag, Wrench } from 'lucide-react';

function ProductCard({ p, index, primary, onInquire }) {
  const photos = p.photos?.length ? p.photos : (p.photo ? [p.photo] : []);
  const [idx, setIdx] = useState(0);
  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length); };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group" data-testid={`listino-product-${index}`}>
      <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
        {photos.length > 0 ? (
          <>
            <img src={photos[idx]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-testid={`product-photo-${index}`} />
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
                    <button key={pi} onClick={(e) => { e.stopPropagation(); setIdx(pi); }} aria-label={`Foto ${pi + 1}`} className="w-2 h-2 rounded-full transition-colors" style={{ background: pi === idx ? 'white' : 'rgba(255,255,255,0.5)' }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Package className="w-14 h-14 text-gray-200" /></div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
          <span className="text-xl font-bold shrink-0" style={{ color: primary }}>&euro;{parseFloat(p.price).toFixed(2)}</span>
        </div>
        {p.description && <p className="text-sm text-gray-500 mt-2 line-clamp-3">{p.description}</p>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {p.category && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: `${primary}15`, color: primary }}>{p.category}</span>}
          {p.materials && <span className="text-[11px] text-gray-400">{p.materials}</span>}
        </div>
        <button
          onClick={() => onInquire(p)}
          className="mt-4 w-full py-2.5 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors hover:opacity-90"
          style={{ background: primary }}
          data-testid={`buy-product-${index}`}
        >
          <ShoppingBag className="w-4 h-4" /> Richiedi Info / Acquista
        </button>
      </div>
    </div>
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
                  <p className="font-bold text-sm" style={{ color: primary }}>&euro;{parseFloat(selectedProduct.price).toFixed(2)}</p>
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modal, setModal] = useState(null); // null | 'inquiry' | 'custom'

  useEffect(() => {
    getPublicListino().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const closeModal = () => setModal(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const openInquiry = (product) => {
    setSelectedProduct(product);
    setModal('inquiry');
  };

  const openCustom = () => {
    setSelectedProduct(null);
    setModal('custom');
  };

  const submitInquiry = async (form, isCustom, product) => {
    await sendProductInquiry({
      product_id: isCustom ? null : product?.id,
      product_name: isCustom ? 'Richiesta Personalizzata' : product?.name,
      ...form,
      is_custom: isCustom
    });
  };

  if (loading) return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><div className="animate-pulse text-gray-400 text-lg">Caricamento...</div></div>;
  if (!data) return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><p className="text-gray-500">Vetrina non disponibile</p></div>;

  const primary = data.primary_color || '#f97316';
  const products = data.products || [];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = filter ? products.filter(p => p.category === filter) : products;

  return (
    <div className="min-h-screen" style={{ background: '#fafafa' }} data-testid="public-listino-page">
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

      {/* Filters */}
      {categories.length > 0 && (
        <div className="flex justify-center gap-2 py-4 px-4 flex-wrap">
          <button onClick={() => setFilter('')} className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors" style={!filter ? { background: primary, color: 'white' } : { background: '#e5e7eb', color: '#555' }}>Tutti</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors" style={filter === cat ? { background: primary, color: 'white' } : { background: '#e5e7eb', color: '#555' }}>{cat}</button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">Nessun prodotto disponibile</p>
            <button onClick={openCustom} className="mt-4 px-5 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ background: primary }}>
              <Wrench className="w-4 h-4 inline mr-1.5" />Richiedi Prodotto Personalizzato
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, i) => (
              <ProductCard key={p.id || i} p={p} index={i} primary={primary} onInquire={openInquiry} />
            ))}
          </div>
        )}
      </div>

      {/* Custom Request Section */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
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
      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100 space-y-1">
        <p>{data.brand_name} &mdash; Creazioni in Stampa 3D</p>
        <p>
          <a href="mailto:info@artestramas3d.it" className="hover:text-gray-600">info@artestramas3d.it</a>
          {' | '}
          <a href="/cookie-policy" className="hover:text-gray-600 underline underline-offset-2">Cookie Policy</a>
        </p>
      </footer>

      {/* Modals - key forza il reset dello state interno alla chiusura/cambio prodotto */}
      {modal === 'inquiry' && (
        <InquiryForm
          key={`inquiry-${selectedProduct?.id || 'x'}`}
          isCustom={false}
          onClose={closeModal}
          selectedProduct={selectedProduct}
          primary={primary}
          onSubmit={submitInquiry}
        />
      )}
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
