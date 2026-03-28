import { useState, useEffect, useCallback } from 'react';
import { getFilaments, getPrinters, getAccessories, calculatePrint, createSale } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import { Calculator, Receipt, Save, AlertCircle, Package, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function CalculatorPage() {
  const [filaments, setFilaments] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    filament_id: '',
    printer_id: '',
    grams_used: 50,
    print_time_hours: 2,
    labor_hours: 0,
    design_hours: 0,
    margin_percent: 30,
    product_name: '',
    accessories: [] // [{accessory_id, quantity}]
  });

  const [result, setResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filamentsData, printersData, accessoriesData] = await Promise.all([
        getFilaments(),
        getPrinters(),
        getAccessories()
      ]);
      setFilaments(filamentsData);
      setPrinters(printersData);
      setAccessories(accessoriesData);
      
      if (filamentsData.length > 0) {
        setFormData(prev => ({ ...prev, filament_id: filamentsData[0].id }));
      }
      if (printersData.length > 0) {
        setFormData(prev => ({ ...prev, printer_id: printersData[0].id }));
      }
    } catch (err) {
      toast.error('Errore nel caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = useCallback(async () => {
    if (!formData.filament_id || !formData.printer_id) return;
    
    setCalculating(true);
    try {
      const data = await calculatePrint(formData);
      setResult(data);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setCalculating(false);
    }
  }, [formData]);

  useEffect(() => {
    if (formData.filament_id && formData.printer_id) {
      const timer = setTimeout(handleCalculate, 300);
      return () => clearTimeout(timer);
    }
  }, [formData, handleCalculate]);

  const handleAccessoryToggle = (accessoryId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        accessories: [...prev.accessories, { accessory_id: accessoryId, quantity: 1 }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        accessories: prev.accessories.filter(a => a.accessory_id !== accessoryId)
      }));
    }
  };

  const handleAccessoryQuantity = (accessoryId, delta) => {
    setFormData(prev => ({
      ...prev,
      accessories: prev.accessories.map(a => {
        if (a.accessory_id === accessoryId) {
          const newQty = Math.max(1, a.quantity + delta);
          return { ...a, quantity: newQty };
        }
        return a;
      })
    }));
  };

  const getAccessoryUsage = (accessoryId) => {
    return formData.accessories.find(a => a.accessory_id === accessoryId);
  };

  const handleSaveSale = async () => {
    if (!formData.product_name) {
      toast.error('Inserisci il nome del prodotto');
      return;
    }
    if (!result) {
      toast.error('Calcola prima i costi');
      return;
    }

    setSaving(true);
    try {
      await createSale({
        date: new Date().toISOString().split('T')[0],
        product_name: formData.product_name,
        filament_id: formData.filament_id,
        printer_id: formData.printer_id,
        grams_used: formData.grams_used,
        print_time_hours: formData.print_time_hours,
        labor_hours: formData.labor_hours,
        design_hours: formData.design_hours,
        sale_price: result.sale_price,
        accessories: formData.accessories
      });
      toast.success('Vendita registrata!');
      setFormData(prev => ({ ...prev, product_name: '', accessories: [] }));
      loadData(); // Refresh accessories stock
    } catch (err) {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const selectedFilament = filaments.find(f => f.id === formData.filament_id);
  const selectedPrinter = printers.find(p => p.id === formData.printer_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="calculator-loading">
        <div className="text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (filaments.length === 0 || printers.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn" data-testid="calculator-setup-required">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Calcolatore Costi</h1>
          <p className="text-muted-foreground mt-1">Calcola i costi di stampa in tempo reale</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="font-heading font-semibold mb-2">Configurazione richiesta</h3>
            <p className="text-muted-foreground mb-4">
              {filaments.length === 0 && 'Aggiungi almeno un filamento. '}
              {printers.length === 0 && 'Aggiungi almeno una stampante nelle impostazioni.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="calculator-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Calcolatore Costi</h1>
        <p className="text-muted-foreground mt-1">Calcola i costi di stampa in tempo reale</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <Calculator className="w-5 h-5" />
              Parametri Stampa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filamento</Label>
                <Select 
                  value={formData.filament_id} 
                  onValueChange={(v) => setFormData({...formData, filament_id: v})}
                >
                  <SelectTrigger data-testid="calc-filament-select">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filaments.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color_hex }} />
                          {f.material_type} - {f.color}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stampante</Label>
                <Select 
                  value={formData.printer_id} 
                  onValueChange={(v) => setFormData({...formData, printer_id: v})}
                >
                  <SelectTrigger data-testid="calc-printer-select">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.printer_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grammi Filamento</Label>
                <Input
                  type="number"
                  value={formData.grams_used}
                  onChange={(e) => setFormData({...formData, grams_used: parseFloat(e.target.value) || 0})}
                  className="font-mono"
                  data-testid="calc-grams-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Tempo Stampa (ore)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.print_time_hours}
                  onChange={(e) => setFormData({...formData, print_time_hours: parseFloat(e.target.value) || 0})}
                  className="font-mono"
                  data-testid="calc-time-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ore Lavoro</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.labor_hours}
                  onChange={(e) => setFormData({...formData, labor_hours: parseFloat(e.target.value) || 0})}
                  className="font-mono"
                  data-testid="calc-labor-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Ore Design</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.design_hours}
                  onChange={(e) => setFormData({...formData, design_hours: parseFloat(e.target.value) || 0})}
                  className="font-mono"
                  data-testid="calc-design-input"
                />
              </div>
            </div>

            {/* Accessories Section */}
            {accessories.length > 0 && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Accessori
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {accessories.map(acc => {
                    const usage = getAccessoryUsage(acc.id);
                    const isSelected = !!usage;
                    
                    return (
                      <div key={acc.id} className="flex items-center justify-between p-2 rounded-sm bg-muted/30 border border-border/40">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleAccessoryToggle(acc.id, checked)}
                            data-testid={`acc-checkbox-${acc.id}`}
                          />
                          <span className="text-sm">{acc.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">€{acc.unit_cost.toFixed(2)}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleAccessoryQuantity(acc.id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-mono text-sm w-6 text-center">{usage.quantity}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleAccessoryQuantity(acc.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Margine di Profitto</Label>
                <span className="font-mono text-primary font-semibold">{formData.margin_percent}%</span>
              </div>
              <Slider
                value={[formData.margin_percent]}
                onValueChange={(v) => setFormData({...formData, margin_percent: v[0]})}
                min={0}
                max={200}
                step={5}
                data-testid="calc-margin-slider"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Nome Prodotto (per registrare vendita)</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                placeholder="Es. Vaso geometrico"
                data-testid="calc-product-name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt / Results */}
        <Card className="border-border/40 calculator-receipt">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-heading">
              <Receipt className="w-5 h-5" />
              Riepilogo Costi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculating ? (
              <div className="text-center py-8 text-muted-foreground">
                Calcolo in corso...
              </div>
            ) : result ? (
              <>
                <div className="space-y-2 text-sm">
                  {selectedFilament && (
                    <div className="line-item">
                      <span className="text-muted-foreground">Filamento:</span>
                      <span className="font-mono">{selectedFilament.material_type} ({selectedFilament.brand})</span>
                    </div>
                  )}
                  {selectedPrinter && (
                    <div className="line-item">
                      <span className="text-muted-foreground">Stampante:</span>
                      <span className="font-mono">{selectedPrinter.printer_name}</span>
                    </div>
                  )}
                </div>

                <Separator className="border-dashed" />

                <div className="space-y-2">
                  <div className="line-item">
                    <span>Costo Materiale</span>
                    <span className="font-mono">€{result.material_cost.toFixed(2)}</span>
                  </div>
                  <div className="line-item">
                    <span>Costo Elettricità</span>
                    <span className="font-mono">€{result.electricity_cost.toFixed(2)}</span>
                  </div>
                  <div className="line-item">
                    <span>Ammortamento</span>
                    <span className="font-mono">€{result.depreciation_cost.toFixed(2)}</span>
                  </div>
                  {result.accessories_cost > 0 && (
                    <>
                      <div className="line-item">
                        <span>Accessori</span>
                        <span className="font-mono">€{result.accessories_cost.toFixed(2)}</span>
                      </div>
                      {result.accessories_details?.map((acc, i) => (
                        <div key={i} className="line-item text-xs text-muted-foreground pl-4">
                          <span>{acc.name} x{acc.quantity}</span>
                          <span className="font-mono">€{acc.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="line-item font-medium">
                    <span>Costo Produzione</span>
                    <span className="font-mono">€{result.production_cost.toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="border-dashed" />

                <div className="space-y-2">
                  <div className="line-item">
                    <span>Costo Lavoro</span>
                    <span className="font-mono">€{result.labor_cost.toFixed(2)}</span>
                  </div>
                  <div className="line-item">
                    <span>Costo Design</span>
                    <span className="font-mono">€{result.design_cost.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 pt-2">
                  <div className="line-item font-semibold">
                    <span>Costo Totale</span>
                    <span className="font-mono">€{result.total_cost.toFixed(2)}</span>
                  </div>
                  <div className="line-item text-muted-foreground">
                    <span>Margine ({result.margin_percent}%)</span>
                    <span className="font-mono">+€{(result.sale_price - result.total_cost).toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-primary">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-heading font-bold">PREZZO VENDITA</span>
                    <span className="text-2xl font-mono font-bold text-primary">€{result.sale_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Profitto Netto</span>
                    <span className="font-mono font-semibold text-emerald-500">+€{result.net_profit.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4" 
                  onClick={handleSaveSale}
                  disabled={saving || !formData.product_name}
                  data-testid="save-sale-btn"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvataggio...' : 'Registra Vendita'}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Seleziona filamento e stampante per calcolare
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
