import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { Calculator, Plus, Trash2, Lock, UserPlus, Receipt } from 'lucide-react';
import { DecimalInput } from '../components/DecimalInput';
import { useDemoBanner } from '../components/PublicScripts';
import { PublicBannerSlot } from '../components/PublicBannerSlot';
import { AffiliateLinks } from '../components/AffiliateLinks';
import { recordDemoVisit } from '../lib/api';

export default function DemoCalculatorPage() {
  const demoBanner = useDemoBanner();

  // Record visit once
  useState(() => { recordDemoVisit().catch(() => {}); });

  const [filaments, setFilaments] = useState([
    { name: 'PLA', color: '#000000', cost_per_gram: 0.02, grams_used: 50 }
  ]);
  const [printer, setPrinter] = useState({
    name: '', cost: 300, life_hours: 2000, power_w: 200, electricity_cost_kwh: 0.25
  });
  const [printTimeH, setPrintTimeH] = useState(2);
  const [printTimeM, setPrintTimeM] = useState(0);
  const [designTimeH, setDesignTimeH] = useState(0);
  const [designTimeM, setDesignTimeM] = useState(0);
  const [marginPercent, setMarginPercent] = useState(30);
  const [quantity, setQuantity] = useState(1);
  const [useManualPrice, setUseManualPrice] = useState(false);
  const [manualPrice, setManualPrice] = useState(0);
  const [result, setResult] = useState(null);

  const addFilament = () => setFilaments(prev => [...prev, { name: 'PLA', color: '#ffffff', cost_per_gram: 0.02, grams_used: 0 }]);
  const removeFilament = (i) => setFilaments(prev => prev.filter((_, idx) => idx !== i));
  const updateFilament = (i, field, val) => setFilaments(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));

  const calculate = useCallback(() => {
    const printHours = printTimeH + printTimeM / 60;
    const designHours = designTimeH + designTimeM / 60;

    const materialCost = filaments.reduce((sum, f) => sum + (f.cost_per_gram * f.grams_used), 0);
    const totalGrams = filaments.reduce((sum, f) => sum + f.grams_used, 0);
    const electricityCost = (printer.power_w / 1000) * printHours * printer.electricity_cost_kwh;
    const depreciationCost = printer.life_hours > 0 ? (printer.cost / printer.life_hours) * printHours : 0;
    const designCost = designHours * 10;

    const costPerUnit = materialCost + electricityCost + depreciationCost + designCost;
    const costTotal = costPerUnit * quantity;

    let pricePerUnit, priceTotal;
    if (useManualPrice && manualPrice > 0) {
      pricePerUnit = manualPrice;
      priceTotal = manualPrice * quantity;
    } else {
      pricePerUnit = costPerUnit * (1 + marginPercent / 100);
      priceTotal = pricePerUnit * quantity;
    }

    const profitPerUnit = pricePerUnit - costPerUnit;
    const profitTotal = profitPerUnit * quantity;
    const actualMargin = costPerUnit > 0 ? ((pricePerUnit - costPerUnit) / costPerUnit) * 100 : 0;

    setResult({
      materialCost: materialCost,
      electricityCost: electricityCost,
      depreciationCost: depreciationCost,
      designCost: designCost,
      totalGrams: totalGrams,
      costPerUnit, costTotal,
      pricePerUnit, priceTotal,
      profitPerUnit, profitTotal,
      actualMargin, quantity
    });
  }, [filaments, printer, printTimeH, printTimeM, designTimeH, designTimeM, marginPercent, quantity, useManualPrice, manualPrice]);

  // Auto-calculate on any change
  useState(() => { calculate(); });

  return (
    <div className="min-h-screen bg-background" data-testid="demo-calculator-page">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/landing" className="font-heading font-bold text-lg tracking-tight">Artes&Tramas</Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">DEMO</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm" data-testid="demo-login-btn">
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Accedi
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" data-testid="demo-register-btn">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Registrati Gratis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <PublicBannerSlot page="demo" position="header" />

        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold">Calcolatore Costi Stampa 3D</h1>
          <p className="text-muted-foreground text-sm mt-1">Prova il calcolatore — inserisci i tuoi dati e scopri il costo reale</p>
        </div>

        {/* Banner registrazione */}
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between flex-wrap gap-2" data-testid="demo-banner">
          <p className="text-sm">
            <Lock className="w-3.5 h-3.5 inline mr-1.5" />
            Versione demo — <strong>Registrati gratis</strong> per sbloccare: <strong>calcolo professionale con IVA, tasso fallimento, costi manutenzione</strong>, salvataggio dati, import .3mf, vendite, clienti, preventivi PDF
          </p>
          <Link to="/register"><Button size="sm">Registrati</Button></Link>
        </div>

        {/* Admin custom banner */}
        {demoBanner && (
          <div className="mb-4 p-3 rounded-lg text-white text-center" style={{ backgroundColor: demoBanner.color }} data-testid="demo-custom-banner">
            {demoBanner.link ? (
              <a href={demoBanner.link} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:underline">{demoBanner.text}</a>
            ) : (
              <p className="text-sm font-semibold">{demoBanner.text}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-4">
          {/* Printer + Filaments */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Parametri Stampante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Printer Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Costo Stampante (€)</Label>
                  <DecimalInput value={printer.cost} onChange={v => { setPrinter(p => ({...p, cost: v})); calculate(); }} className="h-8 text-xs font-mono" data-testid="demo-printer-cost" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vita Stimata (ore)</Label>
                  <DecimalInput value={printer.life_hours} onChange={v => { setPrinter(p => ({...p, life_hours: v})); calculate(); }} className="h-8 text-xs font-mono" data-testid="demo-printer-life" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Potenza (Watt)</Label>
                  <DecimalInput value={printer.power_w} onChange={v => { setPrinter(p => ({...p, power_w: v})); calculate(); }} className="h-8 text-xs font-mono" data-testid="demo-printer-power" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Costo kWh (€)</Label>
                  <DecimalInput value={printer.electricity_cost_kwh} onChange={v => { setPrinter(p => ({...p, electricity_cost_kwh: v})); calculate(); }} className="h-8 text-xs font-mono" data-testid="demo-printer-kwh" />
                </div>
              </div>

              <Separator />

              {/* Filaments */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Filamenti</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { addFilament(); calculate(); }} data-testid="demo-add-filament">
                  <Plus className="w-3 h-3 mr-1" /> Aggiungi
                </Button>
              </div>
              {filaments.map((f, i) => (
                <div key={i} className="grid grid-cols-[32px_1fr_80px_80px_28px] gap-2 items-end" data-testid={`demo-filament-${i}`}>
                  <div>
                    <input type="color" value={f.color} onChange={e => updateFilament(i, 'color', e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                  </div>
                  <div className="space-y-0.5">
                    {i === 0 && <Label className="text-[10px] text-muted-foreground">Costo/g (€)</Label>}
                    <DecimalInput value={f.cost_per_gram} onChange={v => { updateFilament(i, 'cost_per_gram', v); calculate(); }} className="h-7 text-xs font-mono" data-testid={`demo-cost-g-${i}`} />
                  </div>
                  <div className="space-y-0.5">
                    {i === 0 && <Label className="text-[10px] text-muted-foreground">Grammi</Label>}
                    <DecimalInput value={f.grams_used} onChange={v => { updateFilament(i, 'grams_used', v); calculate(); }} className="h-7 text-xs font-mono" data-testid={`demo-grams-${i}`} />
                  </div>
                  <div className="text-right font-mono text-xs text-muted-foreground pt-1">
                    €{(f.cost_per_gram * f.grams_used).toFixed(2)}
                  </div>
                  {filaments.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { removeFilament(i); calculate(); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Time + Margin */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                Stampa e Margine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Print Time */}
              <div className="space-y-1">
                <Label className="text-xs">Tempo Stampa</Label>
                <div className="flex items-center gap-1">
                  <Input type="number" min="0" value={printTimeH} onChange={e => { setPrintTimeH(parseInt(e.target.value)||0); calculate(); }} className="w-16 h-8 font-mono text-xs" data-testid="demo-print-h" />
                  <span className="text-xs text-muted-foreground">h</span>
                  <Input type="number" min="0" max="59" value={printTimeM} onChange={e => { setPrintTimeM(parseInt(e.target.value)||0); calculate(); }} className="w-16 h-8 font-mono text-xs" data-testid="demo-print-m" />
                  <span className="text-xs text-muted-foreground">m</span>
                </div>
              </div>

              {/* Design Time */}
              <div className="space-y-1">
                <Label className="text-xs">Tempo Design</Label>
                <div className="flex items-center gap-1">
                  <Input type="number" min="0" value={designTimeH} onChange={e => { setDesignTimeH(parseInt(e.target.value)||0); calculate(); }} className="w-16 h-8 font-mono text-xs" data-testid="demo-design-h" />
                  <span className="text-xs text-muted-foreground">h</span>
                  <Input type="number" min="0" max="59" value={designTimeM} onChange={e => { setDesignTimeM(parseInt(e.target.value)||0); calculate(); }} className="w-16 h-8 font-mono text-xs" data-testid="demo-design-m" />
                  <span className="text-xs text-muted-foreground">m</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <Label className="text-xs">Quantita'</Label>
                <Input type="number" min="1" value={quantity} onChange={e => { setQuantity(parseInt(e.target.value)||1); calculate(); }} className="w-20 h-8 font-mono text-xs" data-testid="demo-quantity" />
              </div>

              <Separator />

              {/* Margin */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{useManualPrice ? 'Prezzo Manuale' : 'Margine %'}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Manuale</span>
                  <Switch checked={useManualPrice} onCheckedChange={v => { setUseManualPrice(v); calculate(); }} />
                </div>
              </div>

              {useManualPrice ? (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prezzo per unita' (€)</Label>
                  <DecimalInput value={manualPrice} onChange={v => { setManualPrice(v); calculate(); }} placeholder="Es. 15.00" className="h-8 text-xs font-mono" data-testid="demo-manual-price" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Margine</span>
                    <span className="text-xs font-mono text-primary font-semibold">{marginPercent}%</span>
                  </div>
                  <Slider value={[marginPercent]} onValueChange={v => { setMarginPercent(v[0]); calculate(); }} min={0} max={200} step={5} data-testid="demo-margin-slider" />
                </div>
              )}

              <Button className="w-full" onClick={calculate} data-testid="demo-calculate-btn">
                <Calculator className="w-4 h-4 mr-2" /> Calcola
              </Button>

              {/* Premium features locked */}
              <div className="mt-4 p-3 rounded-md bg-muted/30 border border-border/40 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Funzioni disponibili con account gratuito:
                </p>
                <ul className="text-[11px] text-muted-foreground space-y-1 ml-4">
                  <li>- Salva filamenti e stampanti nel tuo profilo</li>
                  <li>- Importa file .3mf (Bambu, Creality, Orca)</li>
                  <li>- Registra e traccia vendite</li>
                  <li>- Gestione clienti e rubrica</li>
                  <li>- Genera preventivi PDF professionali</li>
                  <li>- Dashboard con statistiche e grafici</li>
                  <li>- Export dati in CSV</li>
                </ul>
                <Link to="/register">
                  <Button size="sm" className="w-full mt-2" data-testid="demo-register-inline">
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Registrati Gratis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Riepilogo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result ? (
                <>
                  {/* Filament costs */}
                  <div className="space-y-1">
                    {filaments.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full border border-border/40" style={{ backgroundColor: f.color }} />
                        <span className="flex-1">{f.name}</span>
                        <span className="font-mono text-muted-foreground">{f.grams_used}g</span>
                        <span className="font-mono">€{(f.cost_per_gram * f.grams_used).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="border-dashed" />

                  {/* Cost breakdown */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materiale ({result.totalGrams.toFixed(1)}g)</span>
                      <span className="font-mono">€{result.materialCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Elettricita'</span>
                      <span className="font-mono">€{result.electricityCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ammortamento</span>
                      <span className="font-mono">€{result.depreciationCost.toFixed(2)}</span>
                    </div>
                    {result.designCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Design</span>
                        <span className="font-mono">€{result.designCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm font-semibold">
                    <span>Costo {quantity > 1 ? 'Unitario' : 'Totale'}</span>
                    <span className="font-mono">€{result.costPerUnit.toFixed(2)}</span>
                  </div>

                  {quantity > 1 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Costo Totale (x{quantity})</span>
                      <span className="font-mono">€{result.costTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-heading font-bold">PREZZO</span>
                      <span className="text-2xl font-mono font-bold text-primary">€{result.pricePerUnit.toFixed(2)}</span>
                    </div>
                    {quantity > 1 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Totale (x{quantity})</span>
                        <span className="font-mono font-bold text-primary">€{result.priceTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Profitto ({result.actualMargin.toFixed(0)}%)</span>
                      <span className="font-mono font-semibold text-emerald-500">+€{result.profitPerUnit.toFixed(2)}</span>
                    </div>
                    {quantity > 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Profitto Totale</span>
                        <span className="font-mono font-semibold text-emerald-500">+€{result.profitTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Locked actions */}
                  <div className="mt-3 space-y-1.5">
                    <Link to="/register" className="block">
                      <Button variant="outline" className="w-full opacity-70" data-testid="demo-locked-save">
                        <Lock className="w-3.5 h-3.5 mr-2" /> Registrati per salvare
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Clicca "Calcola" per vedere i risultati
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <PublicBannerSlot page="demo" position="content" />

        {/* Risorse consigliate per chi prova il calcolatore */}
        <AffiliateLinks placement="demo" />
      </div>

      <PublicBannerSlot page="demo" position="footer" />
    </div>
  );
}
