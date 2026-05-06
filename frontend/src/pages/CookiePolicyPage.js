import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, Shield, Cookie, BarChart3, Megaphone, Settings2 } from 'lucide-react';
import { getCookieConsent } from '../components/CookieBanner';

export default function CookiePolicyPage() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    setConsent(getCookieConsent());
  }, []);

  const resetConsent = () => {
    localStorage.removeItem('fp_cookie_consent');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background" data-testid="cookie-policy-page">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/landing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Torna al sito
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold">Cookie Policy</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Ultimo aggiornamento: Maggio 2026</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Intro */}
          <Card className="border-border/40">
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-heading font-semibold text-lg mb-3">Cosa sono i Cookie?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo durante la navigazione.
                Servono a ricordare le tue preferenze, mantenerti connesso e migliorare la tua esperienza sul sito.
                In questa pagina ti spieghiamo quali cookie utilizziamo e perché.
              </p>
            </CardContent>
          </Card>

          {/* Technical cookies */}
          <Card className="border-border/40">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <Cookie className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-semibold text-lg">Cookie Tecnici (Necessari)</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Sempre attivi</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Questi cookie sono indispensabili per il funzionamento del sito. Senza di essi non potresti effettuare il login,
                navigare tra le pagine o utilizzare le funzionalità del calcolatore.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Cookie</th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Scopo</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Durata</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/20">
                      <td className="py-2 pr-3 font-mono">fp_token</td>
                      <td className="py-2 pr-3">Autenticazione utente (JWT)</td>
                      <td className="py-2">7 giorni</td>
                    </tr>
                    <tr className="border-b border-border/20">
                      <td className="py-2 pr-3 font-mono">fp_theme</td>
                      <td className="py-2 pr-3">Preferenza tema chiaro/scuro</td>
                      <td className="py-2">Permanente</td>
                    </tr>
                    <tr className="border-b border-border/20">
                      <td className="py-2 pr-3 font-mono">fp_lang</td>
                      <td className="py-2 pr-3">Lingua preferita</td>
                      <td className="py-2">Permanente</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-mono">fp_cookie_consent</td>
                      <td className="py-2 pr-3">Preferenze cookie</td>
                      <td className="py-2">Permanente</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Analytics cookies */}
          <Card className="border-border/40">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h2 className="font-heading font-semibold text-lg">Cookie Analitici</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-medium">Opzionali</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Ci aiutano a capire come i visitatori interagiscono con il sito, raccogliendo informazioni in forma anonima.
                Utilizziamo questi dati per migliorare le funzionalità e l'esperienza utente.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Al momento non utilizziamo cookie analitici di terze parti. Se in futuro dovessimo integrarli
                (es. Google Analytics), questa sezione verrà aggiornata e ti chiederemo nuovamente il consenso.
              </p>
            </CardContent>
          </Card>

          {/* Marketing cookies */}
          <Card className="border-border/40">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <Megaphone className="w-5 h-5 text-orange-500" />
                <h2 className="font-heading font-semibold text-lg">Cookie di Marketing</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 font-medium">Opzionali</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Vengono utilizzati per mostrare annunci e contenuti personalizzati in base ai tuoi interessi.
                Possono essere impostati da partner pubblicitari attraverso i banner presenti sul nostro sito.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Se utilizziamo banner di affiliazione (es. TradeTracker, Amazon), questi potrebbero impostare cookie di terze parti
                per tracciare le conversioni. Accettando questa categoria, consenti l'uso di tali cookie.
              </p>
            </CardContent>
          </Card>

          {/* Your rights */}
          <Card className="border-border/40">
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-heading font-semibold text-lg mb-3">I Tuoi Diritti</h2>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
                <p>Ai sensi del <strong>GDPR (Regolamento UE 2016/679)</strong> e della <strong>Direttiva ePrivacy</strong>, hai il diritto di:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Accettare o rifiutare i cookie non necessari</li>
                  <li>Modificare le tue preferenze in qualsiasi momento</li>
                  <li>Cancellare i cookie già memorizzati dal tuo browser</li>
                  <li>Richiedere informazioni sui dati raccolti</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Manage preferences */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <Settings2 className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-semibold text-lg">Gestisci Preferenze</h2>
              </div>
              {consent ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Le tue preferenze attuali:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary">
                      Tecnici: Attivi
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                      consent.analytics ? 'bg-blue-500/20 text-blue-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      Analitici: {consent.analytics ? 'Accettati' : 'Rifiutati'}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                      consent.marketing ? 'bg-orange-500/20 text-orange-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      Marketing: {consent.marketing ? 'Accettati' : 'Rifiutati'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Consenso dato il: {new Date(consent.timestamp).toLocaleString('it-IT')}
                  </p>
                  <Button variant="outline" size="sm" onClick={resetConsent} data-testid="reset-cookie-consent">
                    <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                    Modifica Preferenze Cookie
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Non hai ancora espresso le tue preferenze. Il banner apparirà alla prossima visita.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-border/40">
            <CardContent className="p-5 sm:p-6">
              <h2 className="font-heading font-semibold text-lg mb-3">Contatti</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Per domande riguardo alla nostra Cookie Policy o per esercitare i tuoi diritti, puoi contattarci a:{' '}
                <a href="mailto:info@artestramas3d.it" className="text-primary hover:underline">info@artestramas3d.it</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
