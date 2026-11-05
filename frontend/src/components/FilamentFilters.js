import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Filter } from 'lucide-react';

const NONE = '__none__';
const uniq = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b));

export function FilamentFilters({ filaments, filters, onChange, count }) {
  const materials = uniq(filaments.map(f => f.material_type).filter(Boolean));
  const pool = filters.material === 'all' ? filaments : filaments.filter(f => f.material_type === filters.material);
  const variants = uniq(pool.map(f => f.variant || '').filter(Boolean));
  const hasEmpty = pool.some(f => !f.variant);
  const variantValue = filters.variant === '' ? NONE : filters.variant;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="filament-filters">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <Select value={filters.material} onValueChange={(v) => onChange({ material: v, variant: 'all' })}>
        <SelectTrigger className="h-8 w-40 text-sm" data-testid="filter-material"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i materiali</SelectItem>
          {materials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={variantValue} onValueChange={(v) => onChange({ ...filters, variant: v === NONE ? '' : v })}>
        <SelectTrigger className="h-8 w-44 text-sm" data-testid="filter-variant"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutte le varianti</SelectItem>
          {variants.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          {hasEmpty && <SelectItem value={NONE}>Senza variante</SelectItem>}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground" data-testid="filter-count">{count} di {filaments.length} filamenti</span>
    </div>
  );
}
