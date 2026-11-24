import { Card, CardContent } from '../ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { eur, grams } from './ChartCard';

const KPIS = [
  { key: 'revenue', label: 'Fatturato', fmt: eur },
  { key: 'profit', label: 'Utile netto', fmt: eur },
  { key: 'cost', label: 'Costi produzione', fmt: eur, inverse: true },
  { key: 'margin', label: 'Margine medio', fmt: (v) => `${(v || 0).toFixed(1)}%` },
  { key: 'units', label: 'Pezzi venduti', fmt: (v) => v },
  { key: 'purchases_spent', label: 'Spesa filamenti', fmt: eur, inverse: true },
  { key: 'grams_used', label: 'Filamento usato', fmt: grams },
  { key: 'purchases_grams', label: 'Filamento acquistato', fmt: grams },
];

function Delta({ cur, prev, inverse, isPct }) {
  if (prev === undefined || prev === null) return null;
  if (!isPct && !prev) return <span className="text-[11px] text-muted-foreground font-semibold">{cur ? 'nuovo' : '—'}</span>;
  const diff = isPct ? cur - prev : prev ? ((cur - prev) / Math.abs(prev)) * 100 : (cur ? 100 : 0);
  if (Math.abs(diff) < 0.05) return <span className="inline-flex items-center text-[11px] text-muted-foreground"><Minus className="w-3 h-3 mr-0.5" />0%</span>;
  const good = inverse ? diff < 0 : diff > 0;
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center text-[11px] font-mono font-semibold ${good ? 'text-emerald-500' : 'text-red-500'}`}>
      <Icon className="w-3.5 h-3.5" />{Math.abs(diff).toFixed(1)}{isPct ? ' pt' : '%'}
    </span>
  );
}

export function KpiGrid({ summary, previous }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="stats-kpis">
      {KPIS.map((k, i) => (
        <Card key={k.key} className="stat-card animate-fadeIn" style={{ animationDelay: `${i * 40}ms` }} data-testid={`kpi-${k.key}`}>
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
            <p className="text-xl sm:text-2xl font-heading font-bold font-mono" data-testid={`kpi-${k.key}-value`}>{k.fmt(summary[k.key])}</p>
            {previous && (
              <div className="mt-1 flex items-center gap-1.5" data-testid={`kpi-${k.key}-delta`}>
                <Delta cur={summary[k.key]} prev={previous[k.key]} inverse={k.inverse} isPct={k.key === 'margin'} />
                <span className="text-[10px] text-muted-foreground truncate">vs {k.fmt(previous[k.key])}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
