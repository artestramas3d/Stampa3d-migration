import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

const CONSENT_KEY = 'fp_cookie_consent';

export function getCookieConsent() {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    technical: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs) => {
    const consent = {
      ...prefs,
      technical: true,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  const acceptAll = () => saveConsent({ technical: true, analytics: true, marketing: true });
  const rejectAll = () => saveConsent({ technical: true, analytics: false, marketing: false });
  const saveCustom = () => saveConsent(preferences);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-end justify-center pointer-events-none" data-testid="cookie-banner-overlay">
      <div
        className="pointer-events-auto w-full max-w-2xl mx-4 mb-4 rounded-lg border border-border/60 bg-card shadow-2xl animate-in slide-in-from-bottom-4 duration-500"
        data-testid="cookie-banner"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-md bg-primary/10 shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm">Utilizziamo i Cookie</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Questo sito utilizza cookie tecnici necessari per il funzionamento e, con il tuo consenso, cookie di analisi e marketing.
                Puoi scegliere quali accettare.{' '}
                <Link to="/cookie-policy" className="text-primary hover:underline" onClick={() => setVisible(false)}>
                  Leggi la Cookie Policy
                </Link>
              </p>
            </div>
          </div>

          {/* Expandable details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
            data-testid="cookie-details-toggle"
          >
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Personalizza preferenze
          </button>

          {showDetails && (
            <div className="space-y-2 mb-4 p-3 rounded-md bg-muted/30 border border-border/40" data-testid="cookie-preferences">
              {/* Technical */}
              <label className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-xs font-medium">Cookie Tecnici</p>
                  <p className="text-[10px] text-muted-foreground">Necessari per login e funzionamento del sito</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Sempre attivi</span>
                  <div className="w-9 h-5 rounded-full bg-primary/60 flex items-center justify-end px-0.5">
                    <div className="w-4 h-4 rounded-full bg-primary" />
                  </div>
                </div>
              </label>

              {/* Analytics */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer" data-testid="cookie-analytics-toggle">
                <div>
                  <p className="text-xs font-medium">Cookie Analitici</p>
                  <p className="text-[10px] text-muted-foreground">Per capire come usi il sito e migliorarlo</p>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                    preferences.analytics ? 'bg-primary/60 justify-end' : 'bg-muted-foreground/30 justify-start'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-colors ${preferences.analytics ? 'bg-primary' : 'bg-muted-foreground/60'}`} />
                </button>
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer" data-testid="cookie-marketing-toggle">
                <div>
                  <p className="text-xs font-medium">Cookie Marketing</p>
                  <p className="text-[10px] text-muted-foreground">Per mostrare annunci e banner pertinenti</p>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                    preferences.marketing ? 'bg-primary/60 justify-end' : 'bg-muted-foreground/30 justify-start'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-colors ${preferences.marketing ? 'bg-primary' : 'bg-muted-foreground/60'}`} />
                </button>
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={acceptAll} size="sm" data-testid="cookie-accept-all">
              Accetta Tutti
            </Button>
            {showDetails ? (
              <Button onClick={saveCustom} variant="outline" size="sm" data-testid="cookie-save-custom">
                Salva Preferenze
              </Button>
            ) : (
              <Button onClick={rejectAll} variant="outline" size="sm" data-testid="cookie-reject-all">
                Solo Necessari
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
