import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Newspaper, Plus, Pencil, Trash2, Eye, Star, Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminNews, createNews, updateNews, deleteNews } from '../lib/api';
import { RichTextEditor } from '../components/RichTextEditor';
import { compressImageBase64 } from '../lib/imageCompress';

const CATS = ['Novità', 'Guide', 'Offerte', 'Eventi', 'Aggiornamenti'];

const emptyNews = {
  title: '', slug: '', category: 'Novità', excerpt: '',
  content_html: '', cover_image: '', is_published: false, is_featured: false,
};

export default function AdminNewsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyNews);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await getAdminNews()); }
    catch { toast.error('Errore caricamento notizie'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyNews); setDialogOpen(true); };
  const openEdit = (n) => { setEditing(n); setForm({ ...emptyNews, ...n }); setDialogOpen(true); };

  const save = async () => {
    if (!form.title.trim()) return toast.error('Titolo obbligatorio');
    try {
      if (editing) await updateNews(editing.id, form);
      else await createNews(form);
      toast.success(editing ? 'Notizia aggiornata' : 'Notizia creata');
      setDialogOpen(false); load();
    } catch { toast.error('Errore salvataggio'); }
  };

  const remove = async (id) => {
    if (!confirm('Eliminare questa notizia?')) return;
    try { await deleteNews(id); toast.success('Eliminata'); load(); }
    catch { toast.error('Errore'); }
  };

  const uploadCover = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('Immagine troppo grande (max 5MB)');
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const compressed = await compressImageBase64(ev.target.result, { maxWidth: 1200, quality: 0.85 });
        setForm(f => ({ ...f, cover_image: compressed }));
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Newspaper className="w-4 h-4" />Gestione Notizie</h2>
          <p className="text-xs text-muted-foreground">Pubblica articoli visibili su calcolatore e shop</p>
        </div>
        <Button onClick={openNew} size="sm" data-testid="admin-news-add"><Plus className="w-4 h-4 mr-1" />Nuova notizia</Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground py-6 text-center">Caricamento...</p> : items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nessuna notizia. Crea la prima!</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(n => (
            <Card key={n.id} className="group hover:shadow-md transition-shadow" data-testid={`admin-news-${n.id}`}>
              <CardContent className="p-3 flex gap-3">
                <div className="w-24 h-20 shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center">
                  {n.cover_image ? <img src={n.cover_image} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground/30" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">{n.title}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(n)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(n.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                    {n.is_published ? <Badge variant="default" className="text-[10px]">Pubblicata</Badge> : <Badge variant="secondary" className="text-[10px]">Bozza</Badge>}
                    {n.is_featured && <Badge variant="default" className="text-[10px] bg-yellow-500"><Star className="w-2.5 h-2.5 mr-1" />In evidenza</Badge>}
                  </div>
                  {n.excerpt && <p className="text-[11px] text-muted-foreground line-clamp-2">{n.excerpt}</p>}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{n.views}</span>
                    <span>{(n.created_at || '').slice(0, 10)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifica notizia' : 'Nuova notizia'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs">Titolo *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} data-testid="news-title" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-xs">Riassunto (excerpt) — mostrato nelle anteprime</Label>
              <Textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Breve testo di presentazione (150-200 caratteri)" />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-xs">Immagine di copertina</Label>
              <div className="flex gap-3 items-start">
                {form.cover_image && <img src={form.cover_image} alt="" className="w-24 h-16 object-cover rounded border border-border/50" />}
                <div className="flex-1">
                  <input type="file" id="cover-upload" className="hidden" accept="image/*" onChange={uploadCover} />
                  <label htmlFor="cover-upload" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-muted/70 text-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />{uploading ? 'Comprimo...' : 'Carica'}
                  </label>
                  {form.cover_image && <Button size="sm" variant="ghost" className="ml-2 text-destructive" onClick={() => setForm({ ...form, cover_image: '' })}>Rimuovi</Button>}
                </div>
              </div>
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-xs">Contenuto</Label>
              <RichTextEditor value={form.content_html} onChange={v => setForm({ ...form, content_html: v })} />
            </div>
            <div className="sm:col-span-3 flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch checked={form.is_published} onCheckedChange={v => setForm({ ...form, is_published: v })} data-testid="news-published" />
                Pubblicata (visibile pubblicamente)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch checked={form.is_featured} onCheckedChange={v => setForm({ ...form, is_featured: v })} />
                In evidenza (home)
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={save} data-testid="news-save">{editing ? 'Aggiorna' : 'Pubblica'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
