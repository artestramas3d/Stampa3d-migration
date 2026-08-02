import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPublicProduct, sendProductInquiry } from '../lib/api';
import { PublicBannerSlot } from '../components/PublicBannerSlot';
import { SeoHead } from '../components/SeoHead';
import {
  Package, ChevronLeft, ChevronRight, X, Send, ShoppingBag,
  FileText, Tag, Palette, Ruler, Sparkles, ArrowLeft, Check, MessageCircle, Mail
} from 'lucide-react';

function VariantPill({ label, value, active, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      data-testid={`variant-${label}-${value}`}
      className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${active ? 'shadow-md scale-105' : 'hover:scale-105'}`}
      style={active
        ? { borderColor: primary, background: primary, color: 'white' }
        : { borderColor: '#e5e7eb', background: 'white', color: '#374151' }
      }
    >
      {active && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
      {value}
    </button>
  );
}

function InquiryModal({ open, onClose, product, variant, customText, type, primary, brand }) {
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      const variantText = [variant.color, variant.material, variant.size].filter(Boolean).join(', ');
      const lines = [
        type === 'quote' ? `Sono interessato/a a un preventivo per ${product?.name}.` : `Vorrei maggiori informazioni su ${product?.name}.`,
      ];
      if (variantText) lines.push(`Variante selezionata: ${variantText}.`);
      if (customText) lines.push(`Personalizzazione: ${customText}.`);
      setForm({ customer_name: '', customer_email: '', customer_phone: '', message: lines.join('\n') });
      setSent(false);
    }
  }, [open, product, variant, customText, type]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSend = async () => {
    if (!form.customer_name || !form.customer_email || !form.message) return;
    setSending(true);
    try {
      await sendProductInquiry({
        product_id: product?.id,
        product_name: product?.name,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        message: form.message,
        is_custom: false,
        selected_color: variant.color || '',
        selected_material: variant.material || '',
        selected_size: variant.size || '',
        custom_text: customText || '',
        inquiry_type: type,
      });
      setSent(true);
    } catch { /* handled */ }
    finally { setSending(false); }
  };

  const title = type === 'quote' ? 'Richiedi Preventivo Personalizzato' : `Richiedi Info: ${product?.name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl" data-testid="product-inquiry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100" aria-label="Chiudi"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${primary}20` }}>
              <Check className="w-8 h-8" style={{ color: primary }} />
            </div>
            <h4 className="font-bold text-lg text-gray-800 mb-2">Richiesta Inviata!</h4>
            <p className="text-gray-500 text-sm">Ti risponderemo il prima possibile a {form.customer_email}</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ background: primary }} data-testid="inquiry-close-btn">Chiudi</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Riepilogo prodotto + personalizzazione */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex items-center gap-3">
                {product?.photos?.[0] ? (
                  <img src={product.photos[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-gray-800 truncate">{product?.name}</p>
                  {product?.show_price === false ? (
                    <p className="text-xs text-gray-500">Prezzo su richiesta</p>
                  ) : (
                    <p className="text-xs text-gray-500">{brand}</p>
                  )}
                </div>
              </div>
              {(variant.color || variant.material || variant.size || customText) && (
                <div className="text-xs space-y-0.5 pt-2 border-t border-gray-200">
                  {variant.color && <p className="text-gray-600"><Palette className="w-3 h-3 inline mr-1" />Colore: <strong>{variant.color}</strong></p>}
                  {variant.material && <p className="text-gray-600"><FileText className="w-3 h-3 inline mr-1" />Materiale: <strong>{variant.material}</strong></p>}
                  {variant.size && <p className="text-gray-600"><Ruler className="w-3 h-3 inline mr-1" />Dimensione: <strong>{variant.size}</strong></p>}
                  {customText && <p className="text-gray-600"><Sparkles className="w-3 h-3 inline mr-1" />Personalizzazione: <strong>{customText}</strong></p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400" placeholder="Il tuo nome" data-testid="inq-name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" value={form.customer_email} onChange={e => setForm(f => ({...f, customer_email: e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400" placeholder="la.tua@email.com" data-testid="inq-email" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefono</label>
              <input value={form.customer_phone} onChange={e => setForm(f => ({...f, customer_phone: e.target.value}))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400" placeholder="Opzionale" data-testid="inq-phone" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Messaggio *</label>
              <textarea value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} rows={5} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400 resize-none" data-testid="inq-message" />
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !form.customer_name || !form.customer_email || !form.message}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: primary }}
              data-testid="inq-submit"
            >
              {sending ? 'Invio...' : (<><Send className="w-4 h-4" /> Invia Richiesta</>)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [variant, setVariant] = useState({ color: '', material: '', size: '' });
  const [customText, setCustomText] = useState('');
  const [modalType, setModalType] = useState(null); // null | 'info' | 'quote'

  useEffect(() => {
    setLoading(true);
    getPublicProduct(slug)
      .then(d => {
        setData(d);
        // Pre-seleziona prima opzione disponibile (se solo una c'e')
        const p = d?.product;
        if (p) {
          setVariant({
            color: p.color_options?.length === 1 ? p.color_options[0] : '',
            material: p.material_options?.length === 1 ? p.material_options[0] : '',
            size: p.size_options?.length === 1 ? p.size_options[0] : '',
          });
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); setData(null); });
  }, [slug]);

  const product = data?.product;
  const primary = data?.primary_color || '#f97316';
  const brand = data?.brand_name || 'Artes&Tramas';
  const photos = product?.photos?.length ? product.photos : (product?.photo ? [product.photo] : []);

  // Aggiorna il <title> del browser con il nome del prodotto (SEO + UX tab)
  useEffect(() => {
    if (product?.name) {
      document.title = `${product.name} | ${brand}`;
    } else {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      document.title = host.startsWith('shop.') ? `${brand} | Shop Stampa 3D` : `${brand} | Prodotto`;
    }
  }, [product, brand]);

  const prevPhoto = useCallback(() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const nextPhoto = useCallback(() => setPhotoIdx(i => (i + 1) % photos.length), [photos.length]);

  // JSON-LD Product per Google Shopping / Rich snippet
  const productJsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: (product.description_long || product.description || '').slice(0, 500),
    image: photos.slice(0, 5),
    brand: { '@type': 'Brand', name: brand },
    category: product.category,
    offers: (product.show_price !== false && product.price) ? {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: parseFloat(product.price).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    } : undefined,
  } : null;

  const seoTitle = product ? `${product.name} · ${brand}` : `Prodotto · ${brand}`;
  const seoDesc = product ? ((product.description || product.description_long || '').slice(0, 200) || `${product.name} — stampa 3D artigianale`) : '';
  const seoImg = photos[0] || '';

  if (loading) {
    return <div className="min-h-screen bg-[#fafafa] flex items-center justify-center"><div className="animate-pulse text-gray-400 text-lg">Caricamento...</div></div>;
  }
  if (!product) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-center">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Prodotto non trovato</h2>
        <p className="text-gray-500 mb-6">Il prodotto che cerchi non è disponibile o è stato rimosso.</p>
        <Link to="/listino" className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ background: '#f97316' }} data-testid="back-to-shop">Torna allo Shop</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]" data-testid="product-detail-page">
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        image={seoImg}
        type="product"
        siteName={brand}
        jsonLd={productJsonLd}
      />
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/listino')} className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 font-medium" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" /> Torna allo Shop
          </button>
          <p className="font-bold tracking-tight text-gray-800" style={{ color: primary }}>{brand}</p>
        </div>
      </div>

      <PublicBannerSlot page="shop" position="header" />

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Galleria */}
          <div className="space-y-3">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative group">
              {photos.length > 0 ? (
                <>
                  <img src={photos[photoIdx]} alt={product.name} className="w-full h-full object-cover" data-testid="main-photo" />
                  {photos.length > 1 && (
                    <>
                      <button onClick={prevPhoto} aria-label="Foto precedente" className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-10 h-10 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={nextPhoto} aria-label="Foto successiva" className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full w-10 h-10 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-20 h-20 text-gray-200" /></div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === photoIdx ? 'shadow-md' : 'opacity-60 hover:opacity-100'}`} style={{ borderColor: i === photoIdx ? primary : 'transparent' }} data-testid={`thumb-${i}`}>
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info + configuratore */}
          <div className="space-y-5">
            {product.category && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: `${primary}15`, color: primary }}>
                  <Tag className="w-3 h-3 inline mr-1" />{product.category}
                </span>
              </div>
            )}

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              {product.description && <p className="mt-2 text-gray-600">{product.description}</p>}
            </div>

            <div className="flex items-baseline gap-3">
              {product.show_price !== false ? (
                <>
                  {product.price_from && <p className="text-sm text-gray-500 italic">a partire da</p>}
                  <p className="text-3xl font-bold" style={{ color: primary }}>€{parseFloat(product.price).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{product.price_from ? '· personalizzazione influisce sul prezzo finale' : 'prezzo base · varianti su richiesta'}</p>
                </>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ color: primary, background: `${primary}15` }} data-testid="ask-price-detail">
                  <Mail className="w-4 h-4" /> Scrivici per sapere il prezzo
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Varianti */}
            {product.color_options?.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Palette className="w-4 h-4" /> Colore</label>
                <div className="flex flex-wrap gap-2">
                  {product.color_options.map(c => (
                    <VariantPill key={c} label="color" value={c} active={variant.color === c} onClick={() => setVariant(v => ({...v, color: v.color === c ? '' : c}))} primary={primary} />
                  ))}
                </div>
              </div>
            )}
            {product.material_options?.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Materiale</label>
                <div className="flex flex-wrap gap-2">
                  {product.material_options.map(m => (
                    <VariantPill key={m} label="material" value={m} active={variant.material === m} onClick={() => setVariant(v => ({...v, material: v.material === m ? '' : m}))} primary={primary} />
                  ))}
                </div>
              </div>
            )}
            {product.size_options?.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Ruler className="w-4 h-4" /> Dimensione</label>
                <div className="flex flex-wrap gap-2">
                  {product.size_options.map(s => (
                    <VariantPill key={s} label="size" value={s} active={variant.size === s} onClick={() => setVariant(v => ({...v, size: v.size === s ? '' : s}))} primary={primary} />
                  ))}
                </div>
              </div>
            )}

            {/* Personalizzazione */}
            {product.is_customizable && (
              <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-white space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Sparkles className="w-4 h-4" style={{ color: primary }} /> Personalizza</label>
                <p className="text-xs text-gray-500">{product.custom_field_label || 'Inserisci il testo che vorresti veder stampato (max 100 caratteri)'}</p>
                <input
                  value={customText}
                  onChange={e => setCustomText(e.target.value.slice(0, 100))}
                  placeholder="Es. Mario, Mamma & Papà, 24/12/2026..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-400"
                  data-testid="custom-text-input"
                />
                <p className="text-[10px] text-gray-400 text-right">{customText.length}/100</p>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setModalType('quote')}
                className="flex-1 py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] shadow-md"
                style={{ background: primary }}
                data-testid="cta-quote"
              >
                <ShoppingBag className="w-4 h-4" />
                {product.show_price === false ? 'Richiedi Prezzo / Preventivo' : 'Personalizza e Richiedi Preventivo'}
              </button>
              <button
                onClick={() => setModalType('info')}
                className="py-3.5 px-5 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{ borderColor: primary, color: primary, background: 'white' }}
                data-testid="cta-info"
              >
                <MessageCircle className="w-4 h-4" /> Chiedi Info
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              <Mail className="w-3 h-3 inline mr-1" />
              Le richieste arrivano a info@artestramas3d.it · Risposta entro 24h
            </p>
          </div>
        </div>

        {/* Descrizione lunga */}
        {product.description_long && (
          <div className="mt-12 sm:mt-16 max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: primary }} /> Dettagli del Prodotto
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap" data-testid="description-long">
              {product.description_long}
            </div>
          </div>
        )}

        <PublicBannerSlot page="shop" position="content" />
      </div>

      <PublicBannerSlot page="shop" position="footer" />

      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-100">
        <p>{brand} &mdash; <a href="mailto:info@artestramas3d.it" className="hover:text-gray-600">info@artestramas3d.it</a> | <a href="/cookie-policy" className="hover:text-gray-600 underline underline-offset-2">Cookie Policy</a></p>
      </footer>

      <InquiryModal
        open={!!modalType}
        type={modalType || 'info'}
        onClose={() => setModalType(null)}
        product={product}
        variant={variant}
        customText={customText}
        primary={primary}
        brand={brand}
      />
    </div>
  );
}
