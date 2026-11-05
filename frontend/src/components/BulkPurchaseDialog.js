import { useState, useEffect, useRef } from 'react';
import { bulkPurchaseFilaments, getFilamentPresets, createFilamentPreset, deleteFilamentPreset } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Copy, Trash2, Plus, Save, BookmarkPlus, X, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { FilamentColorDot, FINISH_PRESETS } from './FilamentColorDot';

const MATERIALS = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'PLA+', 'PETG-CF'];
const COLS = ['material_type', 'brand', 'color', 'color_hex', 'finish', 'quantity_spools', 'spool_weight_g', 'spool_price'];
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
let rid = 0;
const newRow = (base = {}) => ({
  _id: ++rid, material_type: 'PLA', brand: '', color: '', color_hex: '#FFFFFF', color_hex2: '',
  finish: 'normale', quantity_spools: 1, spool_weight_g: 1000, spool_price: 0, ...base,
});
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
const qty = (v) => Math.max(1, Math.round(num(v)));
const norm = (s) => (s || '').trim().toLowerCase();
const cell = 'h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

export function BulkPurchaseDialog({ open, onOpenChange, filaments, onSaved }) {
  const [rows, setRows] = useState([newRow()]);
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [presets, setPresets] = useState([]);
  const [saving, setSaving] = useState(false);
  const tableRef = useRef(null);
  const pendingFocus = useRef(null);

  useEffect(() => {
    if (!open) return;
    setRows([newRow()]); setDate(today()); setNotes('');
    getFilamentPresets().then(setPresets).catch(() => toast.error('Errore nel caricamento dei preset'));
  }, [open]);

  useEffect(() => {
    if (pendingFocus.current === null || !tableRef.current) return;
    const el = tableRef.current.querySelector(`[data-cell="${pendingFocus.current}-material_type"]`);
    pendingFocus.current = null;
    el?.focus(); el?.select?.();
  }, [rows]);

  const update = (id, patch) => setRows(rs => rs.map(r => (r._id === id ? { ...r, ...patch } : r)));
  const insertAfter = (idx, row) => {
    pendingFocus.current = row._id;
    setRows(rs => [...rs.slice(0, idx + 1), row, ...rs.slice(idx + 1)]);
  };
  const duplicate = (idx) => { const { _id, ...rest } = rows[idx]; insertAfter(idx, newRow(rest)); };
  const remove = (id) => setRows(rs => (rs.length > 1 ? rs.filter(r => r._id !== id) : [newRow()]));

  const applyPreset = (id, presetId) => {
    const p = presets.find(x => x.id === presetId);
    if (p) update(id, { material_type: p.material_type, brand: p.brand, spool_weight_g: p.spool_weight_g, spool_price: p.spool_price, finish: p.finish });
  };

  const saveAsPreset = async (row) => {
    const name = window.prompt('Nome del preset', `${row.brand} ${row.material_type}`.trim());
    if (!name) return;
    try {
      const p = await createFilamentPreset({ name, material_type: row.material_type, brand: row.brand, spool_weight_g: num(row.spool_weight_g), spool_price: num(row.spool_price), finish: row.finish });
      setPresets(ps => [...ps.filter(x => x.id !== p.id), p].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Preset "${p.name}" salvato`);
    } catch { toast.error('Errore nel salvataggio del preset'); }
  };

  const removePreset = async (p) => {
    if (!window.confirm(`Eliminare il preset "${p.name}"?`)) return;
    try {
      await deleteFilamentPreset(p.id);
      setPresets(ps => ps.filter(x => x.id !== p.id));
    } catch { toast.error('Errore nell\'eliminazione del preset'); }
  };

  const onKeyDown = (e, idx) => {
    if (e.key !== 'Enter' || e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    const { material_type, brand, finish, spool_weight_g, spool_price } = rows[idx];
    insertAfter(idx, newRow({ material_type, brand, finish, spool_weight_g, spool_price }));
  };

  const isExisting = (r) => r.color.trim() && filaments.some(f =>
    norm(f.material_type) === norm(r.material_type) && norm(f.brand) === norm(r.brand) && norm(f.color) === norm(r.color));

  const valid = rows.filter(r => r.color.trim() && r.material_type.trim());
  const totSpools = valid.reduce((s, r) => s + qty(r.quantity_spools), 0);
  const totPrice = valid.reduce((s, r) => s + qty(r.quantity_spools) * num(r.spool_price), 0);

  const saveAll = async () => {
    if (!valid.length) return toast.error('Compila almeno una riga con materiale e colore');
    setSaving(true);
    try {
      const payload = valid.map(({ _id, ...r }) => ({ ...r, quantity_spools: qty(r.quantity_spools), spool_weight_g: num(r.spool_weight_g), spool_price: num(r.spool_price) }));
      const res = await bulkPurchaseFilaments({ date, notes, rows: payload });
      toast.success(`Salvato: ${res.created} nuovi filamenti, ${res.updated} aggiornati (€${res.total_spent.toFixed(2)})`);
      onOpenChange(false); onSaved();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Errore nel salvataggio');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(96vw,1280px)] max-h-[92vh] overflow-y-auto" data-testid="bulk-purchase-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Acquisto Multiplo</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <Keyboard className="w-3.5 h-3.5" /> <b>Tab</b> campo successivo · <b>Invio</b> nuova riga (copia materiale, brand, peso e prezzo) · se il filamento esiste già, le bobine vengono aggiunte e il prezzo medio aggiornato
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Data acquisto</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 w-44" data-testid="bulk-date-input" />
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label className="text-xs">Note (es. fornitore, ordine)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-9" placeholder="Opzionale" data-testid="bulk-notes-input" />
          </div>
        </div>

        <PresetChips presets={presets} onRemove={removePreset} />

        <div className="overflow-x-auto rounded-lg border" ref={tableRef}>
          <datalist id="bulk-materials">{MATERIALS.map(m => <option key={m} value={m} />)}</datalist>
          <table className="w-full text-sm" data-testid="bulk-table">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {['Preset', 'Materiale', 'Brand', 'Colore', 'Hex', 'Effetto', 'Qtà', 'Peso (g)', '€/bobina', 'Totale', ''].map(h => (
                  <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <BulkRow key={r._id} r={r} idx={idx} presets={presets} existing={isExisting(r)}
                  onChange={p => update(r._id, p)} onPreset={pid => applyPreset(r._id, pid)}
                  onKeyDown={e => onKeyDown(e, idx)} onDuplicate={() => duplicate(idx)}
                  onRemove={() => remove(r._id)} onSavePreset={() => saveAsPreset(r)} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => insertAfter(rows.length - 1, newRow())} data-testid="bulk-add-row-btn">
            <Plus className="w-4 h-4 mr-1" /> Aggiungi riga
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground" data-testid="bulk-totals">
              {valid.length} righe · {totSpools} bobine · <b className="font-mono text-foreground">€{totPrice.toFixed(2)}</b>
            </span>
            <Button onClick={saveAll} disabled={saving} data-testid="bulk-save-all-btn">
              <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Salvataggio...' : 'Salva tutto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PresetChips({ presets, onRemove }) {
  if (!presets.length) {
    return <p className="text-xs text-muted-foreground italic" data-testid="bulk-no-presets">Nessun preset salvato: usa l'icona <BookmarkPlus className="inline w-3 h-3" /> su una riga per salvarne uno.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="bulk-presets-list">
      <span className="text-xs text-muted-foreground self-center mr-1">I tuoi preset:</span>
      {presets.map(p => (
        <span key={p.id} className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs" data-testid={`preset-chip-${p.id}`}>
          {p.name} <span className="font-mono text-muted-foreground">€{p.spool_price}</span>
          <button type="button" onClick={() => onRemove(p)} className="text-muted-foreground hover:text-destructive" data-testid={`delete-preset-${p.id}`}><X className="w-3 h-3" /></button>
        </span>
      ))}
    </div>
  );
}

function BulkRow({ r, idx, presets, existing, onChange, onPreset, onKeyDown, onDuplicate, onRemove, onSavePreset }) {
  const field = (key, props = {}) => (
    <input value={r[key]} onChange={e => onChange({ [key]: e.target.value })} onKeyDown={onKeyDown}
      data-cell={`${r._id}-${key}`} data-testid={`bulk-row-${idx}-${key}`} className={cell} {...props} />
  );
  const total = qty(r.quantity_spools) * num(r.spool_price);
  return (
    <tr className="border-t hover:bg-muted/20 transition-colors" data-testid={`bulk-row-${idx}`}>
      <td className="px-1.5 py-1 min-w-[130px]">
        <select value="" onChange={e => onPreset(e.target.value)} onKeyDown={onKeyDown} className={cell} data-testid={`bulk-row-${idx}-preset`}>
          <option value="">—</option>
          {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </td>
      <td className="px-1.5 py-1 min-w-[90px]">{field('material_type', { list: 'bulk-materials' })}</td>
      <td className="px-1.5 py-1 min-w-[110px]">{field('brand', { placeholder: 'Bambu Lab' })}</td>
      <td className="px-1.5 py-1 min-w-[130px]">
        <div className="flex items-center gap-1.5">
          {field('color', { placeholder: 'Rosso' })}
          {existing && <span className="text-[10px] font-semibold uppercase text-emerald-600 whitespace-nowrap" data-testid={`bulk-row-${idx}-existing`}>+ esist.</span>}
        </div>
      </td>
      <td className="px-1.5 py-1">
        <div className="flex items-center gap-1">
          <input type="color" value={r.color_hex} onChange={e => onChange({ color_hex: e.target.value })} onKeyDown={onKeyDown}
            className="h-8 w-9 cursor-pointer rounded border bg-transparent p-0.5" data-testid={`bulk-row-${idx}-color_hex`} />
          <FilamentColorDot color={r.color_hex} finish={r.finish} size="w-5 h-5" />
        </div>
      </td>
      <td className="px-1.5 py-1 min-w-[110px]">
        <select value={r.finish} onChange={e => onChange({ finish: e.target.value })} onKeyDown={onKeyDown} className={cell} data-testid={`bulk-row-${idx}-finish`}>
          {FINISH_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </td>
      <td className="px-1.5 py-1 w-16">{field('quantity_spools', { inputMode: 'numeric', className: `${cell} font-mono text-right` })}</td>
      <td className="px-1.5 py-1 w-20">{field('spool_weight_g', { inputMode: 'decimal', className: `${cell} font-mono text-right` })}</td>
      <td className="px-1.5 py-1 w-20">{field('spool_price', { inputMode: 'decimal', className: `${cell} font-mono text-right` })}</td>
      <td className="px-2 py-1 font-mono text-right whitespace-nowrap" data-testid={`bulk-row-${idx}-total`}>€{total.toFixed(2)}</td>
      <td className="px-1 py-1 whitespace-nowrap">
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" tabIndex={-1} title="Duplica riga" onClick={onDuplicate} data-testid={`bulk-row-${idx}-duplicate`}><Copy className="w-3.5 h-3.5" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" tabIndex={-1} title="Salva come preset" onClick={onSavePreset} data-testid={`bulk-row-${idx}-save-preset`}><BookmarkPlus className="w-3.5 h-3.5" /></Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" tabIndex={-1} title="Elimina riga" onClick={onRemove} data-testid={`bulk-row-${idx}-delete`}><Trash2 className="w-3.5 h-3.5" /></Button>
      </td>
    </tr>
  );
}
