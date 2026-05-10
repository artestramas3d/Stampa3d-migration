import { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient, getClientSales, exportClientsCSV } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Users, Plus, Pencil, Trash2, Phone, Mail, MapPin, Download, Search, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { name: '', surname: '', phone: '', email: '', address: '', notes: '' };

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [salesModal, setSalesModal] = useState(null);
  const [clientSales, setClientSales] = useState([]);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      setClients(await getClients());
    } catch { toast.error('Errore caricamento clienti'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) { toast.error('Inserisci almeno il nome'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateClient(editingId, formData);
        toast.success('Cliente aggiornato');
      } else {
        await createClient(formData);
        toast.success('Cliente aggiunto');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      loadClients();
    } catch { toast.error('Errore salvataggio'); }
    finally { setSaving(false); }
  };

  const handleEdit = (c) => {
    setFormData({ name: c.name, surname: c.surname || '', phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo cliente?')) return;
    try { await deleteClient(id); toast.success('Cliente eliminato'); loadClients(); }
    catch { toast.error('Errore'); }
  };

  const handleViewSales = async (client) => {
    setSalesModal(client);
    try { setClientSales(await getClientSales(client.id)); }
    catch { setClientSales([]); }
  };

  const filtered = clients.filter(c =>
    `${c.name} ${c.surname} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4" data-testid="clients-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold">Clienti</h1>
          <p className="text-muted-foreground text-sm">{clients.length} clienti registrati</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(exportClientsCSV(), '_blank')} data-testid="export-clients-btn">
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
          <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }} data-testid="add-client-btn">
            <Plus className="w-4 h-4 mr-1.5" /> Nuovo Cliente
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cerca cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="search-clients" />
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{search ? 'Nessun risultato' : 'Nessun cliente registrato'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contatto</TableHead>
                  <TableHead>Indirizzo</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} data-testid={`client-row-${c.id}`}>
                    <TableCell>
                      <span className="font-semibold">{c.name} {c.surname}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {c.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>}
                        {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.address && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{c.address}</div>}
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground line-clamp-1">{c.notes}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleViewSales(c)} title="Storico acquisti" data-testid={`client-sales-${c.id}`}>
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(c)} data-testid={`edit-client-${c.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)} data-testid={`delete-client-${c.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome *</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} data-testid="client-name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cognome</Label>
                <Input value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} data-testid="client-surname" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Telefono</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} data-testid="client-phone" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} data-testid="client-email" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Indirizzo</Label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} data-testid="client-address" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Note</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} data-testid="client-notes" />
            </div>
            <Button type="submit" disabled={saving} className="w-full" data-testid="save-client-btn">
              {saving ? 'Salvataggio...' : editingId ? 'Aggiorna' : 'Aggiungi Cliente'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Client Sales Modal */}
      <Dialog open={!!salesModal} onOpenChange={(open) => !open && setSalesModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Acquisti di {salesModal?.name} {salesModal?.surname}</DialogTitle>
          </DialogHeader>
          {clientSales.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nessuna vendita collegata</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {clientSales.map(s => (
                <div key={s.id} className="p-3 rounded-md bg-muted/30 border border-border/40 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{s.product_name}</p>
                    <p className="text-xs text-muted-foreground">{s.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">&euro;{s.sale_price?.toFixed(2)}</p>
                    {s.paid ? <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">Pagato</Badge> : <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px]">Non pagato</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
