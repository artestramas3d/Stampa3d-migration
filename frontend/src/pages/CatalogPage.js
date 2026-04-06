import { useState, useEffect, useRef } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Package, Plus, Pencil, Trash2, ImagePlus, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { name: '', description: '', price: '', category: '', materials: '', photo: null, is_public: true };

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setProducts(await getProducts()); } catch { /* ignore */ }
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setForm({ ...form, photo: reader.result }); setPhotoPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setForm({ ...form, photo: null });
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openNew = () => { setForm(EMPTY); setEditing(null); setPhotoPreview(null); setDialogOpen(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description, price: p.price, category: p.category, materials: p.materials, photo: p.photo || null, is_public: p.is_public });
    setPhotoPreview(p.photo || null);
    setEditing(p.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Inserisci nome e prezzo'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editing) {
        await updateProduct(editing, payload);
        toast.success('Prodotto aggiornato');
      } else {
        await createProduct(payload);
        toast.success('Prodotto aggiunto');
      }
      setDialogOpen(false);
      load();
    } catch { toast.error('Errore nel salvataggio'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo prodotto?')) return;
    try { await deleteProduct(id); toast.success('Prodotto eliminato'); load(); } catch { toast.error('Errore'); }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="catalog-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Catalogo Prodotti</h1>
          <p className="text-muted-foreground mt-1">Gestisci i prodotti visibili nel listino pubblico</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/listino', '_blank')} data-testid="view-listino-btn">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />Vedi Listino
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} data-testid="add-product-btn">
                <Plus className="w-4 h-4 mr-2" />Aggiungi Prodotto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">{editing ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome *</Label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-9" data-testid="product-name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prezzo (EUR) *</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="h-9" data-testid="product-price" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Categoria</Label>
                    <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} list="categories" className="h-9" data-testid="product-category" />
                    <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Materiali</Label>
                    <Input value={form.materials} onChange={e => setForm({...form, materials: e.target.value})} placeholder="PLA, PETG..." className="h-9" data-testid="product-materials" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrizione</Label>
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} data-testid="product-description" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Foto (max 5MB)</Label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()}>
                      <ImagePlus className="w-3.5 h-3.5 mr-1.5" />Carica Foto
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    {photoPreview && (
                      <div className="relative">
                        <img src={photoPreview} alt="preview" className="h-16 rounded border border-border/40 object-cover" />
                        <button onClick={removePhoto} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
                  <Switch checked={form.is_public} onCheckedChange={v => setForm({...form, is_public: v})} data-testid="product-public-toggle" />
                  <div>
                    <p className="text-sm font-medium">{form.is_public ? 'Visibile nel Listino' : 'Nascosto'}</p>
                    <p className="text-[10px] text-muted-foreground">I prodotti pubblici appaiono nel listino online</p>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full" data-testid="save-product-btn">
                  {saving ? 'Salvataggio...' : editing ? 'Aggiorna' : 'Aggiungi'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nessun prodotto. Aggiungi il primo!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <Card key={p.id} className="border-border/40 overflow-hidden group" data-testid={`product-card-${p.id}`}>
              {p.photo ? (
                <div className="aspect-square bg-muted/30 overflow-hidden">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-square bg-muted/20 flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{p.name}</h3>
                    {p.category && <Badge variant="outline" className="text-[10px] mt-1">{p.category}</Badge>}
                  </div>
                  <p className="font-heading font-bold text-primary shrink-0">{parseFloat(p.price).toFixed(2)}</p>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                {p.materials && <p className="text-[10px] text-muted-foreground mt-1">Materiali: {p.materials}</p>}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <Badge className={p.is_public ? 'bg-emerald-500/20 text-emerald-500 text-[10px]' : 'bg-muted text-muted-foreground text-[10px]'}>
                    {p.is_public ? <><Eye className="w-2.5 h-2.5 mr-1" />Pubblico</> : <><EyeOff className="w-2.5 h-2.5 mr-1" />Nascosto</>}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)} data-testid={`edit-product-${p.id}`}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)} data-testid={`delete-product-${p.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
