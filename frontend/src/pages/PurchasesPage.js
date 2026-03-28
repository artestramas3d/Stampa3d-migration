import { useState, useEffect } from 'react';
import { getPurchases, createPurchase, deletePurchase, exportPurchasesCSV } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Plus, Download, Trash2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const MATERIAL_TYPES = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Nylon', 'PLA+', 'PETG-CF', 'Altro'];

const defaultPurchase = {
  date: new Date().toISOString().split('T')[0],
  material_type: 'PLA',
  brand: '',
  color: '',
  quantity_spools: 1,
  price_total: 25,
  grams_total: 1000,
  notes: ''
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(defaultPurchase);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const data = await getPurchases();
      setPurchases(data);
    } catch (err) {
      toast.error('Errore nel caricamento acquisti');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPurchase(formData);
      toast.success('Acquisto registrato');
      setDialogOpen(false);
      setFormData(defaultPurchase);
      loadPurchases();
    } catch (err) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo acquisto?')) return;
    try {
      await deletePurchase(id);
      toast.success('Acquisto eliminato');
      loadPurchases();
    } catch (err) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleExport = () => {
    window.open(exportPurchasesCSV(), '_blank');
  };

  // Calculate totals
  const totalSpent = purchases.reduce((sum, p) => sum + (p.price_total || 0), 0);
  const totalGrams = purchases.reduce((sum, p) => sum + (p.grams_total || 0), 0);
  const avgCostPerGram = totalGrams > 0 ? totalSpent / totalGrams : 0;

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="purchases-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Acquisti Filamenti</h1>
          <p className="text-muted-foreground mt-1">Traccia gli acquisti di materiali</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" data-testid="export-purchases-btn">
            <Download className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-purchase-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Acquisto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">Registra Acquisto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="font-mono"
                    data-testid="purchase-date"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Materiale</Label>
                    <Select 
                      value={formData.material_type} 
                      onValueChange={(v) => setFormData({...formData, material_type: v})}
                    >
                      <SelectTrigger data-testid="purchase-material">
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
                      data-testid="purchase-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Colore</Label>
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      placeholder="Es. Nero"
                      data-testid="purchase-color"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>N° Bobine</Label>
                    <Input
                      type="number"
                      value={formData.quantity_spools}
                      onChange={(e) => setFormData({...formData, quantity_spools: parseInt(e.target.value) || 1})}
                      className="font-mono"
                      data-testid="purchase-spools"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prezzo Totale (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_total}
                      onChange={(e) => setFormData({...formData, price_total: parseFloat(e.target.value) || 0})}
                      className="font-mono"
                      data-testid="purchase-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grammi Totali</Label>
                    <Input
                      type="number"
                      value={formData.grams_total}
                      onChange={(e) => setFormData({...formData, grams_total: parseFloat(e.target.value) || 0})}
                      className="font-mono"
                      data-testid="purchase-grams"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Note</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Note opzionali..."
                    rows={2}
                    data-testid="purchase-notes"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" data-testid="save-purchase-btn">
                    Salva
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Spesa Totale</p>
            <p className="text-2xl font-heading font-bold font-mono">€{totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Grammi Acquistati</p>
            <p className="text-2xl font-heading font-bold font-mono">{totalGrams.toLocaleString('it-IT')}g</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Costo Medio/g</p>
            <p className="text-2xl font-heading font-bold font-mono text-primary">€{avgCostPerGram.toFixed(4)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Table */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Caricamento...</div>
          ) : purchases.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-semibold mb-2">Nessun acquisto</h3>
              <p className="text-muted-foreground mb-4">Registra il tuo primo acquisto di filamento</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Acquisto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Materiale</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Colore</TableHead>
                    <TableHead className="text-right">Bobine</TableHead>
                    <TableHead className="text-right">Totale €</TableHead>
                    <TableHead className="text-right">Grammi</TableHead>
                    <TableHead className="text-right">€/g</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(purchase => (
                    <TableRow key={purchase.id} data-testid={`purchase-row-${purchase.id}`}>
                      <TableCell className="font-mono text-muted-foreground">{purchase.date}</TableCell>
                      <TableCell className="font-semibold">{purchase.material_type}</TableCell>
                      <TableCell>{purchase.brand}</TableCell>
                      <TableCell>{purchase.color}</TableCell>
                      <TableCell className="text-right">{purchase.quantity_spools}</TableCell>
                      <TableCell className="text-right">€{purchase.price_total?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{purchase.grams_total}g</TableCell>
                      <TableCell className="text-right text-primary">€{purchase.cost_per_gram?.toFixed(4)}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(purchase.id)}
                          data-testid={`delete-purchase-${purchase.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
