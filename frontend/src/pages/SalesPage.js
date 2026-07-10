import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSales, deleteSale, updateSalePaid, updateSale, exportSalesCSV, getClients, getAccessories, generateQuotePdf, getQuotesSalesMap } from '../lib/api';
import { downloadHtmlAsPdf } from '../lib/pdfExport';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Download, Trash2, Receipt, Search, CheckCircle, Clock, ArrowUpDown, Printer, Pencil, Plus, X, Truck, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { DecimalInput } from '../components/DecimalInput';

export default function SalesPage() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [paidFilter, setPaidFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [editingSale, setEditingSale] = useState(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editName, setEditName] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editAccessories, setEditAccessories] = useState([]); // [{accessory_id, quantity}]
  const [editShipping, setEditShipping] = useState(0);
  // Quote generation from existing sale
  const [quoteSale, setQuoteSale] = useState(null); // sale in fase di generazione preventivo
  const [quoteClientId, setQuoteClientId] = useState('none');
  const [quoteQuantity, setQuoteQuantity] = useState(1);
  const [quoteUnitPrice, setQuoteUnitPrice] = useState(0);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteValidDays, setQuoteValidDays] = useState(30);
  const [quotePreviewHtml, setQuotePreviewHtml] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [clients, setClients] = useState([]);
  const [accessoriesList, setAccessoriesList] = useState([]);
  const [quotesMap, setQuotesMap] = useState({}); // {sale_id: [{quote_number, created_at}, ...]}

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const [data, clientsData, accData, qMap] = await Promise.all([
        getSales(),
        getClients(),
        getAccessories(),
        getQuotesSalesMap().catch(() => ({}))
      ]);
      setSales(data);
      setClients(clientsData);
      setAccessoriesList(accData);
      setQuotesMap(qMap || {});
    } catch (err) {
      toast.error('Errore nel caricamento vendite');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa vendita?')) return;
    try {
      await deleteSale(id);
      toast.success('Vendita eliminata');
      loadSales();
    } catch (err) {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleTogglePaid = async (id, currentPaid) => {
    try {
      await updateSalePaid(id, !currentPaid);
      setSales(prev => prev.map(s => 
        s.id === id ? { ...s, paid: !currentPaid } : s
      ));
      toast.success(!currentPaid ? 'Segnato come pagato' : 'Segnato come non pagato');
    } catch (err) {
      toast.error('Errore nell\'aggiornamento');
    }
  };

  const handleExport = () => {
    window.open(exportSalesCSV(), '_blank');
  };

  const handleReprint = (sale) => {
    const params = new URLSearchParams();
    params.set('reprint', JSON.stringify({
      filaments: sale.filaments || [],
      printer_id: sale.printer_id || '',
      print_time_hours: sale.print_time_hours || 2,
      design_hours: sale.design_hours || 0,
      accessories: sale.accessories || [],
      product_name: sale.product_name || ''
    }));
    navigate(`/calculator?${params.toString()}`);
  };

  const handleOpenQuoteDialog = (sale) => {
    setQuoteSale(sale);
    setQuoteClientId(sale.client_id || 'none');
    setQuoteQuantity(1);
    setQuoteUnitPrice(sale.sale_price || 0);
    setQuoteNotes('');
    setQuoteValidDays(30);
    setQuotePreviewHtml('');
  };

  const handleGenerateQuoteFromSale = async () => {
    if (!quoteSale) return;
    if (!quoteUnitPrice || quoteUnitPrice <= 0) {
      toast.error('Inserisci un prezzo unitario valido');
      return;
    }
    setGeneratingQuote(true);
    try {
      const clientId = quoteClientId && quoteClientId !== 'none' ? quoteClientId : null;
      const selectedClient = clientId ? clients.find(c => c.id === clientId) : null;
      const items = [{
        description: quoteSale.product_name || 'Stampa 3D personalizzata',
        quantity: parseInt(quoteQuantity) || 1,
        unit_price: parseFloat(quoteUnitPrice),
      }];
      const res = await generateQuotePdf({
        client_id: clientId,
        client_name: selectedClient ? `${selectedClient.name} ${selectedClient.surname || ''}`.trim() : '',
        items,
        notes: quoteNotes,
        valid_days: parseInt(quoteValidDays) || 30,
        sale_id: quoteSale.id,
      });
      setQuotePreviewHtml(res.html);
      setQuoteNumber(res.quote_number || '');
      // Aggiorna mappa quote per far apparire il badge sulla riga
      try {
        const qMap = await getQuotesSalesMap();
        setQuotesMap(qMap || {});
      } catch { /* ignore */ }
      toast.success(`Preventivo ${res.quote_number} generato`);
    } catch {
      toast.error('Errore generazione preventivo');
    } finally {
      setGeneratingQuote(false);
    }
  };

  const handlePrintQuoteFromSale = () => {
    const win = window.open('', '_blank');
    win.document.write(quotePreviewHtml);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleDownloadQuotePdf = async () => {
    if (!quotePreviewHtml) return;
    setDownloadingPdf(true);
    try {
      const filename = `Preventivo_${quoteNumber || 'documento'}.pdf`;
      await downloadHtmlAsPdf(quotePreviewHtml, filename);
      toast.success('PDF scaricato');
    } catch {
      toast.error('Errore nel download del PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setEditPrice(sale.sale_price || 0);
    setEditName(sale.product_name || '');
    setEditClientId(sale.client_id || 'none');
    setEditAccessories((sale.accessories || []).map(a => ({ accessory_id: a.accessory_id, quantity: a.quantity || 1 })));
    setEditShipping(sale.shipping_cost || 0);
  };

  const addAccessoryToEdit = (accId) => {
    if (!accId || editAccessories.some(a => a.accessory_id === accId)) return;
    setEditAccessories(prev => [...prev, { accessory_id: accId, quantity: 1 }]);
  };
  const updateAccessoryQty = (accId, qty) => {
    setEditAccessories(prev => prev.map(a => a.accessory_id === accId ? { ...a, quantity: Math.max(1, parseInt(qty) || 1) } : a));
  };
  const removeAccessoryFromEdit = (accId) => {
    setEditAccessories(prev => prev.filter(a => a.accessory_id !== accId));
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;
    try {
      const payload = {
        sale_price: editPrice,
        product_name: editName,
        client_id: editClientId && editClientId !== 'none' ? editClientId : '',
        accessories: editAccessories,
        shipping_cost: editShipping,
      };
      await updateSale(editingSale.id, payload);
      // Ricarica dal backend per ottenere total_cost ricalcolato
      const updated = await getSales();
      setSales(updated);
      setEditingSale(null);
      toast.success('Vendita aggiornata');
    } catch {
      toast.error('Errore aggiornamento');
    }
  };

  // Get unique months
  const months = [...new Set(sales.map(s => s.date?.slice(0, 7)))].filter(Boolean).sort().reverse();

  // Filter sales
  const filteredSales = sales.filter(s => {
    const matchesSearch = s.product_name?.toLowerCase().includes(search.toLowerCase());
    const matchesMonth = monthFilter === 'all' || s.date?.startsWith(monthFilter);
    const matchesPaid = paidFilter === 'all' || 
      (paidFilter === 'paid' && s.paid) || 
      (paidFilter === 'unpaid' && !s.paid);
    return matchesSearch && matchesMonth && matchesPaid;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date_asc': return (a.date || '').localeCompare(b.date || '');
      case 'date_desc': return (b.date || '').localeCompare(a.date || '');
      case 'price_desc': return (b.sale_price || 0) - (a.sale_price || 0);
      case 'price_asc': return (a.sale_price || 0) - (b.sale_price || 0);
      case 'profit_desc': return (b.net_profit || 0) - (a.net_profit || 0);
      case 'profit_asc': return (a.net_profit || 0) - (b.net_profit || 0);
      case 'name_asc': return (a.product_name || '').localeCompare(b.product_name || '');
      default: return 0;
    }
  });

  // Calculate totals - separate paid and unpaid
  const paidSales = filteredSales.filter(s => s.paid);
  const unpaidSales = filteredSales.filter(s => !s.paid);
  
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + (s.net_profit || 0), 0);
  
  const paidRevenue = paidSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const paidProfit = paidSales.reduce((sum, s) => sum + (s.net_profit || 0), 0);
  
  const unpaidRevenue = unpaidSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const unpaidProfit = unpaidSales.reduce((sum, s) => sum + (s.net_profit || 0), 0);
  
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="sales-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Registro Vendite</h1>
          <p className="text-muted-foreground mt-1">Storico vendite con tracciamento pagamenti</p>
        </div>
        <Button onClick={handleExport} variant="outline" data-testid="export-sales-btn">
          <Download className="w-4 h-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fatturato Totale</p>
            <p className="text-xl font-heading font-bold font-mono">€{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Incassato</p>
            </div>
            <p className="text-xl font-heading font-bold font-mono text-emerald-500">€{paidRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground font-mono">Profitto: €{paidProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-yellow-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-500">Da Incassare</p>
            </div>
            <p className="text-xl font-heading font-bold font-mono text-yellow-500">€{unpaidRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground font-mono">Profitto: €{unpaidProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profitto Totale</p>
            <p className="text-xl font-heading font-bold font-mono text-primary">€{totalProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Margine Medio</p>
            <p className="text-xl font-heading font-bold font-mono">{avgMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca prodotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="search-sales"
          />
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="month-filter">
            <SelectValue placeholder="Mese" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i mesi</SelectItem>
            {months.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paidFilter} onValueChange={setPaidFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="paid-filter">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="paid">Pagati</SelectItem>
            <SelectItem value="unpaid">Non Pagati</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48" data-testid="sort-sales">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" /><SelectValue placeholder="Ordina" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Data (recente)</SelectItem>
            <SelectItem value="date_asc">Data (vecchio)</SelectItem>
            <SelectItem value="price_desc">Prezzo (alto)</SelectItem>
            <SelectItem value="price_asc">Prezzo (basso)</SelectItem>
            <SelectItem value="profit_desc">Profitto (alto)</SelectItem>
            <SelectItem value="profit_asc">Profitto (basso)</SelectItem>
            <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Table */}
      <Card className="border-border/40 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Caricamento...</div>
          ) : filteredSales.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-semibold mb-2">Nessuna vendita</h3>
              <p className="text-muted-foreground">Usa il calcolatore per registrare le vendite</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pagato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Materiale</TableHead>
                    <TableHead className="text-right">Qta</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Vendita</TableHead>
                    <TableHead className="text-right">Profitto</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map(sale => (
                    <TableRow key={sale.id} className={sale.paid ? 'bg-emerald-500/5' : ''} data-testid={`sale-row-${sale.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={sale.paid}
                          onCheckedChange={() => handleTogglePaid(sale.id, sale.paid)}
                          data-testid={`paid-checkbox-${sale.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">{sale.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sale.product_name}</span>
                          {sale.batch_total > 1 && (
                            <Badge variant="outline" className="text-[10px]">
                              {sale.batch_index}/{sale.batch_total}
                            </Badge>
                          )}
                          {sale.paid ? (
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/50 text-[10px]">
                              <CheckCircle className="w-2.5 h-2.5 mr-1" />
                              Pagato
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 text-[10px]">
                              <Clock className="w-2.5 h-2.5 mr-1" />
                              In attesa
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{sale.material_type}</TableCell>
                      <TableCell className="text-right font-mono">{sale.quantity || 1}</TableCell>
                      <TableCell className="text-right font-mono">€{sale.total_cost?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">€{sale.sale_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono font-semibold ${sale.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          €{sale.net_profit?.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary"
                            onClick={() => handleReprint(sale)}
                            title="Ristampa"
                            data-testid={`reprint-sale-${sale.id}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`h-7 w-7 relative ${quotesMap[sale.id]?.length ? 'text-emerald-500' : 'text-blue-500'}`}
                            onClick={() => handleOpenQuoteDialog(sale)}
                            title={quotesMap[sale.id]?.length
                              ? `Preventivo già generato (${quotesMap[sale.id].length}): ${quotesMap[sale.id][0].quote_number}. Clicca per generarne un altro.`
                              : 'Genera preventivo PDF da questa vendita'}
                            data-testid={`quote-sale-${sale.id}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {quotesMap[sale.id]?.length > 0 && (
                              <span
                                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-background"
                                data-testid={`quote-indicator-${sale.id}`}
                              />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEditSale(sale)}
                            title="Modifica"
                            data-testid={`edit-sale-${sale.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(sale.id)}
                            data-testid={`delete-sale-${sale.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sale Dialog */}
      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Vendita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome Prodotto</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="edit-sale-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Prezzo di Vendita (€)</Label>
              <DecimalInput
                value={editPrice}
                onChange={(num) => setEditPrice(num)}
                className="font-mono"
                data-testid="edit-sale-price"
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={editClientId || 'none'} onValueChange={setEditClientId}>
                <SelectTrigger data-testid="edit-sale-client">
                  <SelectValue placeholder="Nessun cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessun cliente</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.surname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Accessori modificabili (es. packaging aggiunto al momento della spedizione) */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Accessori (es. packaging)</span>
                {accessoriesList.length > 0 && (
                  <Select value="" onValueChange={addAccessoryToEdit}>
                    <SelectTrigger className="w-[180px] h-8 text-xs" data-testid="add-acc-edit">
                      <SelectValue placeholder="+ Aggiungi" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessoriesList.filter(a => !editAccessories.some(ea => ea.accessory_id === a.id)).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} (€{a.unit_cost?.toFixed(2)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Label>
              {editAccessories.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nessun accessorio sulla vendita</p>
              ) : (
                <div className="space-y-1.5">
                  {editAccessories.map(ea => {
                    const acc = accessoriesList.find(a => a.id === ea.accessory_id);
                    if (!acc) return null;
                    return (
                      <div key={ea.accessory_id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                        <span className="flex-1 text-sm">{acc.name} <span className="text-xs text-muted-foreground">€{acc.unit_cost?.toFixed(2)} · {acc.category}</span></span>
                        <Input
                          type="number"
                          min="1"
                          value={ea.quantity}
                          onChange={e => updateAccessoryQty(ea.accessory_id, e.target.value)}
                          className="w-16 h-8 text-xs"
                          data-testid={`acc-qty-${ea.accessory_id}`}
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeAccessoryFromEdit(ea.accessory_id)} data-testid={`acc-remove-${ea.accessory_id}`}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Spese di spedizione (€)</Label>
              <DecimalInput
                value={editShipping}
                onChange={(num) => setEditShipping(num)}
                className="font-mono"
                data-testid="edit-sale-shipping"
              />
              <p className="text-[10px] text-muted-foreground">Aggiunto al costo totale della vendita. Inseriscilo solo quando spedisci.</p>
            </div>

            {editingSale && (
              <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-md bg-muted/30">
                <p>Costo (originale): <span className="font-mono">€{editingSale.total_cost?.toFixed(2)}</span></p>
                <p>Profitto stimato post-modifica: <span className={`font-mono font-semibold ${(editPrice - (editingSale.total_cost || 0)) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  €{(editPrice - (editingSale.total_cost || 0)).toFixed(2)}
                </span></p>
                <p className="text-[10px]">Il costo finale e il profitto verranno ricalcolati dopo il salvataggio.</p>
              </div>
            )}
            <Button onClick={handleSaveEdit} className="w-full" data-testid="save-edit-sale">
              Salva Modifiche
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: genera preventivo PDF da vendita esistente */}
      <Dialog open={!!quoteSale} onOpenChange={(v) => { if (!v) { setQuoteSale(null); setQuotePreviewHtml(''); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="quote-from-sale-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Genera Preventivo da Vendita
            </DialogTitle>
          </DialogHeader>

          {!quotePreviewHtml ? (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/40 border border-border/40">
                <p className="text-xs text-muted-foreground">Vendita di riferimento</p>
                <p className="text-sm font-semibold">{quoteSale?.product_name || 'Prodotto senza nome'}</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {quoteSale?.created_at ? new Date(quoteSale.created_at).toLocaleDateString('it-IT') : ''}
                  {quoteSale?.sale_price ? ` · Prezzo originale: €${quoteSale.sale_price.toFixed(2)}` : ''}
                </p>
                {quoteSale && quotesMap[quoteSale.id]?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <p className="text-[11px] text-emerald-500 font-medium">
                      ⚠️ Preventivi già generati per questa vendita: <strong>{quotesMap[quoteSale.id].length}</strong>
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      Ultimo: {quotesMap[quoteSale.id][0].quote_number}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Cliente</Label>
                  <Select value={quoteClientId} onValueChange={setQuoteClientId}>
                    <SelectTrigger className="h-9" data-testid="quote-client-select">
                      <SelectValue placeholder="Nessun cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessun cliente</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} {c.surname || ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Validità (giorni)</Label>
                  <Input type="number" min="1" value={quoteValidDays} onChange={e => setQuoteValidDays(e.target.value)} className="h-9" data-testid="quote-valid-days" />
                </div>
                <div>
                  <Label className="text-xs">Quantità</Label>
                  <Input type="number" min="1" value={quoteQuantity} onChange={e => setQuoteQuantity(e.target.value)} className="h-9" data-testid="quote-quantity" />
                </div>
                <div>
                  <Label className="text-xs">Prezzo unitario (€)</Label>
                  <DecimalInput value={quoteUnitPrice} onChange={setQuoteUnitPrice} className="h-9" data-testid="quote-unit-price" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Note (opzionale)</Label>
                <Input value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} placeholder="Es. IVA esclusa, spedizione compresa..." className="h-9" data-testid="quote-notes" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="text-sm">
                  <span className="text-muted-foreground">Totale preventivo: </span>
                  <span className="font-mono font-bold text-primary">
                    €{((parseInt(quoteQuantity) || 0) * (parseFloat(quoteUnitPrice) || 0)).toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={handleGenerateQuoteFromSale}
                  disabled={generatingQuote}
                  data-testid="generate-quote-from-sale-btn"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  {generatingQuote ? 'Generazione...' : 'Genera Preventivo PDF'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Preventivo generato con successo. Anteprima sotto:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => { setQuotePreviewHtml(''); setQuoteNumber(''); }} data-testid="quote-back-btn">
                    <X className="w-3.5 h-3.5 mr-1" /> Modifica
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownloadQuotePdf} disabled={downloadingPdf} data-testid="download-quote-pdf-btn">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {downloadingPdf ? 'Generazione...' : 'Scarica PDF'}
                  </Button>
                  <Button size="sm" onClick={handlePrintQuoteFromSale} data-testid="print-quote-from-sale-btn">
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> Stampa
                  </Button>
                </div>
              </div>
              <div className="border rounded-md p-4 bg-white text-black max-h-[60vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: quotePreviewHtml }} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
