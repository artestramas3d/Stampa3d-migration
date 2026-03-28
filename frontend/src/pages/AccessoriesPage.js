import { useState, useEffect } from 'react';
import { getAccessories, createAccessory, updateAccessory, deleteAccessory } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Plus, Pencil, Trash2, Package, KeyRound, Box, Tag } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'gancetto', label: 'Gancetto Portachiavi', icon: KeyRound },
  { value: 'magnete', label: 'Magnete', icon: Box },
  { value: 'packaging', label: 'Packaging', icon: Package },
  { value: 'altro', label: 'Altro', icon: Tag }
];

const defaultAccessory = {
  name: '',
  category: 'gancetto',
  unit_cost: 0.10,
  stock_quantity: 100,
  notes: ''
};

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState(null);
  const [formData, setFormData] = useState(defaultAccessory);

  useEffect(() => {
    loadAccessories();
  }, []);

  const loadAccessories = async () => {
    try {
      const data = await getAccessories();
      setAccessories(data);
    } catch (err) {
      toast.error('Errore nel caricamento degli accessori');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccessory) {
        await updateAccessory(editingAccessory.id, formData);
        toast.success('Accessorio aggiornato');
      } else {
        await createAccessory(formData);
        toast.success('Accessorio aggiunto');
      }
      setDialogOpen(false);
      setEditingAccessory(null);
      setFormData(defaultAccessory);
      loadAccessories();
    } catch (err) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleEdit = (accessory) => {
    setEditingAccessory(accessory);
    setFormData({
      name: accessory.name,
      category: accessory.category,
      unit_cost: accessory.unit_cost,
      stock_quantity: accessory.stock_quantity,
      notes: accessory.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo accessorio?')) return;
    try {
      await deleteAccessory(id);
      toast.success('Accessorio eliminato');
      loadAccessories();
    } catch (err) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const openNewDialog = () => {
    setEditingAccessory(null);
    setFormData(defaultAccessory);
    setDialogOpen(true);
  };

  const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[3];
  };

  // Calculate totals
  const totalValue = accessories.reduce((sum, a) => sum + (a.unit_cost * a.stock_quantity), 0);
  const totalItems = accessories.reduce((sum, a) => sum + a.stock_quantity, 0);

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="accessories-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Accessori</h1>
          <p className="text-muted-foreground mt-1">Gestisci gancetti, magneti, packaging e altri accessori</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} data-testid="add-accessory-btn">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Accessorio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingAccessory ? 'Modifica Accessorio' : 'Nuovo Accessorio'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Es. Gancetto cromato"
                  required
                  data-testid="accessory-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({...formData, category: v})}
                >
                  <SelectTrigger data-testid="category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Costo Unitario (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value) || 0})}
                    className="font-mono"
                    data-testid="unit-cost-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantità in Stock</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                    className="font-mono"
                    data-testid="stock-quantity-input"
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
                  data-testid="accessory-notes-input"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" data-testid="save-accessory-btn">
                  {editingAccessory ? 'Aggiorna' : 'Aggiungi'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tipi Accessori</p>
            <p className="text-2xl font-heading font-bold font-mono">{accessories.length}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Totale Pezzi</p>
            <p className="text-2xl font-heading font-bold font-mono">{totalItems.toLocaleString('it-IT')}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valore Stock</p>
            <p className="text-2xl font-heading font-bold font-mono text-primary">€{totalValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-32" />
            </Card>
          ))}
        </div>
      ) : accessories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-semibold mb-2">Nessun accessorio</h3>
            <p className="text-muted-foreground mb-4">Aggiungi gancetti, magneti o packaging</p>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Accessorio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessories.map(accessory => {
            const catInfo = getCategoryInfo(accessory.category);
            const Icon = catInfo.icon;
            const isLowStock = accessory.stock_quantity < 10;
            
            return (
              <Card key={accessory.id} className="stat-card group" data-testid={`accessory-card-${accessory.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold">{accessory.name}</h3>
                        <p className="text-sm text-muted-foreground">{catInfo.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(accessory)}
                        data-testid={`edit-accessory-${accessory.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(accessory.id)}
                        data-testid={`delete-accessory-${accessory.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Costo:</span>
                      <span className="font-mono ml-2 text-primary">€{accessory.unit_cost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stock:</span>
                      <span className={`font-mono ml-2 ${isLowStock ? 'text-red-500' : ''}`}>
                        {accessory.stock_quantity}
                        {isLowStock && ' ⚠️'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valore:</span>
                    <span className="font-mono ml-2">
                      €{(accessory.unit_cost * accessory.stock_quantity).toFixed(2)}
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
