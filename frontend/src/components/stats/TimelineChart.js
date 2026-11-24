import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartCard, EmptyChart, AXIS, TOOLTIP_STYLE, eur } from './ChartCard';

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const fmtPeriod = (p) => {
  const [y, m, d] = p.split('-');
  return d ? `${d}/${m}` : `${MONTHS[+m - 1]} ${y.slice(2)}`;
};

export function TimelineChart({ data, granularity }) {
  return (
    <ChartCard title="Vendite, costi e utile" subtitle={granularity === 'month' ? 'Andamento mese per mese' : 'Andamento giorno per giorno'} testId="chart-timeline" className="lg:col-span-2">
      {data.length ? (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" tickFormatter={fmtPeriod} {...AXIS} />
            <YAxis {...AXIS} tickFormatter={(v) => `€${v}`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={fmtPeriod} formatter={(v, n) => [eur(v), n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Fatturato" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} maxBarSize={36} />
            <Bar dataKey="cost" name="Costi" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} maxBarSize={36} />
            <Bar dataKey="purchases" name="Acquisti filamento" fill="hsl(var(--chart-4))" radius={[2, 2, 0, 0]} maxBarSize={36} />
            <Line type="monotone" dataKey="profit" name="Utile" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : <EmptyChart height={320} />}
    </ChartCard>
  );
}
