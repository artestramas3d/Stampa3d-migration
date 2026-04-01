import { useState, useEffect } from 'react';
import { getSales, deleteSale, updateSalePaid, exportSalesCSV } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Download, Trash2, Receipt, Search, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [paidFilter, setPaidFilter] = useState('all'); // all, paid, unpaid

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = await getSales();
      setSales(data);
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
                    <TableHead></TableHead>
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
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(sale.id)}
                          data-testid={`delete-sale-${sale.id}`}
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
