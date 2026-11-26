import { ChartCard, EmptyChart, eur } from './ChartCard';
import { CheckCircle2, Clock } from 'lucide-react';

export function PaymentsCard({ summary, payments }) {
  const total = summary.paid_revenue + summary.unpaid_revenue;
  const paidPct = total ? (summary.paid_revenue / total) * 100 : 0;
  return (
    <ChartCard title="Pagate e da incassare" subtitle="Stato dei pagamenti delle vendite nel periodo" testId="chart-payments">
      {summary.units ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3" data-testid="payments-paid">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Pagate</p>
              <p className="text-xl font-mono font-bold mt-1">{eur(summary.paid_revenue)}</p>
              <p className="text-xs text-muted-foreground">{summary.paid_units} {summary.paid_units === 1 ? "pezzo" : "pezzi"}</p>
            </div>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3" data-testid="payments-unpaid">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-500"><Clock className="w-3.5 h-3.5" /> Da incassare</p>
              <p className="text-xl font-mono font-bold mt-1">{eur(summary.unpaid_revenue)}</p>
              <p className="text-xs text-muted-foreground">{summary.unpaid_units} {summary.unpaid_units === 1 ? "pezzo" : "pezzi"}</p>
            </div>
          </div>
          <div>
            <div className="h-2.5 rounded-full bg-amber-500/30 overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${paidPct}%` }} /></div>
            <p className="text-xs text-muted-foreground mt-1 font-mono" data-testid="payments-pct">{paidPct.toFixed(1)}% incassato</p>
          </div>
          {payments.unpaid_by_client.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Chi deve ancora pagare</p>
              <ul className="space-y-1 text-sm">
                {payments.unpaid_by_client.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2" data-testid={`payments-unpaid-client-${i}`}>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.units} pz</span>
                    <span className="font-mono text-amber-500 w-20 text-right">{eur(c.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : <EmptyChart height={200} />}
    </ChartCard>
  );
}
