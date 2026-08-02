import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicListino, getPublicShopSettings } from '../lib/api';
import { ShoppingBag, ArrowRight, Sparkles, Package, Instagram, Facebook, Mail, Phone, MapPin, MessageCircle, Truck, RefreshCw, Star } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';

/**
 * Home dedicata dello Shop (shop.artestramas3d.it/).
 * Layout e-commerce completo con hero, categorie, prodotti in evidenza,
 * "come funziona", about, footer editabile.
 */
export default function HomeShopPage() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [primary, setPrimary] = useState('#f97316');
  const [brand, setBrand] = useState('Artes&Tramas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPublicShopSettings(), getPublicListino()])
      .then(([s, l]) => {
        setSettings(s);
        setProducts(l?.products || []);
        setPrimary(l?.site?.primary_color || '#f97316');
        setBrand(l?.site?.brand_name || 'Artes&Tramas');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Caricamento...</div>;
  }

  const featured = settings?.featured_categories || [];
  // Prendi top 6 prodotti pubblici (piu' visti)
  const topProducts = [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  // Conta prodotti per categoria
  const categoryCounts = products.reduce((acc, p) => {
    const c = p.category || 'Altro';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const socialLinks = [
    { key: 'social_instagram', icon: Instagram, label: 'Instagram', prefix: 'https://instagram.com/' },
    { key: 'social_facebook', icon: Facebook, label: 'Facebook', prefix: 'https://facebook.com/' },
    { key: 'social_tiktok', icon: null, label: 'TikTok', prefix: 'https://tiktok.com/@' },
    { key: 'social_whatsapp', icon: MessageCircle, label: 'WhatsApp', prefix: 'https://wa.me/' },
  ].filter(s => settings?.[s.key]);

  const normalizeSocial = (raw, prefix) => {
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;
    return prefix + raw.replace(/^@|^\+/, '');
  };

  // JSON-LD Organization + LocalBusiness (per Google Knowledge Panel)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: settings?.company_name || brand,
    description: settings?.about_text,
    url: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '',
    email: settings?.email,
    telephone: settings?.phone,
    address: settings?.address ? {
      '@type': 'PostalAddress',
      streetAddress: settings.address,
      addressCountry: 'IT'
    } : undefined,
    sameAs: socialLinks.map(s => normalizeSocial(settings[s.key], s.prefix)).filter(Boolean),
  };

  const seoTitle = `${settings?.hero_title || 'Prodotti Stampa 3D'} · ${settings?.company_name || brand}`;
  const seoDesc = settings?.hero_subtitle || settings?.about_text || 'Cake topper, portachiavi e regali personalizzati in stampa 3D artigianale.';
  const seoImg = settings?.hero_image_url || (topProducts?.[0]?.photos?.[0]) || (topProducts?.[0]?.photo) || '';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        image={seoImg}
        type="website"
        siteName={settings?.company_name || brand}
        jsonLd={jsonLd}
      />
      {/* Header shop */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group" data-testid="shop-home-link">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: primary }}>
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm" style={{ color: primary }}>{brand}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Shop 3D</div>
            </div>
          </Link>
          <nav className="hidden sm:flex items-center gap-5 text-sm font-medium text-gray-700">
            <Link to="/listino" className="hover:underline" data-testid="nav-prodotti">Prodotti</Link>
            <a href="#categorie" className="hover:underline">Categorie</a>
            <a href="#about" className="hover:underline">Chi siamo</a>
            <a href="#contatti" className="hover:underline">Contatti</a>
          </nav>
          <a
            href={`mailto:${settings?.email || 'info@artestramas3d.it'}`}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: primary }}
            data-testid="shop-cta-contact"
          >
            Contattaci
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center" data-testid="shop-hero">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider" style={{ color: primary, background: `${primary}15` }}>
            <Sparkles className="w-3 h-3" /> Stampa 3D artigianale
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-gray-900">
            {settings?.hero_title || 'Idee 3D fatte a mano per te'}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            {settings?.hero_subtitle}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/listino"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: primary }}
              data-testid="shop-hero-cta"
            >
              {settings?.hero_cta_label || 'Scopri i prodotti'} <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#categorie"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold border-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: primary, color: primary }}
            >
              Esplora categorie
            </a>
          </div>
        </div>
        <div className="relative">
          {settings?.hero_image_url ? (
            <img src={settings.hero_image_url} alt="" className="w-full aspect-square rounded-2xl object-cover shadow-xl" />
          ) : (
            <div className="w-full aspect-square rounded-2xl flex items-center justify-center shadow-xl" style={{ background: `linear-gradient(135deg, ${primary}25, ${primary}05)` }}>
              <Package className="w-32 h-32" style={{ color: primary, opacity: 0.4 }} />
            </div>
          )}
        </div>
      </section>

      {/* Categorie */}
      {featured.length > 0 && (
        <section id="categorie" className="max-w-6xl mx-auto px-4 py-10 border-t border-gray-100" data-testid="shop-categories">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Le nostre categorie</h2>
            <p className="text-sm text-gray-500 mt-1">Trova quello che cerchi tra le nostre creazioni</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {featured.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const catImg = (settings?.category_images || {})[cat];
              return (
                <Link
                  key={cat}
                  to={`/listino?cat=${encodeURIComponent(cat)}`}
                  className="group relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
                  style={catImg ? {} : { background: `linear-gradient(135deg, ${primary}30, ${primary}08)` }}
                  data-testid={`cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {catImg && (
                    <>
                      <img src={catImg} alt={cat} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />
                    </>
                  )}
                  <div className={`absolute inset-0 flex flex-col p-4 text-center ${catImg ? 'items-start justify-end' : 'items-center justify-center'}`}>
                    {!catImg && <Package className="w-8 h-8 mb-2" style={{ color: primary }} />}
                    <div className={`font-bold ${catImg ? 'text-white text-left drop-shadow-md text-base' : 'text-gray-800 text-sm'}`}>{cat}</div>
                    {count > 0 && (
                      <div className={`text-[11px] mt-0.5 ${catImg ? 'text-gray-100' : 'text-gray-500'}`}>
                        {count} prodott{count === 1 ? 'o' : 'i'}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Prodotti in evidenza */}
      {topProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">In evidenza</h2>
              <p className="text-sm text-gray-500 mt-1">I prodotti piu' amati dai nostri clienti</p>
            </div>
            <Link to="/listino" className="text-sm font-semibold hover:underline" style={{ color: primary }}>
              Vedi tutti <ArrowRight className="inline w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {topProducts.map(p => (
              <Link
                key={p.id}
                to={p.slug ? `/shop/prodotto/${p.slug}` : `/prodotto/${p.id}`}
                className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1"
                data-testid={`shop-featured-${p.id}`}
              >
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {(p.photos?.[0] || p.photo) ? (
                    <img src={p.photos?.[0] || p.photo} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-gray-300" /></div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{p.category || ''}</div>
                  <div className="font-semibold text-sm text-gray-800 truncate">{p.name}</div>
                  {p.show_price !== false ? (
                    <div className="text-right mt-1">
                      {p.price_from && <span className="text-[9px] text-gray-500 italic">a partire da </span>}
                      <span className="font-bold" style={{ color: primary }}>€{parseFloat(p.price || 0).toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="text-right mt-1 text-[11px] font-semibold" style={{ color: primary }}>Su richiesta</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Come funziona */}
      <section className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Come funziona</h2>
            <p className="text-sm text-gray-500 mt-1">Semplice, veloce e su misura per te</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: '1', t: 'Scegli', d: 'Sfoglia il catalogo e scegli il prodotto che ti piace di piu\'', icon: Package },
              { n: '2', t: 'Personalizza', d: 'Configura colori, dimensioni e testi custom secondo i tuoi gusti', icon: Sparkles },
              { n: '3', t: 'Ricevi a casa', d: 'Stampiamo su misura e spediamo direttamente al tuo indirizzo', icon: Truck },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 text-white font-bold text-lg shadow-md" style={{ background: primary }}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Step {step.n}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{step.t}</div>
                <p className="text-sm text-gray-600 mt-1">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      {settings?.about_text && (
        <section id="about" className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: primary, background: `${primary}15` }}>
            <Star className="w-3 h-3" /> Chi siamo
          </div>
          <p className="text-lg text-gray-700 leading-relaxed">{settings.about_text}</p>
        </section>
      )}

      {/* Contatti + Footer */}
      <footer id="contatti" className="bg-gray-900 text-gray-300 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: primary }}>
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div className="font-bold text-white">{settings?.company_name || brand}</div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{settings?.about_text?.slice(0, 140) || 'Stampa 3D artigianale personalizzata.'}</p>
            {socialLinks.length > 0 && (
              <div className="flex gap-2 mt-4">
                {socialLinks.map(s => (
                  <a
                    key={s.key}
                    href={normalizeSocial(settings[s.key], s.prefix)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors"
                    aria-label={s.label}
                    data-testid={`footer-${s.key}`}
                  >
                    {s.icon ? <s.icon className="w-4 h-4 text-white" /> : <span className="text-[10px] font-bold text-white">TT</span>}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-3">Contatti</div>
            <ul className="space-y-2 text-xs">
              {settings?.email && (
                <li className="flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: primary }} />
                  <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors break-all">{settings.email}</a>
                </li>
              )}
              {settings?.phone && (
                <li className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: primary }} />
                  <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">{settings.phone}</a>
                </li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: primary }} />
                  <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-3">Info</div>
            <ul className="space-y-2 text-xs">
              {settings?.shipping_info && (
                <li className="flex items-start gap-2">
                  <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: primary }} />
                  <span>{settings.shipping_info}</span>
                </li>
              )}
              {settings?.returns_info && (
                <li className="flex items-start gap-2">
                  <RefreshCw className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: primary }} />
                  <span>{settings.returns_info}</span>
                </li>
              )}
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-3">Legale</div>
            <ul className="space-y-2 text-xs">
              {settings?.vat_number && <li>P. IVA: <span className="font-mono">{settings.vat_number}</span></li>}
              {settings?.terms_url && <li><a href={settings.terms_url} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Termini e condizioni</a></li>}
              {settings?.privacy_url && <li><a href={settings.privacy_url} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>}
              <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 py-4 text-center text-[11px] text-gray-500">
          © {new Date().getFullYear()} {settings?.company_name || brand}. Tutti i diritti riservati.
        </div>
      </footer>
    </div>
  );
}
