import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Scissors, ArrowLeft, Save, Trash2, Plus, Info, Layers, Cpu, Package, Truck, Percent, DollarSign, Calculator as CalcIcon, Clock, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCricutMaterials, getCricutMachines, getCricutConsumables,
  getCricutProject, createCricutProject, updateCricutProject, createSale,
} from '../lib/api';
import { NumericInput } from '../components/NumericInput';

const emptyProject = {
  name: '', client: '', category: '', date: new Date().toISOString().slice(0, 10), notes: '',
  material_id: '', material_qty: 0, material_dimensions: '',
  time_prep_min: 0, time_cut_min: 0, time_weeding_min: 0, time_transfer_min: 0, time_press_min: 0, time_assembly_min: 0,
  labor_rate_hour: 15,
  machine_id: '', machine_hours: 0,
  consumables: [], extra_materials: [],
  pkg_bag: 0, pkg_box: 0, pkg_cardstock: 0, pkg_label: 0, pkg_thank_card: 0, pkg_ribbon: 0,
  marketplace_fee_percent: 0, payment_fee_percent: 0, overhead_fixed: 0, vat_percent: 0,
  margin_percent: 50, manual_sale_price: null,
  include_in_3d_calc: false,
};

// Live compute (mirror del backend `_compute_cricut_project`)
function computeProject(p, matMap, machMap, consMap) {
  const matCost = (mat, qty) => {
    if (!mat || !qty) return { noWaste: 0, withWaste: 0 };
    const unit = mat.purchase_qty > 0 ? mat.purchase_price / mat.purchase_qty : 0;
    const noWaste = unit * Number(qty || 0);
    return { noWaste, withWaste: noWaste * (1 + (Number(mat.waste_percent || 0)) / 100) };
  };
  const main = matMap[p.material_id];
  const { noWaste: mcNoWaste, withWaste: mc } = matCost(main, p.material_qty);
  let extras = 0;
  const extrasDetail = [];
  (p.extra_materials || []).forEach(e => {
    const em = matMap[e.material_id];
    if (!em) return;
    const { withWaste } = matCost(em, e.qty);
    extras += withWaste;
    extrasDetail.push({ ...e, name: em.name, cost: withWaste });
  });
  const totalMat = mc + extras;
  const totalMin = Number(p.time_prep_min || 0) + Number(p.time_cut_min || 0) + Number(p.time_weeding_min || 0) + Number(p.time_transfer_min || 0) + Number(p.time_press_min || 0) + Number(p.time_assembly_min || 0);
  const totalH = totalMin / 60;
  const laborCost = totalH * Number(p.labor_rate_hour || 0);
  const machine = machMap[p.machine_id];
  const machHours = Number(p.machine_hours || 0);
  const machAmort = machine ? machine.hourly_amortization * machHours : 0;
  const machEnergy = machine ? machine.hourly_energy_cost * machHours : 0;
  let consCost = 0;
  const consDetail = [];
  (p.consumables || []).forEach(c => {
    const cd = consMap[c.consumable_id];
    if (!cd) return;
    const perUse = cd.life_uses > 0 ? cd.price / cd.life_uses : 0;
    const cost = perUse * Number(c.uses || 0);
    consCost += cost;
    consDetail.push({ ...c, name: cd.name, type: cd.type, cost });
  });
  const pkg = ['pkg_bag', 'pkg_box', 'pkg_cardstock', 'pkg_label', 'pkg_thank_card', 'pkg_ribbon'].reduce((s, k) => s + Number(p[k] || 0), 0);
  const production = totalMat + laborCost + machAmort + machEnergy + consCost + pkg;
  const margin = Number(p.margin_percent || 0);
  const manual = p.manual_sale_price;
  const price = (manual != null && Number(manual) > 0) ? Number(manual) : production * (1 + margin / 100);
  const mkt = price * Number(p.marketplace_fee_percent || 0) / 100;
  const pay = price * Number(p.payment_fee_percent || 0) / 100;
  const vat = price * Number(p.vat_percent || 0) / 100;
  const overhead = Number(p.overhead_fixed || 0);
  const indirect = mkt + pay + vat + overhead;
  const totalCost = production + indirect;
  const profit = price - totalCost;
  const marginActual = price > 0 ? (profit / price * 100) : 0;
  return {
    material_cost: mc, material_cost_no_waste: mcNoWaste, extra_materials_cost: extras, total_material_cost: totalMat, extras_detail: extrasDetail,
    total_time_min: totalMin, total_time_hours: totalH, labor_cost: laborCost,
    machine_amort_cost: machAmort, machine_energy_cost: machEnergy, machine_name: machine?.name || '',
    consumables_detail: consDetail, consumables_cost: consCost,
    packaging_cost: pkg, marketplace_cost: mkt, payment_cost: pay, vat_cost: vat, overhead_cost: overhead, indirect_total: indirect,
    production_cost: production, total_cost: totalCost, recommended_price: price, net_profit: profit, margin_actual: marginActual,
  };
}

const eu = (n) => `€${(Number(n) || 0).toFixed(2)}`;
const eu4 = (n) => `€${(Number(n) || 0).toFixed(4)}`;

export default function CricutCalculatorPage() {
  const { pid } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [machines, setMachines] = useState([]);
  const [consumables, setConsumables] = useState([]);
  const [form, setForm] = useState(emptyProject);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!pid);

  useEffect(() => {
    Promise.all([getCricutMaterials(), getCricutMachines(), getCricutConsumables()])
      .then(([m, mc, c]) => { setMaterials(m); setMachines(mc); setConsumables(c); })
      .catch(() => toast.error('Errore caricamento dati'));
  }, []);

  useEffect(() => {
    if (!pid) return;
    getCricutProject(pid).then(p => {
      setForm({ ...emptyProject, ...p });
      setLoading(false);
    }).catch(() => { toast.error('Preventivo non trovato'); setLoading(false); });
  }, [pid]);

  // Precompila cliente da query string
  useEffect(() => {
    const client = params.get('client');
    if (client && !form.client) setForm(f => ({ ...f, client }));
  }, [params, form.client]);

  const matMap = useMemo(() => Object.fromEntries(materials.map(m => [m.id, m])), [materials]);
  const machMap = useMemo(() => Object.fromEntries(machines.map(m => [m.id, m])), [machines]);
  const consMap = useMemo(() => Object.fromEntries(consumables.map(c => [c.id, c])), [consumables]);
  const calc = useMemo(() => computeProject(form, matMap, machMap, consMap), [form, matMap, machMap, consMap]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  // Nota: NumericInput chiama onChange(number) direttamente (non un evento)

  const addConsumable = () => {
    if (!consumables.length) return toast.error('Aggiungi prima dei consumabili in "Gestisci"');
    setForm(f => ({ ...f, consumables: [...(f.consumables || []), { consumable_id: consumables[0].id, uses: 1 }] }));
  };
  const removeConsumable = (i) => setForm(f => ({ ...f, consumables: f.consumables.filter((_, idx) => idx !== i) }));
  const patchConsumable = (i, k, v) => setForm(f => ({ ...f, consumables: f.consumables.map((c, idx) => idx === i ? { ...c, [k]: v } : c) }));

  const addExtraMaterial = () => {
    if (!materials.length) return toast.error('Aggiungi prima dei materiali');
    setForm(f => ({ ...f, extra_materials: [...(f.extra_materials || []), { material_id: materials[0].id, qty: 1 }] }));
  };
  const removeExtra = (i) => setForm(f => ({ ...f, extra_materials: f.extra_materials.filter((_, idx) => idx !== i) }));
  const patchExtra = (i, k, v) => setForm(f => ({ ...f, extra_materials: f.extra_materials.map((c, idx) => idx === i ? { ...c, [k]: v } : c) }));

  const save = async () => {
    if (!form.name.trim()) return toast.error('Il nome del progetto è obbligatorio');
    setSaving(true);
    try {
      if (pid) {
        await updateCricutProject(pid, form);
        toast.success('Preventivo aggiornato');
      } else {
        const created = await createCricutProject(form);
        toast.success('Preventivo salvato');
        navigate(`/cricut/calculator/${created.id}`, { replace: true });
      }
    } catch { toast.error('Errore salvataggio'); }
    finally { setSaving(false); }
  };

  const saveAsSale = async () => {
    if (!form.name.trim()) return toast.error('Nome progetto obbligatorio');
    if (!(calc.recommended_price > 0)) return toast.error('Nessun prezzo calcolato');
    // Salva prima il preventivo se non ancora salvato (per avere il pid)
    let projectId = pid;
    try {
      if (!projectId) {
        const created = await createCricutProject(form);
        projectId = created.id;
        navigate(`/cricut/calculator/${created.id}`, { replace: true });
      } else {
        await updateCricutProject(projectId, form);
      }
      await createSale({
        date: new Date().toISOString().split('T')[0],
        product_name: form.name,
        print_time_hours: 0,
        printer_id: '',
        sale_price: calc.recommended_price,
        quantity: 1,
        source_module: 'cricut',
        cricut_project_id: projectId,
      });
      toast.success('Vendita Cricut registrata!');
    } catch { toast.error('Errore registrazione vendita'); }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Caricamento preventivo...</div>;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cricut')} data-testid="calc-back"><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-md"><Scissors className="w-4 h-4" /></div>
            <div>
              <h1 className="text-xl font-heading font-bold">{pid ? 'Modifica preventivo' : 'Nuovo preventivo Cricut'}</h1>
              <p className="text-[11px] text-muted-foreground">Compila le sezioni, i totali si aggiornano in tempo reale</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveAsSale} data-testid="calc-save-sale" title="Salva come vendita">
            <ShoppingCart className="w-4 h-4 mr-1.5" />Vendita
          </Button>
          <Button onClick={save} disabled={saving} data-testid="calc-save"><Save className="w-4 h-4 mr-1.5" />{saving ? 'Salvo...' : 'Salva'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">

          {/* INFO */}
          <Section icon={Info} title="Informazioni progetto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome progetto *"><Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="es. T-shirt personalizzate" data-testid="calc-name" /></Field>
              <Field label="Cliente"><Input value={form.client} onChange={e => update('client', e.target.value)} /></Field>
              <Field label="Categoria"><Input value={form.category} onChange={e => update('category', e.target.value)} placeholder="es. Abbigliamento, Decorazioni" /></Field>
              <Field label="Data"><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} /></Field>
              <div className="sm:col-span-2"><Label className="text-xs">Note</Label><Textarea rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} /></div>
              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="include_in_3d_calc"
                  checked={!!form.include_in_3d_calc}
                  onChange={e => update('include_in_3d_calc', e.target.checked)}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                  data-testid="calc-include-3d"
                />
                <label htmlFor="include_in_3d_calc" className="text-xs cursor-pointer select-none">
                  <b>Aggiungi al calcolatore Stampa 3D</b> — apparirà come lavorazione selezionabile
                </label>
              </div>
            </div>
          </Section>

          {/* MATERIALE */}
          <Section icon={Layers} title="Materiale principale" right={<span className="text-xs text-muted-foreground">Costo con sfrido: <b className="text-primary">{eu(calc.material_cost)}</b></span>}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Materiale</Label>
                <Select value={form.material_id || 'none'} onValueChange={v => update('material_id', v === 'none' ? '' : v)}>
                  <SelectTrigger data-testid="calc-material"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nessuno —</SelectItem>
                    {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name} · {eu4(m.unit_cost)}/{m.unit_of_measure}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Quantità utilizzata"><NumericInput step="0.01" value={form.material_qty} onChange={v => update('material_qty', v)} data-testid="calc-material-qty" /></Field>
              <Field label="Dimensioni (testo libero)"><Input value={form.material_dimensions} onChange={e => update('material_dimensions', e.target.value)} placeholder="es. 20x30 cm" /></Field>
              {matMap[form.material_id] && (
                <div className="sm:col-span-2 text-[11px] text-muted-foreground bg-muted/30 rounded-md px-2 py-1.5 self-end">
                  Sfrido: <b>{matMap[form.material_id].waste_percent}%</b> · Senza sfrido: {eu4(calc.material_cost_no_waste)}
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Materiali aggiuntivi</p>
                <Button size="sm" variant="ghost" onClick={addExtraMaterial}><Plus className="w-3.5 h-3.5 mr-1" />Aggiungi</Button>
              </div>
              {(form.extra_materials || []).length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">Nessun materiale aggiuntivo</p>
              ) : (
                <div className="space-y-2">
                  {form.extra_materials.map((em, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <Select value={em.material_id} onValueChange={v => patchExtra(i, 'material_id', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <NumericInput step="0.01" value={em.qty} onChange={v => patchExtra(i, 'qty', v)} className="col-span-3 h-8 text-xs" placeholder="Qty" />
                      <span className="col-span-2 text-xs text-primary font-semibold text-right">{eu4((calc.extras_detail[i]?.cost) || 0)}</span>
                      <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-destructive" onClick={() => removeExtra(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* LAVORAZIONE */}
          <Section icon={Clock} title="Tempi di lavorazione" right={<span className="text-xs text-muted-foreground">Totale <b>{Math.round(calc.total_time_min)} min</b> · Manodopera <b className="text-primary">{eu(calc.labor_cost)}</b></span>}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['time_prep_min', 'Preparazione'],
                ['time_cut_min', 'Taglio'],
                ['time_weeding_min', 'Spellicolatura'],
                ['time_transfer_min', 'Applicazione TT'],
                ['time_press_min', 'Pressatura'],
                ['time_assembly_min', 'Assemblaggio'],
              ].map(([k, lab]) => (
                <Field key={k} label={`${lab} (min)`}>
                  <NumericInput step="1" value={form[k]} onChange={v => update(k, v)} className="h-9" data-testid={`calc-${k}`} />
                </Field>
              ))}
              <Field label="Costo orario manodopera (€/h)">
                <NumericInput step="0.5" value={form.labor_rate_hour} onChange={v => update('labor_rate_hour', v)} className="h-9" />
              </Field>
            </div>
          </Section>

          {/* MACCHINA */}
          <Section icon={Cpu} title="Macchina" right={<span className="text-xs text-muted-foreground">Ammort. <b>{eu(calc.machine_amort_cost)}</b> · Energia <b>{eu(calc.machine_energy_cost)}</b></span>}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs">Macchina utilizzata</Label>
                <Select value={form.machine_id || 'none'} onValueChange={v => update('machine_id', v === 'none' ? '' : v)}>
                  <SelectTrigger data-testid="calc-machine"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nessuna —</SelectItem>
                    {machines.map(m => <SelectItem key={m.id} value={m.id}>{m.name} · {eu4(m.hourly_amortization)}/h</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Ore di utilizzo"><NumericInput step="0.25" value={form.machine_hours} onChange={v => update('machine_hours', v)} data-testid="calc-machine-hours" /></Field>
            </div>
          </Section>

          {/* CONSUMABILI */}
          <Section icon={Package} title="Consumabili" right={<span className="text-xs text-muted-foreground">Totale <b className="text-primary">{eu(calc.consumables_cost)}</b></span>}>
            <div className="flex items-center justify-end mb-2">
              <Button size="sm" variant="ghost" onClick={addConsumable} data-testid="calc-add-consumable"><Plus className="w-3.5 h-3.5 mr-1" />Aggiungi</Button>
            </div>
            {(form.consumables || []).length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">Nessun consumabile</p>
            ) : (
              <div className="space-y-2">
                {form.consumables.map((c, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Select value={c.consumable_id} onValueChange={v => patchConsumable(i, 'consumable_id', v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{consumables.map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.name} · {cc.type}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <NumericInput step="1" value={c.uses} onChange={v => patchConsumable(i, 'uses', v)} className="col-span-3 h-8 text-xs" placeholder="Usi" />
                    <span className="col-span-2 text-xs text-primary font-semibold text-right">{eu4(calc.consumables_detail[i]?.cost || 0)}</span>
                    <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-destructive" onClick={() => removeConsumable(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* CONFEZIONE */}
          <Section icon={Truck} title="Confezione" right={<span className="text-xs text-muted-foreground">Totale <b className="text-primary">{eu(calc.packaging_cost)}</b></span>}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['pkg_bag', 'Sacchetto'],
                ['pkg_box', 'Scatola'],
                ['pkg_cardstock', 'Cartoncino'],
                ['pkg_label', 'Etichetta'],
                ['pkg_thank_card', 'Biglietto ringraziamento'],
                ['pkg_ribbon', 'Nastro'],
              ].map(([k, lab]) => (
                <Field key={k} label={`${lab} (€)`}>
                  <NumericInput step="0.01" value={form[k]} onChange={v => update(k, v)} className="h-9" />
                </Field>
              ))}
            </div>
          </Section>

          {/* COSTI INDIRETTI */}
          <Section icon={Percent} title="Costi indiretti" right={<span className="text-xs text-muted-foreground">Totale <b className="text-primary">{eu(calc.indirect_total)}</b></span>}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Commissioni marketplace (%)"><NumericInput step="0.1" value={form.marketplace_fee_percent} onChange={v => update('marketplace_fee_percent', v)} className="h-9" /></Field>
              <Field label="Commissioni pagamento (%)"><NumericInput step="0.1" value={form.payment_fee_percent} onChange={v => update('payment_fee_percent', v)} className="h-9" /></Field>
              <Field label="Costi generali (€)"><NumericInput step="0.01" value={form.overhead_fixed} onChange={v => update('overhead_fixed', v)} className="h-9" /></Field>
              <Field label="IVA (%)"><NumericInput step="1" value={form.vat_percent} onChange={v => update('vat_percent', v)} className="h-9" placeholder="0 = disattivata" /></Field>
            </div>
          </Section>
        </div>

        {/* RIEPILOGO */}
        <div className="space-y-4">
          <Card className="sticky top-4 border-primary/30 shadow-md">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <CalcIcon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Riepilogo costi</h3>
              </div>
              <SummaryRow label="Materiale (con sfrido)" val={calc.total_material_cost} />
              <SummaryRow label="Manodopera" val={calc.labor_cost} />
              <SummaryRow label="Ammortamento macchina" val={calc.machine_amort_cost} />
              <SummaryRow label="Energia" val={calc.machine_energy_cost} />
              <SummaryRow label="Consumabili" val={calc.consumables_cost} />
              <SummaryRow label="Confezione" val={calc.packaging_cost} />
              <div className="pt-2 border-t border-dashed border-border/60">
                <SummaryRow label="Costo produzione" val={calc.production_cost} bold />
              </div>
              <SummaryRow label="Costi indiretti" val={calc.indirect_total} muted />
              <div className="pt-2 border-t border-border/60">
                <SummaryRow label="Costo totale" val={calc.total_cost} bold />
              </div>

              <div className="pt-3 border-t border-border/60 space-y-2">
                <Field label="Margine desiderato (%)">
                  <NumericInput step="1" value={form.margin_percent} onChange={v => update('margin_percent', v)} disabled={form.manual_sale_price != null && form.manual_sale_price !== ''} data-testid="calc-margin" />
                </Field>
                <Field label="Prezzo manuale (€) — override">
                  <div className="flex gap-1.5">
                    <NumericInput step="0.01" value={form.manual_sale_price ?? 0} onChange={v => update('manual_sale_price', v || null)} placeholder="Auto da margine" data-testid="calc-manual-price" />
                    {form.manual_sale_price != null && form.manual_sale_price !== '' && <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => update('manual_sale_price', null)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                  </div>
                </Field>
              </div>

              <div className="pt-3 border-t border-primary/40 bg-primary/5 rounded-lg -mx-4 -mb-4 p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" />Prezzo vendita</span>
                  <span className="text-2xl font-bold text-primary" data-testid="calc-price">{eu(calc.recommended_price)}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Profitto netto</span>
                  <span className={`font-bold ${calc.net_profit >= 0 ? 'text-green-600' : 'text-destructive'}`} data-testid="calc-profit">{eu(calc.net_profit)}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Margine effettivo</span>
                  <Badge variant={calc.margin_actual >= 30 ? 'default' : 'secondary'} className="text-[10px]">{calc.margin_actual.toFixed(1)}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, right, children }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          {right}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
function Field({ label, children }) { return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>; }
function SummaryRow({ label, val, bold, muted }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? 'text-muted-foreground' : ''}`}>
      <span>{label}</span>
      <span className={bold ? 'font-bold text-primary' : ''}>{eu(val)}</span>
    </div>
  );
}
