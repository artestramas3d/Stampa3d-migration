import { useState, useEffect } from 'react';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Megaphone, Plus, Trash2, Save, Monitor, PanelLeft, ArrowDown, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';

const POSITIONS = [
  { value: 'header', label: 'Header (sopra contenuto)', icon: Monitor },
  { value: 'sidebar', label: 'Sidebar (sotto menu)', icon: PanelLeft },
  { value: 'footer', label: 'Footer (fondo pagina)', icon: ArrowDown },
  { value: 'content', label: 'Sotto Contenuto', icon: LayoutTemplate },
];

const positionLabel = (pos) => POSITIONS.find(p => p.value === pos)?.label || pos;

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ position: 'sidebar', name: '', html_code: '', is_active: true });

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = async () => {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (err) {
      toast.error('Errore nel caricamento banner');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ position: 'sidebar', name: '', html_code: '', is_active: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.html_code) {
      toast.error('Compila nome e codice HTML');
      return;
    }
    try {
      if (editId) {
        await updateBanner(editId, form);
        toast.success('Banner aggiornato');
      } else {
        await createBanner(form);
        toast.success('Banner creato');
      }
      resetForm();
      loadBanners();
    } catch (err) {
      toast.error('Errore nel salvataggio');
    }
  };

  const handleEdit = (banner) => {
    setForm({
      position: banner.position,
      name: banner.name,
      html_code: banner.html_code,
      is_active: banner.is_active
    });
    setEditId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo banner?')) return;
    try {
      await deleteBanner(id);
      toast.success('Banner eliminato');
      loadBanners();
    } catch (err) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleToggle = async (banner) => {
    try {
      await updateBanner(banner.id, { is_active: !banner.is_active });
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
      toast.success(banner.is_active ? 'Banner disattivato' : 'Banner attivato');
    } catch (err) {
      toast.error('Errore nell\'aggiornamento');
    }
  };

  // Group banners by position
  const grouped = POSITIONS.map(pos => ({
    ...pos,
    banners: banners.filter(b => b.position === pos.value)
  }));

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="banners-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Gestione Banner</h1>
          <p className="text-muted-foreground mt-1">Inserisci codici TradeTracker o HTML personalizzati</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} data-testid="add-banner-btn">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Banner
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30" data-testid="banner-form">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">
              {editId ? 'Modifica Banner' : 'Nuovo Banner'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nome (riferimento)</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Es. TradeTracker Sidebar"
                  className="h-9"
                  data-testid="banner-name-input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Posizione</Label>
                <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                  <SelectTrigger className="h-9" data-testid="banner-position-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Codice HTML / iframe</Label>
              <Textarea
                value={form.html_code}
                onChange={(e) => setForm({ ...form, html_code: e.target.value })}
                placeholder='Incolla qui il codice di TradeTracker...'
                rows={5}
                className="font-mono text-xs"
                data-testid="banner-html-input"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                data-testid="banner-active-switch"
              />
              <Label className="text-xs">{form.is_active ? 'Attivo' : 'Disattivato'}</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} data-testid="banner-save-btn">
                <Save className="w-4 h-4 mr-2" />
                {editId ? 'Aggiorna' : 'Crea Banner'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Annulla</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner list grouped by position */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
      ) : banners.length === 0 && !showForm ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-semibold mb-2">Nessun banner</h3>
            <p className="text-muted-foreground mb-4">Crea il primo banner per iniziare</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => {
            const Icon = group.icon;
            return (
              <Card key={group.value} className="border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-heading">
                    <Icon className="w-4 h-4 text-primary" />
                    {group.label}
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {group.banners.length} banner
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {group.banners.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nessun banner in questa posizione</p>
                  ) : (
                    <div className="space-y-2">
                      {group.banners.map(banner => (
                        <div
                          key={banner.id}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/40"
                          data-testid={`banner-item-${banner.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Switch
                              checked={banner.is_active}
                              onCheckedChange={() => handleToggle(banner)}
                              data-testid={`banner-toggle-${banner.id}`}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{banner.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
                                {banner.html_code.substring(0, 60)}...
                              </p>
                            </div>
                            {banner.is_active ? (
                              <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">Attivo</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground text-[10px]">Off</Badge>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleEdit(banner)}>
                              Modifica
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(banner.id)} data-testid={`banner-delete-${banner.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview section */}
      {banners.some(b => b.is_active) && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-heading font-semibold mb-3">Anteprima Banner Attivi</h2>
            <div className="space-y-3">
              {banners.filter(b => b.is_active).map(banner => (
                <Card key={banner.id} className="border-border/40">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground">
                      {banner.name} — {positionLabel(banner.position)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="banner-preview"
                      dangerouslySetInnerHTML={{ __html: banner.html_code }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
