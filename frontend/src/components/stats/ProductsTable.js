import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ArrowUpDown } from 'lucide-react';
import { ChartCard, EmptyChart, eur } from './ChartCard';

const COLS = [
  { key: 'name', label: 'Oggetto', align: 'left' },
  { key: 'units', label: 'Pezzi' },
  { key: 'revenue', label: 'Incasso', fmt: eur },
  { key: 'cost', label: 'Costo', fmt: eur },
  { key: 'profit', label: 'Utile', fmt: eur },
  { key: 'margin', label: 'Margine', fmt: (v) => `${v.toFixed(1)}%` },
];

export function ProductsTable({ data }) {
  const [sort, setSort] = useState({ key: 'revenue', dir: -1 });
  const [showAll, setShowAll] = useState(false);
  const totalRev = data.reduce((s, r) => s + r.revenue, 0);
  const rows = [...data].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * sort.dir);
  const visible = showAll ? rows : rows.slice(0, 10);
  const toggle = (key) => setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }));

  return (
    <ChartCard title="Classifica oggetti venduti" subtitle="Clicca sulle intestazioni per ordinare" testId="products-table" className="lg:col-span-2">
      {data.length ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {COLS.map(c => (
                  <TableHead key={c.key} className={c.align === 'left' ? '' : 'text-right'}>
                    <button onClick={() => toggle(c.key)} className="inline-flex items-center gap-1 hover:text-foreground" data-testid={`products-sort-${c.key}`}>
                      {c.label} <ArrowUpDown className={`w-3 h-3 ${sort.key === c.key ? 'text-primary' : 'opacity-40'}`} />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="text-right">% incasso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r, i) => (
                <TableRow key={r.name} data-testid={`products-row-${i}`}>
                  <TableCell className="font-medium max-w-[220px] truncate">{r.name}</TableCell>
                  {COLS.slice(1).map(c => (
                    <TableCell key={c.key} className={`text-right font-mono ${c.key === 'profit' && r.profit < 0 ? 'text-red-500' : ''} ${c.key === 'margin' ? (r.margin >= 30 ? 'text-emerald-500' : r.margin < 10 ? 'text-red-500' : 'text-amber-500') : ''}`}>
                      {c.fmt ? c.fmt(r[c.key]) : r[c.key]}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${totalRev ? (r.revenue / totalRev) * 100 : 0}%` }} /></div>
                      <span className="font-mono text-xs w-10">{totalRev ? ((r.revenue / totalRev) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > 10 && (
            <button onClick={() => setShowAll(v => !v)} className="mt-2 text-xs text-primary hover:underline" data-testid="products-show-all">
              {showAll ? 'Mostra solo i primi 10' : `Mostra tutti (${rows.length})`}
            </button>
          )}
        </div>
      ) : <EmptyChart height={160} />}
    </ChartCard>
  );
}
