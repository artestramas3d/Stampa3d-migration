import { Input } from '../ui/input';
import { CalendarRange } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const PRESETS = [
  { key: 'month', label: 'Questo mese', range: (t) => [new Date(t.getFullYear(), t.getMonth(), 1), t] },
  { key: 'last_month', label: 'Mese scorso', range: (t) => [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)] },
  { key: 'quarter', label: 'Ultimi 3 mesi', range: (t) => [new Date(t.getFullYear(), t.getMonth() - 2, 1), t] },
  { key: 'year', label: "Quest'anno", range: (t) => [new Date(t.getFullYear(), 0, 1), t] },
  { key: 'last_year', label: 'Anno scorso', range: (t) => [new Date(t.getFullYear() - 1, 0, 1), new Date(t.getFullYear() - 1, 11, 31)] },
  { key: 'all', label: 'Tutto', range: () => [null, null] },
];

export function presetRange(key) {
  const p = PRESETS.find(x => x.key === key);
  const [s, e] = p.range(new Date());
  return { start: s ? iso(s) : '', end: e ? iso(e) : '' };
}

export function PeriodPicker({ preset, range, onPreset, onRange }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="period-picker">
      {PRESETS.map(p => (
        <button key={p.key} onClick={() => onPreset(p.key)} data-testid={`period-${p.key}`}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${preset === p.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
          {p.label}
        </button>
      ))}
      <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${preset === 'custom' ? 'border-primary' : 'border-border'}`}>
        <CalendarRange className="w-3.5 h-3.5 text-muted-foreground" />
        <Input type="date" value={range.start} onChange={e => onRange({ ...range, start: e.target.value })} className="h-7 w-36 border-0 bg-transparent px-1 text-xs" data-testid="period-start" />
        <span className="text-xs text-muted-foreground">→</span>
        <Input type="date" value={range.end} onChange={e => onRange({ ...range, end: e.target.value })} className="h-7 w-36 border-0 bg-transparent px-1 text-xs" data-testid="period-end" />
      </div>
    </div>
  );
}
