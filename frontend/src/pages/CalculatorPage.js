import { useState, useEffect, useCallback, useRef } from 'react';
import { getFilaments, getPrinters, getAccessories, getRecentSales, calculatePrint, createSale, import3mf } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Calculator, Receipt, Save, AlertCircle, Package, Plus, Minus, Trash2, 
  Palette, Copy, History, Euro, Percent, Clock, Upload
} from 'lucide-react';
import { toast } from 'sonner';

// Helper functions for time conversion
const hoursToHM = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return { hours: h, minutes: m };
};

const hmToHours = (h, m) => {
  return (parseInt(h) || 0) + (parseInt(m) || 0) / 60;
};

const formatTime = (hours) => {
  const { hours: h, minutes: m } = hoursToHM(hours);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export default function CalculatorPage() {
  const [filaments, setFilaments] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useManualPrice, setUseManualPrice] = useState(false);

  // Separate state for hours and minutes
  const [printTimeH, setPrintTimeH] = useState(2);
  const [printTimeM, setPrintTimeM] = useState(0);
  const [designTimeH, setDesignTimeH] = useState(0);
  const [designTimeM, setDesignTimeM] = useState(0);
  const skipTimeEffect = useRef(false);
  const file3mfRef = useRef(null);
  const [importing3mf, setImporting3mf] = useState(false);

  const [formData, setFormData] = useState({
    filaments: [],
    printer_id: '',
    print_time_hours: 2,
    design_hours: 0,
    margin_percent: 30,
    manual_price: null,
    quantity: 1,
    product_name: '',
    accessories: []
  });

  const [result, setResult] = useState(null);

  // Update formData when time fields change (skip during copy)
  useEffect(() => {
    if (skipTimeEffect.current) {
      skipTimeEffect.current = false;
      return;
    }
    setFormData(prev => ({
      ...prev,
      print_time_hours: hmToHours(printTimeH, printTimeM),
      labor_hours: 0,
      design_hours: hmToHours(designTimeH, designTimeM)
    }));
  }, [printTimeH, printTimeM, designTimeH, designTimeM]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filamentsData, printersData, accessoriesData, recentData] = await Promise.all([
        getFilaments(),
        getPrinters(),
        getAccessories(),
        getRecentSales(10)
      ]);
      setFilaments(filamentsData);
      setPrinters(printersData);
      setAccessories(accessoriesData);
      setRecentSales(recentData);
      
      if (printersData.length > 0) {
        setFormData(prev => ({ ...prev, printer_id: printersData[0].id }));
      }
      if (filamentsData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          filaments: [{ filament_id: filamentsData[0].id, grams_used: 50 }]
        }));
      }
    } catch (err) {
      toast.error('Errore nel caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  const handle3mfImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting3mf(true);
    try {
      const data = await import3mf(file);
      if (data.total_time_seconds > 0) {
        const totalH = Math.floor(data.total_time_seconds / 3600);
        const totalM = Math.round((data.total_time_seconds % 3600) / 60);
        skipTimeEffect.current = true;
        setPrintTimeH(totalH);
        setPrintTimeM(totalM);
        setFormData(prev => ({
          ...prev,
          print_time_hours: data.total_time_hours || hmToHours(totalH, totalM),
        }));
      }
      if (data.total_filament_grams > 0 && formData.filaments.length > 0) {
        setFormData(prev => ({
          ...prev,
          filaments: prev.filaments.map((f, i) => i === 0 ? { ...f, grams_used: Math.round(data.total_filament_grams) } : f)
        }));
      }
      toast.success(`Importato: ${formatTime(data.total_time_hours)}h, ${Math.round(data.total_filament_grams)}g filamento`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Errore nell\'importazione del file .3mf');
    } finally {
      setImporting3mf(false);
      if (file3mfRef.current) file3mfRef.current.value = '';
    }
  };

  const handleCalculate = useCallback(async () => {
    if (formData.filaments.length === 0 || !formData.printer_id) return;
    
    setCalculating(true);
    try {
      const calcData = {
        ...formData,
        manual_price: useManualPrice ? formData.manual_price : null
      };
      const data = await calculatePrint(calcData);
      setResult(data);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setCalculating(false);
    }
  }, [formData, useManualPrice]);

  useEffect(() => {
    if (formData.filaments.length > 0 && formData.printer_id) {
      const timer = setTimeout(handleCalculate, 300);
      return () => clearTimeout(timer);
    }
  }, [formData, useManualPrice, handleCalculate]);

  // Copy from previous sale
  const copyFromSale = (sale) => {
    // Handle filaments - support both new format (array) and legacy
    let saleFilaments = sale.filaments || [];
    if (saleFilaments.length === 0 && sale.filament_id) {
      saleFilaments = [{ filament_id: sale.filament_id, grams_used: sale.grams_used || 50 }];
    }
    
    const validFilaments = saleFilaments.filter(sf => 
      filaments.some(f => f.id === sf.filament_id)
    );
    
    let saleAccessories = sale.accessories || [];
    const validAccessories = saleAccessories.filter(sa =>
      accessories.some(a => a.id === sa.accessory_id)
    );
    
    const printerExists = printers.some(p => p.id === sale.printer_id);
    
    // Skip the time useEffect to avoid race condition
    skipTimeEffect.current = true;
    
    // Update time display
    const printTime = hoursToHM(sale.print_time_hours || 2);
    setPrintTimeH(printTime.hours);
    setPrintTimeM(printTime.minutes);
    const designTime = hoursToHM(sale.design_hours || 0);
    setDesignTimeH(designTime.hours);
    setDesignTimeM(designTime.minutes);
    
    // Set formData with all values at once
    setFormData({
      filaments: validFilaments.length > 0 ? validFilaments : formData.filaments,
      printer_id: printerExists ? sale.printer_id : formData.printer_id,
      print_time_hours: sale.print_time_hours || 2,
      labor_hours: 0,
      design_hours: sale.design_hours || 0,
      quantity: sale.quantity || 1,
      accessories: validAccessories,
      product_name: sale.product_name || '',
      margin_percent: formData.margin_percent,
      manual_price: null
    });
    
    setUseManualPrice(false);
    setResult(null);
    
    toast.success(`Configurazione "${sale.product_name}" caricata`);
  };

  // Filament management
  const addFilament = () => {
    if (filaments.length === 0) return;
    const usedIds = formData.filaments.map(f => f.filament_id);
    const available = filaments.find(f => !usedIds.includes(f.id)) || filaments[0];
    setFormData(prev => ({
      ...prev,
      filaments: [...prev.filaments, { filament_id: available.id, grams_used: 30 }]
    }));
  };

  const removeFilament = (index) => {
    if (formData.filaments.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      filaments: prev.filaments.filter((_, i) => i !== index)
    }));
  };

  const updateFilament = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      filaments: prev.filaments.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  // Accessory management
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
          return { ...a, quantity: Math.max(1, a.quantity + delta) };
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
        filaments: formData.filaments,
        printer_id: formData.printer_id,
        print_time_hours: formData.print_time_hours,
        labor_hours: 0,
        design_hours: formData.design_hours,
        quantity: formData.quantity,
        sale_price: result.sale_price_total,
        accessories: formData.accessories
      });
      toast.success('Vendita registrata!');
      setFormData(prev => ({ ...prev, product_name: '' }));
      loadData();
    } catch (err) {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Calcolatore Costi</h1>
          <p className="text-muted-foreground mt-1">Multicolore • Quantità multiple • Prezzo manuale</p>
        </div>
        <div>
          <input ref={file3mfRef} type="file" accept=".3mf" className="hidden" onChange={handle3mfImport} />
          <Button variant="outline" size="sm" onClick={() => file3mfRef.current?.click()} disabled={importing3mf} data-testid="import-3mf-btn">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {importing3mf ? 'Importazione...' : 'Importa .3mf'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales - Copy Feature */}
        <Card className="border-border/40 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <History className="w-4 h-4" />
              Stampe Recenti
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {recentSales.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Nessuna stampa precedente
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {recentSales.map(sale => (
                    <div 
                      key={sale.id}
                      className="p-3 rounded-sm hover:bg-muted/50 cursor-pointer group transition-colors"
                      onClick={() => copyFromSale(sale)}
                      data-testid={`copy-sale-${sale.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{sale.product_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {sale.material_type} • {sale.grams_used}g • {formatTime(sale.print_time_hours || 0)}
                          </p>
                          <p className="text-xs font-mono text-primary">
                            €{sale.sale_price?.toFixed(2)} {sale.quantity > 1 && `(x${sale.quantity})`}
                          </p>
                        </div>
                        <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card className="border-border/40 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <Calculator className="w-4 h-4" />
              Parametri Stampa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filaments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs">
                  <Palette className="w-3 h-3" />
                  Filamenti {formData.filaments.length > 1 && <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-full text-[10px]">Multi</span>}
                </Label>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={addFilament}>
                  <Plus className="w-3 h-3 mr-1" />Colore
                </Button>
              </div>
              <div className="space-y-1.5">
                {formData.filaments.map((f, index) => {
                  const filamentData = filaments.find(fil => fil.id === f.filament_id);
                  return (
                    <div key={index} className="flex items-center gap-1.5 p-1.5 rounded-sm bg-muted/30 border border-border/40">
                      <div className="w-5 h-5 rounded-sm border" style={{ backgroundColor: filamentData?.color_hex || '#FFF' }} />
                      <Select value={f.filament_id} onValueChange={(v) => updateFilament(index, 'filament_id', v)}>
                        <SelectTrigger className="flex-1 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filaments.map(fil => (
                            <SelectItem key={fil.id} value={fil.id}>
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fil.color_hex }} />
                                {fil.material_type} {fil.color}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={f.grams_used}
                        onChange={(e) => updateFilament(index, 'grams_used', parseFloat(e.target.value) || 0)}
                        className="w-16 h-7 font-mono text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground">g</span>
                      {formData.filaments.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFilament(index)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Printer */}
            <div className="space-y-1">
              <Label className="text-xs">Stampante</Label>
              <Select value={formData.printer_id} onValueChange={(v) => setFormData({...formData, printer_id: v})}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {printers.map(p => <SelectItem key={p.id} value={p.id}>{p.printer_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Print Time - Hours and Minutes */}
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-xs">
                <Clock className="w-3 h-3" />
                Tempo Stampa
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number" min="0"
                  value={printTimeH}
                  onChange={(e) => setPrintTimeH(parseInt(e.target.value) || 0)}
                  className="h-8 w-16 font-mono text-xs text-center"
                  data-testid="print-time-h"
                />
                <span className="text-xs text-muted-foreground">h</span>
                <Input
                  type="number" min="0" max="59"
                  value={printTimeM}
                  onChange={(e) => setPrintTimeM(Math.min(59, parseInt(e.target.value) || 0))}
                  className="h-8 w-16 font-mono text-xs text-center"
                  data-testid="print-time-m"
                />
                <span className="text-xs text-muted-foreground">m</span>
              </div>
            </div>

            {/* Design + Quantity */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Design</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" min="0"
                    value={designTimeH}
                    onChange={(e) => setDesignTimeH(parseInt(e.target.value) || 0)}
                    className="h-8 w-14 font-mono text-xs text-center"
                    data-testid="design-time-h"
                  />
                  <span className="text-xs text-muted-foreground">h</span>
                  <Input
                    type="number" min="0" max="59"
                    value={designTimeM}
                    onChange={(e) => setDesignTimeM(Math.min(59, parseInt(e.target.value) || 0))}
                    className="h-8 w-14 font-mono text-xs text-center"
                    data-testid="design-time-m"
                  />
                  <span className="text-xs text-muted-foreground">m</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantità</Label>
                <Input
                  type="number" min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  className="h-8 font-mono text-xs"
                  data-testid="quantity-input"
                />
              </div>
            </div>

            {/* Accessories */}
            {accessories.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs"><Package className="w-3 h-3" />Accessori</Label>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {accessories.map(acc => {
                    const usage = getAccessoryUsage(acc.id);
                    return (
                      <div key={acc.id} className="flex items-center justify-between p-1.5 rounded-sm bg-muted/30 border border-border/40">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={!!usage} onCheckedChange={(c) => handleAccessoryToggle(acc.id, c)} />
                          <span className="text-xs">{acc.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">€{acc.unit_cost.toFixed(2)}</span>
                        </div>
                        {usage && (
                          <div className="flex items-center gap-0.5">
                            <Button type="button" size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleAccessoryQuantity(acc.id, -1)}>
                              <Minus className="w-2.5 h-2.5" />
                            </Button>
                            <span className="font-mono text-xs w-5 text-center">{usage.quantity}</span>
                            <Button type="button" size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleAccessoryQuantity(acc.id, 1)}>
                              <Plus className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Mode Toggle */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs">
                  {useManualPrice ? <Euro className="w-3 h-3" /> : <Percent className="w-3 h-3" />}
                  {useManualPrice ? 'Prezzo Manuale' : 'Margine %'}
                </Label>
                <Switch checked={useManualPrice} onCheckedChange={setUseManualPrice} data-testid="price-mode-toggle" />
              </div>
              
              {useManualPrice ? (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Prezzo per unità (€)</Label>
                  <Input
                    type="number" step="0.01"
                    value={formData.manual_price || ''}
                    onChange={(e) => setFormData({...formData, manual_price: parseFloat(e.target.value) || null})}
                    placeholder="Es. 15.00"
                    className="h-8 font-mono text-xs"
                    data-testid="manual-price-input"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Margine</span>
                    <span className="font-mono text-primary font-semibold">{formData.margin_percent}%</span>
                  </div>
                  <Slider
                    value={[formData.margin_percent]}
                    onValueChange={(v) => setFormData({...formData, margin_percent: v[0]})}
                    min={0} max={200} step={5}
                  />
                </div>
              )}
            </div>

            {/* Product Name */}
            <div className="space-y-1">
              <Label className="text-xs">Nome Prodotto</Label>
              <Input
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                placeholder="Es. Portachiavi logo"
                className="h-8 text-xs"
                data-testid="calc-product-name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt / Results */}
        <Card className="border-border/40 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <Receipt className="w-4 h-4" />
              Riepilogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {calculating ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Calcolo...</div>
            ) : result ? (
              <>
                {/* Filaments */}
                <div className="space-y-1">
                  {result.filaments_details?.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: f.color_hex }} />
                      <span className="flex-1">{f.material_type} {f.color}</span>
                      <span className="font-mono text-muted-foreground">{f.grams_used}g</span>
                      <span className="font-mono">€{f.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="border-dashed" />

                {/* Costs breakdown */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Materiale ({result.total_grams}g)</span><span className="font-mono">€{result.material_cost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Elettricità</span><span className="font-mono">€{result.electricity_cost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Ammortamento</span><span className="font-mono">€{result.depreciation_cost.toFixed(2)}</span></div>
                  {result.accessories_cost > 0 && <div className="flex justify-between"><span>Accessori</span><span className="font-mono">€{result.accessories_cost.toFixed(2)}</span></div>}
                  {result.labor_cost > 0 && <div className="flex justify-between"><span>Lavoro</span><span className="font-mono">€{result.labor_cost.toFixed(2)}</span></div>}
                  {result.design_cost > 0 && <div className="flex justify-between"><span>Design</span><span className="font-mono">€{result.design_cost.toFixed(2)}</span></div>}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Costo Totale</span>
                    <span className="font-mono">€{result.total_cost.toFixed(2)}</span>
                  </div>
                  {result.quantity > 1 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Costo/unità</span>
                      <span className="font-mono">€{result.cost_per_unit.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Sale Price */}
                <div className="pt-3 border-t-2 border-primary space-y-2">
                  {result.quantity > 1 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Prezzo/unità</span>
                        <span className="font-mono text-primary font-semibold">€{result.sale_price_per_unit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-lg font-heading font-bold">TOTALE ({result.quantity} pz)</span>
                        <span className="text-xl font-mono font-bold text-primary">€{result.sale_price_total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Profitto/unità</span>
                        <span className="font-mono text-emerald-500">+€{result.net_profit_per_unit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Profitto Totale</span>
                        <span className="font-mono font-semibold text-emerald-500">+€{result.net_profit_total.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-heading font-bold">PREZZO</span>
                        <span className="text-2xl font-mono font-bold text-primary">€{result.sale_price_per_unit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Profitto ({result.margin_percent.toFixed(0)}%)</span>
                        <span className="font-mono font-semibold text-emerald-500">+€{result.net_profit_per_unit.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <Button className="w-full mt-3" onClick={handleSaveSale} disabled={saving || !formData.product_name} data-testid="save-sale-btn">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvataggio...' : 'Registra Vendita'}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Configura i parametri per calcolare
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
