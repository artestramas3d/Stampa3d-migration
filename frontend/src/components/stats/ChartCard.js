import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#a3a3a3', '#14b8a6', '#eab308'];
export const AXIS = { stroke: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'JetBrains Mono' };
export const TOOLTIP_STYLE = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '2px', fontFamily: 'JetBrains Mono', fontSize: 12 };
export const eur = (v) => `€${(v || 0).toFixed(2)}`;
export const grams = (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} kg` : `${Math.round(v || 0)} g`);

export function ChartCard({ title, subtitle, children, testId, className = '' }) {
  return (
    <Card className={`border-border/40 ${className}`} data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmptyChart({ height = 260 }) {
  return <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>Nessun dato nel periodo</div>;
}
