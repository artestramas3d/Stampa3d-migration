import { useState, useEffect } from 'react';
import { getSales, deleteSale, exportSalesCSV } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Download, Trash2, Receipt, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');

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

  const handleExport = () => {
    window.open(exportSalesCSV(), '_blank');
  };

  // Get unique months
  const months = [...new Set(sales.map(s => s.date?.slice(0, 7)))].filter(Boolean).sort().reverse();

  // Filter sales
  const filteredSales = sales.filter(s => {
    const matchesSearch = s.product_name?.toLowerCase().includes(search.toLowerCase());
    const matchesMonth = monthFilter === 'all' || s.date?.startsWith(monthFilter);
    return matchesSearch && matchesMonth;
  });

  // Calculate totals
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + (s.net_profit || 0), 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="sales-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Registro Vendite</h1>
          <p className="text-muted-foreground mt-1">Storico delle vendite e profitti</p>
        </div>
        <Button onClick={handleExport} variant="outline" data-testid="export-sales-btn">
          <Download className="w-4 h-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fatturato</p>
            <p className="text-2xl font-heading font-bold font-mono">€{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profitto</p>
            <p className="text-2xl font-heading font-bold font-mono text-emerald-500">€{totalProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Margine Medio</p>
            <p className="text-2xl font-heading font-bold font-mono">{avgMargin.toFixed(1)}%</p>
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
          <SelectTrigger className="w-full sm:w-48" data-testid="month-filter">
            <SelectValue placeholder="Tutti i mesi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i mesi</SelectItem>
            {months.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
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
                    <TableHead>Data</TableHead>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Materiale</TableHead>
                    <TableHead className="text-right">Grammi</TableHead>
                    <TableHead className="text-right">Ore</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Vendita</TableHead>
                    <TableHead className="text-right">Profitto</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map(sale => (
                    <TableRow key={sale.id} data-testid={`sale-row-${sale.id}`}>
                      <TableCell className="font-mono text-muted-foreground">{sale.date}</TableCell>
                      <TableCell className="font-semibold">{sale.product_name}</TableCell>
                      <TableCell>{sale.material_type}</TableCell>
                      <TableCell className="text-right">{sale.grams_used}g</TableCell>
                      <TableCell className="text-right">{sale.print_time_hours}h</TableCell>
                      <TableCell className="text-right">€{sale.total_cost?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{sale.sale_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={sale.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}>
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
