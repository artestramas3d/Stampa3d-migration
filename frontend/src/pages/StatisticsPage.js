import { useState, useEffect } from 'react';
import { getAnalytics } from '../lib/api';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { PeriodPicker, presetRange } from '../components/stats/PeriodPicker';
import { KpiGrid } from '../components/stats/KpiGrid';
import { TimelineChart } from '../components/stats/TimelineChart';
import { ProductsTable } from '../components/stats/ProductsTable';
import { Donut, HBar } from '../components/stats/Breakdowns';
import { eur, grams } from '../components/stats/ChartCard';

const fmtDate = (d) => (d ? d.split('-').reverse().join('/') : '');

export default function StatisticsPage() {
  const [preset, setPreset] = useState('month');
  const [range, setRange] = useState(presetRange('month'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ((range.start && !range.end) || (!range.start && range.end)) return;
    setLoading(true);
    getAnalytics(range.start, range.end)
      .then(setData)
      .catch((e) => toast.error(e.response?.data?.detail || 'Errore nel caricamento delle statistiche'))
      .finally(() => setLoading(false));
  }, [range]);

  const choosePreset = (key) => { setPreset(key); setRange(presetRange(key)); };
  const chooseRange = (r) => { setPreset('custom'); setRange(r); };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="statistics-page">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Statistiche</h1>
          <p className="text-muted-foreground mt-1" data-testid="stats-period-label">
            {data ? `Dal ${fmtDate(data.start)} al ${fmtDate(data.end)}` : 'Analizza vendite, costi e materiali'}
            {data?.previous && <span className="text-xs"> · confronto con {fmtDate(data.previous.start)} – {fmtDate(data.previous.end)}</span>}
          </p>
        </div>
        <PeriodPicker preset={preset} range={range} onPreset={choosePreset} onRange={chooseRange} />
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : data && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <KpiGrid summary={data.summary} previous={data.previous} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimelineChart data={data.timeline} granularity={data.granularity} />
            <ProductsTable data={data.products} />
            <Donut title="Filamenti acquistati" subtitle="Spesa nel periodo" testId="chart-purchases" valueKey="spent" fmt={eur} data={data.purchases}
              tabs={[{ key: 'by_material', label: 'Materiale' }, { key: 'by_variant', label: 'Variante' }, { key: 'by_brand', label: 'Marca' }]} />
            <HBar title="Grammi acquistati" subtitle="Per materiale e variante" testId="chart-purchases-grams" data={data.purchases.by_variant.slice(0, 10)}
              bars={[{ key: 'grams', label: 'Grammi', color: 3 }]} fmt={grams} />
            <Donut title="Consumo filamento per materiale" subtitle="Grammi usati nelle vendite" testId="chart-consumption-material" valueKey="grams" fmt={grams} data={data.consumption.by_material} />
            <Donut title="Consumo per colore" subtitle="I 15 colori più usati" testId="chart-consumption-color" valueKey="grams" fmt={grams} data={data.consumption.by_color} colorKey="color_hex" />
            <Donut title="Vendite per tipo" subtitle="Stampa 3D, plotter, manuale" testId="chart-by-type" valueKey="revenue" fmt={eur} data={data.by_type} />
            <HBar title="Clienti migliori" subtitle="Top 10 per incasso" testId="chart-by-client" data={data.by_client}
              bars={[{ key: 'revenue', label: 'Incasso', color: 0 }, { key: 'profit', label: 'Utile', color: 2 }]} fmt={eur} />
          </div>
        </div>
      )}
    </div>
  );
}
