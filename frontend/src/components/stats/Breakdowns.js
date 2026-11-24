import { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartCard, EmptyChart, CHART_COLORS, TOOLTIP_STYLE, AXIS } from './ChartCard';

export function Donut({ title, subtitle, data, valueKey, fmt, testId, colorKey, tabs }) {
  const [tab, setTab] = useState(tabs ? tabs[0].key : null);
  const rows = tabs ? data[tab] || [] : data;
  const total = rows.reduce((s, r) => s + (r[valueKey] || 0), 0);
  return (
    <ChartCard title={title} subtitle={subtitle} testId={testId}>
      {tabs && (
        <div className="flex gap-1 mb-3" data-testid={`${testId}-tabs`}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} data-testid={`${testId}-tab-${t.key}`}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}>{t.label}</button>
          ))}
        </div>
      )}
      {rows.length && total > 0 ? (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
            <PieChart>
              <Pie data={rows} dataKey={valueKey} nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={rows.length > 1 ? 2 : 0} stroke={rows.length > 1 ? 'hsl(var(--card))' : 'none'}>
                {rows.map((r, i) => <Cell key={r.name} fill={(colorKey && r[colorKey]) || CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [fmt(v), n]} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 w-full space-y-1.5 text-xs">
            {rows.slice(0, 8).map((r, i) => (
              <li key={r.name} className="flex items-center gap-2" data-testid={`${testId}-item-${i}`}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-border" style={{ background: (colorKey && r[colorKey]) || CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="flex-1 truncate">{r.name}</span>
                <span className="font-mono">{fmt(r[valueKey])}</span>
                <span className="font-mono text-muted-foreground w-11 text-right">{((r[valueKey] / total) * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : <EmptyChart height={200} />}
    </ChartCard>
  );
}

export function HBar({ title, subtitle, data, bars, fmt, testId, height }) {
  const h = height || Math.max(180, data.length * 34);
  return (
    <ChartCard title={title} subtitle={subtitle} testId={testId}>
      {data.length ? (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" {...AXIS} tickFormatter={fmt} />
            <YAxis type="category" dataKey="name" width={120} {...AXIS} tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [fmt(v), n]} />
            {bars.map((b, i) => <Bar key={b.key} dataKey={b.key} name={b.label} fill={CHART_COLORS[b.color ?? i]} radius={[0, 2, 2, 0]} maxBarSize={22} />)}
          </BarChart>
        </ResponsiveContainer>
      ) : <EmptyChart height={180} />}
    </ChartCard>
  );
}
