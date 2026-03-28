import { useState, useEffect } from 'react';
import { getPrinters, createPrinter, updatePrinter, deletePrinter } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, Printer, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

const defaultPrinter = {
  printer_name: '',
  printer_cost: 300,
  estimated_life_hours: 5000,
  electricity_cost_kwh: 0.25,
  average_power_watts: 200
};

export default function SettingsPage() {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [formData, setFormData] = useState(defaultPrinter);

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      const data = await getPrinters();
      setPrinters(data);
    } catch (err) {
      toast.error('Errore nel caricamento stampanti');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPrinter) {
        await updatePrinter(editingPrinter.id, formData);
        toast.success('Stampante aggiornata');
      } else {
        await createPrinter(formData);
        toast.success('Stampante aggiunta');
      }
      setDialogOpen(false);
      setEditingPrinter(null);
      setFormData(defaultPrinter);
      loadPrinters();
    } catch (err) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleEdit = (printer) => {
    setEditingPrinter(printer);
    setFormData({
      printer_name: printer.printer_name,
      printer_cost: printer.printer_cost,
      estimated_life_hours: printer.estimated_life_hours,
      electricity_cost_kwh: printer.electricity_cost_kwh,
      average_power_watts: printer.average_power_watts
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa stampante?')) return;
    try {
      await deletePrinter(id);
      toast.success('Stampante eliminata');
      loadPrinters();
    } catch (err) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const openNewDialog = () => {
    setEditingPrinter(null);
    setFormData(defaultPrinter);
    setDialogOpen(true);
  };

  // Calculate preview values
  const previewDepreciation = formData.estimated_life_hours > 0 
    ? formData.printer_cost / formData.estimated_life_hours 
    : 0;
  const previewElectricity = (formData.average_power_watts / 1000) * formData.electricity_cost_kwh;

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="settings-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground mt-1">Gestisci stampanti e costi fissi</p>
      </div>

      {/* Printers Section */}
      <Card className="border-border/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading">Stampanti 3D</CardTitle>
            <CardDescription>Configura le tue stampanti per calcolare ammortamento ed elettricità</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} data-testid="add-printer-btn">
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingPrinter ? 'Modifica Stampante' : 'Nuova Stampante'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Stampante</Label>
                  <Input
                    value={formData.printer_name}
                    onChange={(e) => setFormData({...formData, printer_name: e.target.value})}
                    placeholder="Es. Bambu Lab X1C"
                    required
                    data-testid="printer-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Costo Stampante (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.printer_cost}
                      onChange={(e) => setFormData({...formData, printer_cost: parseFloat(e.target.value) || 0})}
                      className="font-mono"
                      data-testid="printer-cost-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vita Stimata (ore)</Label>
                    <Input
                      type="number"
                      value={formData.estimated_life_hours}
                      onChange={(e) => setFormData({...formData, estimated_life_hours: parseFloat(e.target.value) || 0})}
                      className="font-mono"
                      data-testid="printer-life-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Costo kWh (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.electricity_cost_kwh}
                      onChange={(e) => setFormData({...formData, electricity_cost_kwh: parseFloat(e.target.value) || 0})}
                      className="font-mono"
                      data-testid="electricity-cost-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Potenza Media (W)</Label>
                    <Input
                      type="number"
                      value={formData.average_power_watts}
                      onChange={(e) => setFormData({...formData, average_power_watts: parseFloat(e.target.value) || 0})}
                      className="font-mono"
                      data-testid="power-watts-input"
                    />
                  </div>
                </div>

                {/* Preview */}
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ammortamento/ora:</span>
                      <span className="font-mono text-primary">€{previewDepreciation.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Elettricità/ora:</span>
                      <span className="font-mono text-primary">€{previewElectricity.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-border pt-2">
                      <span>Costo Fisso/ora:</span>
                      <span className="font-mono">€{(previewDepreciation + previewElectricity).toFixed(4)}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" data-testid="save-printer-btn">
                    {editingPrinter ? 'Aggiorna' : 'Aggiungi'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
          ) : printers.length === 0 ? (
            <div className="text-center py-8">
              <Printer className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-semibold mb-2">Nessuna stampante</h3>
              <p className="text-muted-foreground mb-4">Aggiungi la tua prima stampante 3D</p>
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Stampante
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {printers.map(printer => (
                <Card key={printer.id} className="bg-muted/30 group" data-testid={`printer-card-${printer.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center">
                          <Printer className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold">{printer.printer_name}</h3>
                          <p className="text-sm text-muted-foreground">€{printer.printer_cost}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(printer)}
                          data-testid={`edit-printer-${printer.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(printer.id)}
                          data-testid={`delete-printer-${printer.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Vita:</span>
                        <span className="font-mono">{printer.estimated_life_hours}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Potenza:</span>
                        <span className="font-mono">{printer.average_power_watts}W</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Ammort./h</span>
                        <span className="font-mono text-primary">€{printer.depreciation_per_hour?.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Elettr./h</span>
                        <span className="font-mono text-primary">€{printer.electricity_cost_per_hour?.toFixed(4)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-border/40 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="font-heading font-semibold mb-2">Come funziona il calcolo</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><strong>Ammortamento:</strong> Costo stampante ÷ Ore di vita stimate</li>
            <li><strong>Elettricità:</strong> (Potenza W ÷ 1000) × Costo kWh</li>
            <li><strong>Costo Fisso/ora:</strong> Ammortamento + Elettricità</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
