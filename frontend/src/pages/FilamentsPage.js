import { useState, useEffect } from 'react';
import { getFilaments, createFilament, updateFilament, deleteFilament } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Plus, Pencil, Trash2, Cylinder, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { FilamentColorDot } from '../components/FilamentColorDot';
import { DecimalInput } from '../components/DecimalInput';

const MATERIAL_TYPES = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'PLA+', 'PETG-CF', 'Altro'];
const LOW_STOCK_THRESHOLD = 200; // grams

const defaultFilament = {
  material_type: 'PLA',
  color: '',
  brand: '',
  spool_weight_g: 1000,
  spool_price: 25,
  color_hex: '#FFFFFF',
  color_hex2: '',
  notes: ''
};

export default function FilamentsPage() {
  const [filaments, setFilaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState(null);
  const [formData, setFormData] = useState(defaultFilament);

  useEffect(() => {
    loadFilaments();
  }, []);

  const loadFilaments = async () => {
    try {
      const data = await getFilaments();
      setFilaments(data);
    } catch (err) {
      toast.error('Errore nel caricamento dei filamenti');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFilament) {
        await updateFilament(editingFilament.id, formData);
        toast.success('Filamento aggiornato');
      } else {
        await createFilament(formData);
        toast.success('Filamento aggiunto');
      }
      setDialogOpen(false);
      setEditingFilament(null);
      setFormData(defaultFilament);
      loadFilaments();
    } catch (err) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleEdit = (filament) => {
    setEditingFilament(filament);
    setFormData({
      material_type: filament.material_type,
      color: filament.color,
      brand: filament.brand,
      spool_weight_g: filament.spool_weight_g,
      spool_price: filament.spool_price,
      color_hex: filament.color_hex,
      color_hex2: filament.color_hex2 || '',
      notes: filament.notes || '',
      remaining_grams: filament.remaining_grams
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo filamento?')) return;
    try {
      await deleteFilament(id);
      toast.success('Filamento eliminato');
      loadFilaments();
    } catch (err) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const openNewDialog = () => {
    setEditingFilament(null);
    setFormData(defaultFilament);
    setDialogOpen(true);
  };

  // Filter low stock filaments
  const lowStockFilaments = filaments.filter(f => f.remaining_grams < LOW_STOCK_THRESHOLD);

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="filaments-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Gestione Filamenti</h1>
          <p className="text-muted-foreground mt-1">Gestisci il tuo inventario di filamenti</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} data-testid="add-filament-btn">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Filamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingFilament ? 'Modifica Filamento' : 'Nuovo Filamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Materiale</Label>
                  <Select 
                    value={formData.material_type} 
                    onValueChange={(v) => setFormData({...formData, material_type: v})}
                  >
                    <SelectTrigger data-testid="material-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_TYPES.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Es. Sunlu"
                    data-testid="brand-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Colore</Label>
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="Es. Rosso/Blu"
                    data-testid="color-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Colore 1</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({...formData, color_hex: e.target.value})}
                      className="w-12 h-9 p-1 cursor-pointer"
                      data-testid="color-hex-input"
                    />
                    <Input
                      value={formData.color_hex}
                      onChange={(e) => setFormData({...formData, color_hex: e.target.value})}
                      className="flex-1 font-mono"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Colore 2 (opzionale, per bicolore)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.color_hex2 || '#FFFFFF'}
                      onChange={(e) => setFormData({...formData, color_hex2: e.target.value})}
                      className="w-12 h-9 p-1 cursor-pointer"
                      data-testid="color-hex2-input"
                    />
                    <Input
                      value={formData.color_hex2}
                      onChange={(e) => setFormData({...formData, color_hex2: e.target.value})}
                      className="flex-1 font-mono"
                      placeholder="Lascia vuoto se monocolore"
                    />
                    {formData.color_hex2 && (
                      <Button type="button" variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground" onClick={() => setFormData({...formData, color_hex2: ''})}>✕</Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Anteprima</Label>
                  <div className="flex items-center gap-2 h-9">
                    <FilamentColorDot color={formData.color_hex} color2={formData.color_hex2} size="w-8 h-8" />
                    <span className="text-xs text-muted-foreground">{formData.color_hex2 ? 'Bicolore' : 'Monocolore'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso Bobina (g)</Label>
                  <DecimalInput
                    value={formData.spool_weight_g}
                    onChange={(num) => setFormData({...formData, spool_weight_g: num})}
                    className="font-mono"
                    data-testid="weight-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prezzo Bobina (€)</Label>
                  <DecimalInput
                    value={formData.spool_price}
                    onChange={(num) => setFormData({...formData, spool_price: num})}
                    className="font-mono"
                    data-testid="price-input"
                  />
                </div>
              </div>

              {editingFilament && (
                <div className="space-y-2">
                  <Label>Grammi Rimanenti</Label>
                  <DecimalInput
                    value={formData.remaining_grams || 0}
                    onChange={(num) => setFormData({...formData, remaining_grams: num})}
                    className="font-mono"
                    data-testid="remaining-input"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Note opzionali..."
                  rows={2}
                  data-testid="notes-input"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" data-testid="save-filament-btn">
                  {editingFilament ? 'Aggiorna' : 'Aggiungi'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockFilaments.length > 0 && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10" data-testid="low-stock-alert">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-heading">Attenzione: Scorte Basse!</AlertTitle>
          <AlertDescription>
            {lowStockFilaments.length === 1 
              ? `Il filamento "${lowStockFilaments[0].material_type} ${lowStockFilaments[0].color}" ha meno di ${LOW_STOCK_THRESHOLD}g rimanenti.`
              : `${lowStockFilaments.length} filamenti hanno meno di ${LOW_STOCK_THRESHOLD}g rimanenti:`
            }
            {lowStockFilaments.length > 1 && (
              <ul className="mt-2 space-y-1">
                {lowStockFilaments.map(f => (
                  <li key={f.id} className="font-mono text-sm">
                    • {f.material_type} {f.color} ({f.brand}): <strong>{Math.round(f.remaining_grams)}g</strong>
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-32" />
            </Card>
          ))}
        </div>
      ) : filaments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Cylinder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-semibold mb-2">Nessun filamento</h3>
            <p className="text-muted-foreground mb-4">Aggiungi il tuo primo filamento per iniziare</p>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Filamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filaments.map(filament => {
            const usedPercent = ((filament.spool_weight_g - filament.remaining_grams) / filament.spool_weight_g) * 100;
            const isLowStock = filament.remaining_grams < LOW_STOCK_THRESHOLD;
            
            return (
              <Card 
                key={filament.id} 
                className={`stat-card group ${isLowStock ? 'border-red-500/50' : ''}`} 
                data-testid={`filament-card-${filament.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FilamentColorDot color={filament.color_hex} color2={filament.color_hex2} size="w-8 h-8" />
                      <div>
                        <h3 className="font-heading font-semibold flex items-center gap-2">
                          {filament.material_type}
                          {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </h3>
                        <p className="text-sm text-muted-foreground">{filament.brand} - {filament.color}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(filament)}
                        data-testid={`edit-filament-${filament.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(filament.id)}
                        data-testid={`delete-filament-${filament.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Remaining Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Rimanente</span>
                      <span className={`font-mono font-semibold ${isLowStock ? 'text-red-500' : ''}`}>
                        {Math.round(filament.remaining_grams)}g / {filament.spool_weight_g}g
                      </span>
                    </div>
                    <Progress 
                      value={100 - usedPercent} 
                      className={`h-2 ${isLowStock ? '[&>div]:bg-red-500' : ''}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Peso:</span>
                      <span className="font-mono ml-2">{filament.spool_weight_g}g</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prezzo:</span>
                      <span className="font-mono ml-2">€{filament.spool_price}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Costo/g:</span>
                    <span className="font-mono text-primary ml-2 font-semibold">
                      €{filament.cost_per_gram?.toFixed(4) || '0.0000'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
