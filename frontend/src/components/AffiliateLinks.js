import { useEffect, useState } from 'react';
import { getAffiliateLinksByPlacement, trackAffiliateClick } from '../lib/api';
import { ExternalLink, Tag } from 'lucide-react';

const TITLES = {
  guida: 'Risorse Consigliate',
  shop_footer: '',
  calculator: 'Risorse Consigliate',
  demo: 'Risorse per la Stampa 3D',
};

/**
 * Mostra i link affiliati per un determinato placement.
 * Tracciamento click + redirect su nuova tab.
 */
export function AffiliateLinks({ placement, compact = false }) {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    let mounted = true;
    getAffiliateLinksByPlacement(placement).then(d => {
      if (mounted) setLinks(d || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [placement]);

  if (!links.length) return null;

  const handleClick = async (link, e) => {
    e.preventDefault();
    try {
      const res = await trackAffiliateClick(link.id);
      window.open(res?.url || link.url, '_blank', 'noopener,sponsored');
    } catch {
      window.open(link.url, '_blank', 'noopener,sponsored');
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" data-testid={`affiliate-${placement}`}>
        <span className="opacity-60">Sponsor:</span>
        {links.map(l => (
          <a
            key={l.id}
            href={l.url}
            onClick={(e) => handleClick(l, e)}
            rel="sponsored noopener"
            target="_blank"
            className="inline-flex items-center gap-1 hover:text-primary hover:underline"
            data-testid={`aff-${placement}-${l.id}`}
          >
            <Tag className="w-3 h-3" />{l.title}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3" data-testid={`affiliate-${placement}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-primary" /> {TITLES[placement] || 'Risorse Consigliate'}
        </h4>
        <span className="text-[10px] text-muted-foreground italic">Link affiliati</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map(l => (
          <a
            key={l.id}
            href={l.url}
            onClick={(e) => handleClick(l, e)}
            rel="sponsored noopener"
            target="_blank"
            className="flex items-start gap-3 p-3 rounded-md bg-background border border-border/40 hover:border-primary hover:shadow-sm transition-all group"
            data-testid={`aff-${placement}-${l.id}`}
          >
            {l.image_url ? (
              <img src={l.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold group-hover:text-primary truncate">{l.title}</p>
              {l.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{l.description}</p>}
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        I link in questa sezione sono affiliati: acquistando tramite essi sosterrai il progetto con una piccola commissione senza costi aggiuntivi per te.
      </p>
    </div>
  );
}
