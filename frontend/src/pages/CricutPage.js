import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Scissors, Layers, Cpu, Package as PackageIcon, Plus, Pencil, Trash2, AlertTriangle, PowerOff, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCricutMeta,
  getCricutMaterials, createCricutMaterial, updateCricutMaterial, deleteCricutMaterial,
  getCricutMachines, createCricutMachine, updateCricutMachine, deleteCricutMachine,
  getCricutConsumables, createCricutConsumable, updateCricutConsumable, deleteCricutConsumable,
} from '../lib/api';

const UNIT_LABELS = { m2: 'm²', cm2: 'cm²', metri_lineari: 'm lineari', fogli: 'fogli', pezzi: 'pezzi' };

const emptyMaterial = { name: '', category: 'Personalizzato', brand: '', color: '', color_hex: '#f97316', supplier: '', purchase_price: 0, purchase_qty: 1, unit_of_measure: 'fogli', waste_percent: 10, notes: '', remaining_qty: null, low_stock_threshold: 0 };
const emptyMachine = { name: '', brand: '', model: '', price: 0, purchase_date: '', life_hours: 3000, power_watts: 30, electricity_cost_kwh: 0.30, active: true, amortization_formula: 'simple', fiscal_years: 5, monthly_hours: 20 };
const emptyConsumable = { name: '', type: 'Lama', price: 0, life_uses: 100, notes: '' };

export default function CricutPage() {
  const [tab, setTab] = useState('materials');
  const [meta, setMeta] = useState({ units: [], material_categories: [], consumable_types: [] });

  useEffect(() => { getCricutMeta().then(setMeta).catch(() => {}); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-md">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Lavorazioni Cricut</h1>
          <p className="text-xs text-muted-foreground">Gestisci materiali, macchine e consumabili per plotter da taglio</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
        <TabBtn active={tab === 'materials'} onClick={() => setTab('materials')} icon={Layers} label="Materiali" testid="cricut-tab-materials" />
        <TabBtn active={tab === 'machines'} onClick={() => setTab('machines')} icon={Cpu} label="Macchine" testid="cricut-tab-machines" />
        <TabBtn active={tab === 'consumables'} onClick={() => setTab('consumables')} icon={PackageIcon} label="Consumabili" testid="cricut-tab-consumables" />
      </div>

      {tab === 'materials' && <MaterialsTab meta={meta} />}
      {tab === 'machines' && <MachinesTab />}
      {tab === 'consumables' && <ConsumablesTab meta={meta} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, testid }) {
  return (
    <button onClick={onClick} data-testid={testid} className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );
}

// ============ MATERIALI ============
function MaterialsTab({ meta }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyMaterial);

  const load = async () => {
    setLoading(true);
    try { setItems(await getCricutMaterials()); }
    catch { toast.error('Errore caricamento materiali'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyMaterial); setDialogOpen(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ ...emptyMaterial, ...m });
    setDialogOpen(true);
  };
  const save = async () => {
    if (!form.name.trim()) return toast.error('Nome obbligatorio');
    try {
      if (editing) { await updateCricutMaterial(editing.id, form); toast.success('Materiale aggiornato'); }
      else { await createCricutMaterial(form); toast.success('Materiale aggiunto'); }
      setDialogOpen(false); load();
    } catch { toast.error('Errore salvataggio'); }
  };
  const remove = async (id) => {
    if (!confirm('Eliminare questo materiale?')) return;
    try { await deleteCricutMaterial(id); toast.success('Eliminato'); load(); }
    catch { toast.error('Errore'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} materiali</p>
        <Button onClick={openNew} size="sm" data-testid="cricut-add-material"><Plus className="w-4 h-4 mr-1" />Nuovo materiale</Button>
      </div>

      {loading ? <div className="text-center py-8 text-muted-foreground text-sm">Caricamento...</div> : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nessun materiale. Aggiungi il primo per iniziare.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(m => (
            <Card key={m.id} className="group hover:shadow-md transition-shadow" data-testid={`cricut-material-${m.id}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-md border border-border/50 shrink-0" style={{ background: m.color_hex || '#eee' }} />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{m.brand} {m.color && `· ${m.color}`}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)} data-testid={`cricut-edit-material-${m.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
                  {m.low_stock && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="w-2.5 h-2.5 mr-1" />Stock basso</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Costo unitario</p>
                    <p className="font-bold text-primary">€{m.unit_cost.toFixed(4)}/{UNIT_LABELS[m.unit_of_measure] || m.unit_of_measure}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Sfrido</p>
                    <p className="font-semibold">{m.waste_percent}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Rimanenza</p>
                    <p className="font-semibold">{m.remaining_qty} {UNIT_LABELS[m.unit_of_measure] || m.unit_of_measure}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Acquistato</p>
                    <p className="font-semibold">€{m.purchase_price.toFixed(2)} / {m.purchase_qty}</p>
                  </div>
                </div>
                {m.supplier && <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">Fornitore: {m.supplier}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifica materiale' : 'Nuovo materiale'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="cricut-material-name" /></Field>
            <Field label="Categoria">
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{meta.material_categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Marca"><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></Field>
            <Field label="Colore"><Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="es. Rosso, Nero" /></Field>
            <Field label="Codice colore">
              <div className="flex gap-2 items-center">
                <input type="color" value={form.color_hex} onChange={e => setForm({ ...form, color_hex: e.target.value })} className="h-9 w-14 rounded border border-border/50 cursor-pointer bg-transparent" />
                <Input value={form.color_hex} onChange={e => setForm({ ...form, color_hex: e.target.value })} className="flex-1 font-mono text-xs" />
              </div>
            </Field>
            <Field label="Fornitore"><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></Field>
            <Field label="Prezzo acquisto (€) *"><Input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label="Quantità acquistata *"><Input type="number" step="0.01" value={form.purchase_qty} onChange={e => setForm({ ...form, purchase_qty: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label="Unità di misura">
              <Select value={form.unit_of_measure} onValueChange={v => setForm({ ...form, unit_of_measure: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{meta.units.map(u => <SelectItem key={u} value={u}>{UNIT_LABELS[u] || u}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Sfrido predefinito (%)"><Input type="number" step="1" value={form.waste_percent} onChange={e => setForm({ ...form, waste_percent: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label="Rimanenza attuale"><Input type="number" step="0.01" value={form.remaining_qty ?? ''} onChange={e => setForm({ ...form, remaining_qty: e.target.value === '' ? null : parseFloat(e.target.value) })} placeholder="Vuoto = quantità acquistata" /></Field>
            <Field label="Soglia stock basso"><Input type="number" step="0.01" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: parseFloat(e.target.value) || 0 })} placeholder="0 = disattivo" /></Field>
            <div className="sm:col-span-2">
              <Label className="text-xs">Note</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          {form.purchase_price > 0 && form.purchase_qty > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs">
              Costo unitario calcolato: <span className="font-bold text-primary">€{(form.purchase_price / form.purchase_qty).toFixed(4)}</span> per {UNIT_LABELS[form.unit_of_measure] || form.unit_of_measure}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={save} data-testid="cricut-material-save">Salva</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ MACCHINE ============
function MachinesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyMachine);

  const load = async () => {
    setLoading(true);
    try { setItems(await getCricutMachines()); }
    catch { toast.error('Errore caricamento macchine'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyMachine); setDialogOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...emptyMachine, ...m }); setDialogOpen(true); };
  const save = async () => {
    if (!form.name.trim()) return toast.error('Nome obbligatorio');
    try {
      if (editing) { await updateCricutMachine(editing.id, form); toast.success('Macchina aggiornata'); }
      else { await createCricutMachine(form); toast.success('Macchina aggiunta'); }
      setDialogOpen(false); load();
    } catch { toast.error('Errore salvataggio'); }
  };
  const remove = async (id) => {
    if (!confirm('Eliminare questa macchina?')) return;
    try { await deleteCricutMachine(id); toast.success('Eliminata'); load(); }
    catch { toast.error('Errore'); }
  };

  const simpleAmort = form.life_hours > 0 ? form.price / form.life_hours : 0;
  const fiscalAmort = (form.fiscal_years > 0 && form.monthly_hours > 0) ? form.price / (form.fiscal_years * 12 * form.monthly_hours) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} macchine</p>
        <Button onClick={openNew} size="sm" data-testid="cricut-add-machine"><Plus className="w-4 h-4 mr-1" />Nuova macchina</Button>
      </div>

      {loading ? <div className="text-center py-8 text-muted-foreground text-sm">Caricamento...</div> : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <Cpu className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nessuna macchina. Aggiungi Cricut, Silhouette o altre.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(m => (
            <Card key={m.id} className="group hover:shadow-md transition-shadow" data-testid={`cricut-machine-${m.id}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{m.brand} {m.model && `· ${m.model}`}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={m.active ? 'default' : 'secondary'} className="text-[10px]">
                    {m.active ? 'Attiva' : <><PowerOff className="w-2.5 h-2.5 mr-1" />Disattiva</>}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {m.amortization_formula === 'fiscal' ? 'Ammort. fiscale' : 'Ammort. semplice'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">€/h ammort.</p>
                    <p className="font-bold text-primary">€{m.hourly_amortization.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider"><Zap className="w-3 h-3 inline" /> €/h energia</p>
                    <p className="font-semibold">€{m.hourly_energy_cost.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Prezzo</p>
                    <p className="font-semibold">€{m.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Consumo</p>
                    <p className="font-semibold">{m.power_watts}W</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifica macchina' : 'Nuova macchina'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="es. La mia Maker" data-testid="cricut-machine-name" /></Field>
            <Field label="Marca">
              <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} list="cricut-brands" placeholder="es. Cricut, Silhouette" />
              <datalist id="cricut-brands"><option value="Cricut" /><option value="Silhouette" /><option value="Brother" /><option value="Siser" /><option value="Personalizzato" /></datalist>
            </Field>
            <Field label="Modello"><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} list="cricut-models" placeholder="es. Explore, Maker, Venture" />
              <datalist id="cricut-models"><option value="Explore" /><option value="Maker" /><option value="Venture" /><option value="Cameo" /><option value="ScanNCut" /></datalist>
            </Field>
            <Field label="Prezzo acquisto (€) *"><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label="Data acquisto"><Input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} /></Field>
            <Field label="Consumo elettrico (W)"><Input type="number" step="1" value={form.power_watts} onChange={e => setForm({ ...form, power_watts: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label="Costo energia (€/kWh)"><Input type="number" step="0.01" value={form.electricity_cost_kwh} onChange={e => setForm({ ...form, electricity_cost_kwh: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label="Stato">
              <Select value={form.active ? 'yes' : 'no'} onValueChange={v => setForm({ ...form, active: v === 'yes' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Attiva</SelectItem><SelectItem value="no">Disattiva</SelectItem></SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2 border-t border-border/40 pt-3 space-y-3">
              <Field label="Formula ammortamento">
                <Select value={form.amortization_formula} onValueChange={v => setForm({ ...form, amortization_formula: v })}>
                  <SelectTrigger data-testid="cricut-amort-formula"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Semplice (prezzo / ore vita)</SelectItem>
                    <SelectItem value="fiscal">Fiscale (prezzo / anni × ore/mese)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.amortization_formula === 'simple' ? (
                <Field label="Ore di vita previste"><Input type="number" step="10" value={form.life_hours} onChange={e => setForm({ ...form, life_hours: parseFloat(e.target.value) || 0 })} /></Field>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Anni di ammortamento"><Input type="number" step="1" value={form.fiscal_years} onChange={e => setForm({ ...form, fiscal_years: parseFloat(e.target.value) || 0 })} /></Field>
                  <Field label="Ore medie/mese"><Input type="number" step="1" value={form.monthly_hours} onChange={e => setForm({ ...form, monthly_hours: parseFloat(e.target.value) || 0 })} /></Field>
                </div>
              )}
            </div>
          </div>
          {form.price > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs space-y-1">
              <p>Ammortamento orario <span className="font-semibold">{form.amortization_formula === 'fiscal' ? 'fiscale' : 'semplice'}</span>: <span className="font-bold text-primary">€{(form.amortization_formula === 'fiscal' ? fiscalAmort : simpleAmort).toFixed(4)}/h</span></p>
              <p>Costo energia: <span className="font-bold text-primary">€{((form.power_watts / 1000) * form.electricity_cost_kwh).toFixed(4)}/h</span></p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={save} data-testid="cricut-machine-save">Salva</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ CONSUMABILI ============
function ConsumablesTab({ meta }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyConsumable);

  const load = async () => {
    setLoading(true);
    try { setItems(await getCricutConsumables()); }
    catch { toast.error('Errore caricamento consumabili'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyConsumable); setDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...emptyConsumable, ...c }); setDialogOpen(true); };
  const save = async () => {
    if (!form.name.trim()) return toast.error('Nome obbligatorio');
    try {
      if (editing) { await updateCricutConsumable(editing.id, form); toast.success('Consumabile aggiornato'); }
      else { await createCricutConsumable(form); toast.success('Consumabile aggiunto'); }
      setDialogOpen(false); load();
    } catch { toast.error('Errore salvataggio'); }
  };
  const remove = async (id) => {
    if (!confirm('Eliminare?')) return;
    try { await deleteCricutConsumable(id); toast.success('Eliminato'); load(); }
    catch { toast.error('Errore'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} consumabili</p>
        <Button onClick={openNew} size="sm" data-testid="cricut-add-consumable"><Plus className="w-4 h-4 mr-1" />Nuovo consumabile</Button>
      </div>

      {loading ? <div className="text-center py-8 text-muted-foreground text-sm">Caricamento...</div> : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <PackageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nessun consumabile. Aggiungi lame, tappetini, penne...</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(c => (
            <Card key={c.id} className="group hover:shadow-md transition-shadow" data-testid={`cricut-consumable-${c.id}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <Badge variant="outline" className="text-[10px] mt-0.5">{c.type}</Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Prezzo</p>
                    <p className="font-semibold">€{c.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Vita utile</p>
                    <p className="font-semibold">{c.life_uses}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider">€/uso</p>
                    <p className="font-bold text-primary">€{c.cost_per_use.toFixed(4)}</p>
                  </div>
                </div>
                {c.notes && <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40 line-clamp-2">{c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Modifica consumabile' : 'Nuovo consumabile'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="es. Lama Fine Point" data-testid="cricut-consumable-name" /></Field>
            <Field label="Tipo">
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{meta.consumable_types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Prezzo (€) *"><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></Field>
            <Field label="Vita utile (lavorazioni) *"><Input type="number" step="1" value={form.life_uses} onChange={e => setForm({ ...form, life_uses: parseFloat(e.target.value) || 0 })} /></Field>
            <div className="sm:col-span-2">
              <Label className="text-xs">Note</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          {form.price > 0 && form.life_uses > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs">
              Costo per lavorazione: <span className="font-bold text-primary">€{(form.price / form.life_uses).toFixed(4)}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={save} data-testid="cricut-consumable-save">Salva</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
