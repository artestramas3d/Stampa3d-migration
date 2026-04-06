import { useState, useEffect } from 'react';
import { getPublicLanding, submitContactForm } from '../lib/api';
import { Package, Mail, Phone, Send, Instagram, Facebook, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getPublicLanding().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    try {
      await submitContactForm(form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">Caricamento...</div>
    </div>
  );

  const primary = data?.primary_color || '#f97316';
  const brand = data?.brand_name || 'Artes&Tramas';
  const portfolio = data?.portfolio || [];

  return (
    <div className="min-h-screen" style={{ background: '#fafafa', fontFamily: "'Inter', sans-serif" }} data-testid="landing-page">
      {/* Hero */}
      <section className="relative text-white py-20 sm:py-28 px-6" style={{ background: `linear-gradient(135deg, ${primary}, #1a1a2e)` }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            {data?.hero_title || brand}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            {data?.hero_subtitle || 'Creazioni in stampa 3D personalizzate'}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <a href="#portfolio" className="px-6 py-3 rounded-full bg-white font-semibold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors" style={{ color: primary }}>
              Scopri i Prodotti <ChevronRight className="w-4 h-4" />
            </a>
            <a href="#contatti" className="px-6 py-3 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
              Richiedi Preventivo
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fafafa] to-transparent" />
      </section>

      {/* About */}
      {data?.about_text && (
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Chi Siamo</h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed whitespace-pre-line">{data.about_text}</p>
          </div>
        </section>
      )}

      {/* Services */}
      {data?.services && data.services.length > 0 && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-10">I Nostri Servizi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.services.map((s, i) => (
                <div key={i} className="p-6 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${primary}15` }}>
                    <Package className="w-5 h-5" style={{ color: primary }} />
                  </div>
                  <p className="font-semibold text-gray-800">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <section id="portfolio" className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-10">I Nostri Prodotti</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {portfolio.map((p, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow" data-testid={`landing-product-${i}`}>
                  {p.photo ? (
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img src={p.photo} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-50 flex items-center justify-center">
                      <Package className="w-14 h-14 text-gray-200" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{p.name}</h3>
                      <span className="font-bold shrink-0" style={{ color: primary }}>{parseFloat(p.price).toFixed(2)}</span>
                    </div>
                    {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                    {p.category && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: `${primary}15`, color: primary }}>
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contatti" className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-10">Richiedi un Preventivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div>
              <p className="text-gray-600 mb-6">
                Hai un'idea da realizzare? Contattaci per un preventivo personalizzato. Risponderemo il prima possibile!
              </p>
              {data?.contact_email && (
                <a href={`mailto:${data.contact_email}`} className="flex items-center gap-3 text-gray-700 mb-3 hover:underline">
                  <Mail className="w-4 h-4" style={{ color: primary }} />{data.contact_email}
                </a>
              )}
              {data?.contact_phone && (
                <a href={`tel:${data.contact_phone}`} className="flex items-center gap-3 text-gray-700 mb-3 hover:underline">
                  <Phone className="w-4 h-4" style={{ color: primary }} />{data.contact_phone}
                </a>
              )}
              <div className="flex items-center gap-3 mt-4">
                {data?.social_instagram && (
                  <a href={data.social_instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: `${primary}15` }}>
                    <Instagram className="w-4 h-4" style={{ color: primary }} />
                  </a>
                )}
                {data?.social_facebook && (
                  <a href={data.social_facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: `${primary}15` }}>
                    <Facebook className="w-4 h-4" style={{ color: primary }} />
                  </a>
                )}
              </div>
            </div>

            {/* Form */}
            <div>
              {sent ? (
                <div className="p-6 rounded-xl text-center" style={{ background: `${primary}10` }}>
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: primary }}>
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800">Messaggio inviato!</p>
                  <p className="text-sm text-gray-500 mt-1">Ti risponderemo il prima possibile.</p>
                  <button onClick={() => setSent(false)} className="mt-3 text-sm underline" style={{ color: primary }}>Invia un altro messaggio</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text" placeholder="Nome *" required value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': primary }}
                      data-testid="contact-name"
                    />
                    <input
                      type="email" placeholder="Email *" required value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                      data-testid="contact-email"
                    />
                  </div>
                  <input
                    type="tel" placeholder="Telefono (opzionale)" value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    data-testid="contact-phone"
                  />
                  <textarea
                    placeholder="Descrivi il tuo progetto... *" required rows={4} value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                    data-testid="contact-message"
                  />
                  <button
                    type="submit" disabled={sending}
                    className="w-full py-3 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ background: primary }}
                    data-testid="contact-submit"
                  >
                    <Send className="w-4 h-4" />{sending ? 'Invio...' : 'Invia Richiesta'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-sm text-gray-400 border-t border-gray-100">
        {brand} &mdash; Creazioni in Stampa 3D
      </footer>
    </div>
  );
}
