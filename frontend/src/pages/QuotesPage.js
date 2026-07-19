import { useState, useEffect, useRef } from 'react';
import { getBusinessSettings, updateBusinessSettings, getClients, generateQuotePdf, getQuotes, deleteQuote, sendQuoteEmail } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Building2, FileText, Plus, Trash2, Eye, Download, Save, ImagePlus, Send, Pencil, Mail, Printer } from 'lucide-react';
import { DecimalInput } from '../components/DecimalInput';
import { downloadHtmlAsPdf } from '../lib/pdfExport';
import { toast } from 'sonner';

export default function QuotesPage() {
  const [biz, setBiz] = useState({ company_name: '', address: '', city: '', zip_code: '', vat_number: '', phone: '', email: '', logo_base64: '' });
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewQuoteNumber, setPreviewQuoteNumber] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [emailTo, setEmailTo] = useState('');
  const [editingQuote, setEditingQuote] = useState(null);
  const logoRef = useRef(null);

  const [quoteForm, setQuoteForm] = useState({
    client_id: '',
    client_name: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }],
    notes: '',
    valid_days: 30
  });

  useEffect(() => {
    Promise.all([getBusinessSettings(), getClients(), getQuotes()])
      .then(([b, c, q]) => { setBiz(b); setClients(c); setQuotes(q); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveBiz = async () => {
    setSaving(true);
    try { await updateBusinessSettings(biz); toast.success('Dati aziendali salvati'); }
    catch { toast.error('Errore salvataggio'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { toast.error('Logo max 500KB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setBiz(prev => ({ ...prev, logo_base64: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const addItem = () => setQuoteForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }] }));
  const removeItem = (i) => setQuoteForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setQuoteForm(prev => ({ ...prev, items: prev.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const total = quoteForm.items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);

  const handleGenerate = async () => {
    if (quoteForm.items.some(i => !i.description || i.unit_price <= 0)) {
      toast.error('Compila tutti i prodotti con descrizione e prezzo');
      return;
    }
    setGenerating(true);
    try {
      const res = await generateQuotePdf(quoteForm);
      setPreviewHtml(res.html);
      setPreviewQuoteNumber(res.quote_number || '');
      setShowPreview(true);
      toast.success(`Preventivo ${res.quote_number} generato`);
      setQuotes(await getQuotes());
    } catch { toast.error('Errore generazione'); }
    finally { setGenerating(false); }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(previewHtml);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleDownloadPdf = async () => {
    if (!previewHtml) return;
    setDownloadingPdf(true);
    try {
      const filename = `Preventivo_${previewQuoteNumber || 'documento'}.pdf`;
      await downloadHtmlAsPdf(previewHtml, filename);
      toast.success('PDF scaricato');
    } catch {
      toast.error('Errore nel download del PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDeleteQuote = async (id) => {
    if (!window.confirm('Eliminare questo preventivo?')) return;
    try {
      await deleteQuote(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
      toast.success('Preventivo eliminato');
    } catch { toast.error('Errore eliminazione'); }
  };

  const handleEditQuote = (q) => {
    setEditingQuote(q);
    setQuoteForm({
      client_id: q.client_id || '',
      client_name: q.client_name || '',
      items: q.items || [{ description: '', quantity: 1, unit_price: 0 }],
      notes: q.notes || '',
      valid_days: 30
    });
  };

  const handleSendEmail = async (quoteId) => {
    if (!emailTo) { toast.error('Inserisci email destinatario'); return; }
    setSendingEmail(quoteId);
    try {
      await sendQuoteEmail({ quote_id: quoteId, to_email: emailTo });
      toast.success(`Preventivo inviato a ${emailTo}`);
      setEmailTo('');
      setQuotes(await getQuotes());
    } catch { toast.error("Errore nell'invio"); }
    finally { setSendingEmail(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4" data-testid="quotes-page">
      <h1 className="text-2xl font-heading font-bold">Preventivi</h1>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create" data-testid="tab-create">Crea Preventivo</TabsTrigger>
          <TabsTrigger value="business" data-testid="tab-business">Dati Aziendali</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Storico ({quotes.length})</TabsTrigger>
        </TabsList>

        {/* CREATE QUOTE */}
        <TabsContent value="create" className="space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Nuovo Preventivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cliente (da rubrica)</Label>
                  <Select value={quoteForm.client_id} onValueChange={v => setQuoteForm(prev => ({ ...prev, client_id: v, client_name: '' }))}>
                    <SelectTrigger className="h-9" data-testid="quote-client-select">
                      <SelectValue placeholder="Seleziona cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno (inserisci manualmente)</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} {c.surname}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(!quoteForm.client_id || quoteForm.client_id === 'none') && (
                  <div className="space-y-1">
                    <Label className="text-xs">Nome cliente manuale</Label>
                    <Input value={quoteForm.client_name} onChange={e => setQuoteForm(prev => ({ ...prev, client_name: e.target.value }))} className="h-9" data-testid="quote-client-name" />
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Prodotti</Label>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addItem} data-testid="add-quote-item">
                    <Plus className="w-3 h-3 mr-1" /> Aggiungi
                  </Button>
                </div>
                {quoteForm.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-end" data-testid={`quote-item-${i}`}>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Descrizione</Label>}
                      <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="h-8 text-sm" placeholder="Es. Portachiavi personalizzato" data-testid={`item-desc-${i}`} />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Qta</Label>}
                      <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="h-8 text-sm font-mono" data-testid={`item-qty-${i}`} />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-[10px] text-muted-foreground">Prezzo</Label>}
                      <DecimalInput value={item.unit_price} onChange={v => updateItem(i, 'unit_price', v)} className="h-8 text-sm font-mono" data-testid={`item-price-${i}`} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i)} disabled={quoteForm.items.length === 1}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="text-right font-mono font-bold text-lg pt-2 border-t border-border/40">
                  Totale: &euro;{total.toFixed(2)}
                </div>
              </div>

              {/* Notes & validity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Note (opzionale)</Label>
                  <Textarea value={quoteForm.notes} onChange={e => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} data-testid="quote-notes" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Validita' (giorni)</Label>
                  <Input type="number" min="1" value={quoteForm.valid_days} onChange={e => setQuoteForm(prev => ({ ...prev, valid_days: parseInt(e.target.value) || 30 }))} className="h-9" data-testid="quote-validity" />
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={generating} className="w-full" data-testid="generate-quote-btn">
                <FileText className="w-4 h-4 mr-2" />
                {generating ? 'Generazione...' : editingQuote ? 'Aggiorna e Genera PDF' : 'Genera Preventivo PDF'}
              </Button>
              {editingQuote && (
                <Button variant="ghost" className="w-full" onClick={() => { setEditingQuote(null); setQuoteForm({ client_id: '', client_name: '', items: [{ description: '', quantity: 1, unit_price: 0 }], notes: '', valid_days: 30 }); }}>
                  Annulla Modifica
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BUSINESS SETTINGS */}
        <TabsContent value="business" className="space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Dati Aziendali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Questi dati appariranno nell'intestazione dei preventivi PDF.</p>

              {/* Logo */}
              <div className="space-y-2">
                <Label className="text-xs">Logo</Label>
                <div className="flex items-center gap-3">
                  {biz.logo_base64 ? (
                    <img src={biz.logo_base64} alt="Logo" className="h-12 rounded border border-border/40" />
                  ) : (
                    <div className="h-12 w-24 rounded border border-dashed border-border/40 flex items-center justify-center text-muted-foreground">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} data-testid="upload-logo-btn">
                      <ImagePlus className="w-3.5 h-3.5 mr-1.5" /> {biz.logo_base64 ? 'Cambia' : 'Carica'} Logo
                    </Button>
                    {biz.logo_base64 && (
                      <Button variant="ghost" size="sm" className="ml-1 text-destructive" onClick={() => setBiz(prev => ({ ...prev, logo_base64: '' }))}>
                        Rimuovi
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Nome Azienda</Label><Input value={biz.company_name} onChange={e => setBiz({...biz, company_name: e.target.value})} data-testid="biz-name" /></div>
                <div className="space-y-1"><Label className="text-xs">P.IVA</Label><Input value={biz.vat_number} onChange={e => setBiz({...biz, vat_number: e.target.value})} data-testid="biz-vat" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Indirizzo</Label><Input value={biz.address} onChange={e => setBiz({...biz, address: e.target.value})} data-testid="biz-address" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">CAP</Label><Input value={biz.zip_code} onChange={e => setBiz({...biz, zip_code: e.target.value})} data-testid="biz-zip" /></div>
                <div className="space-y-1"><Label className="text-xs">Citta'</Label><Input value={biz.city} onChange={e => setBiz({...biz, city: e.target.value})} data-testid="biz-city" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Telefono</Label><Input value={biz.phone} onChange={e => setBiz({...biz, phone: e.target.value})} data-testid="biz-phone" /></div>
                <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={biz.email} onChange={e => setBiz({...biz, email: e.target.value})} data-testid="biz-email" /></div>
              </div>

              <Button onClick={handleSaveBiz} disabled={saving} data-testid="save-biz-btn">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvataggio...' : 'Salva Dati Aziendali'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history">
          <Card className="border-border/40">
            <CardContent className="pt-4">
              {quotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun preventivo generato</p>
              ) : (
                <div className="space-y-3">
                  {quotes.map(q => (
                    <div key={q.id} className="p-3 rounded-md bg-muted/30 border border-border/40" data-testid={`quote-${q.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-semibold text-sm">{q.quote_number}</span>
                            <span className="font-mono text-primary font-bold">&euro;{q.subtotal?.toFixed(2)}</span>
                            {q.sent_to && (
                              <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">
                                <Mail className="w-2.5 h-2.5 mr-1" />Inviato
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {q.client_name || 'Senza cliente'} — {new Date(q.created_at).toLocaleDateString('it-IT')} — Valido: {q.valid_until}
                          </p>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {q.items?.map((item, i) => <span key={i}>{i > 0 ? ', ' : ''}{item.description} x{item.quantity}</span>)}
                          </div>
                          {q.sent_to && <p className="text-[10px] text-emerald-500 mt-0.5">Inviato a: {q.sent_to}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditQuote(q)} title="Modifica" data-testid={`edit-quote-${q.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteQuote(q.id)} title="Elimina" data-testid={`delete-quote-${q.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {/* Send email section */}
                      <div className="mt-2 pt-2 border-t border-border/20 flex items-center gap-2">
                        <Input
                          placeholder={q.client_name ? `Email ${q.client_name}...` : "Email destinatario..."}
                          value={sendingEmail === q.id ? emailTo : ''}
                          onFocus={() => { setSendingEmail(q.id); setEmailTo(''); }}
                          onChange={e => { setSendingEmail(q.id); setEmailTo(e.target.value); }}
                          className="h-7 text-xs flex-1"
                          data-testid={`email-quote-${q.id}`}
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleSendEmail(q.id)} disabled={sendingEmail === q.id && !emailTo} data-testid={`send-quote-${q.id}`}>
                          <Send className="w-3 h-3 mr-1" /> Invia
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
              Anteprima Preventivo
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={handleDownloadPdf} disabled={downloadingPdf} data-testid="download-quote-pdf-btn">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {downloadingPdf ? 'Generazione...' : 'Scarica PDF'}
                </Button>
                <Button size="sm" onClick={handlePrint} data-testid="print-quote-btn">
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Stampa
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="border rounded-md p-4 bg-white text-black" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
