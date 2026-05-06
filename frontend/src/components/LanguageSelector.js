import { useLang } from '../context/LangContext';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'it', label: 'IT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
];

export function LanguageSelector() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-1.5" data-testid="language-selector">
      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          data-testid={`lang-btn-${l.code}`}
          className={`px-2 py-0.5 rounded-sm text-xs font-medium transition-colors ${
            lang === l.code
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
