import { useState, useEffect } from 'react';
import { getDashboardStats } from '../lib/api';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { 
  TrendingUp, 
  Euro, 
  Scale, 
  Clock, 
  ShoppingBag,
  Percent,
  Trophy,
  AlertTriangle,
  Cylinder,
  Package
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

function StatCard({ title, value, icon: Icon, suffix = '', prefix = '' }) {
  return (
    <Card className="stat-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-heading font-bold">
              {prefix}<span className="font-mono">{value}</span>{suffix}
            </p>
          </div>
          <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Panoramica delle tue attività di stampa 3D</p>
      </div>

      {/* Low Stock Alerts */}
      {(stats?.low_stock_filaments?.length > 0 || stats?.low_stock_accessories?.length > 0) && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10" data-testid="dashboard-alerts">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-heading">Scorte in Esaurimento!</AlertTitle>
          <AlertDescription>
            <div className="space-y-3 mt-2">
              {stats?.low_stock_filaments?.length > 0 && (
                <div className="flex items-start gap-2">
                  <Cylinder className="w-4 h-4 mt-0.5 text-red-400" />
                  <div>
                    <span className="font-semibold">Filamenti sotto 200g:</span>
                    <ul className="mt-1 space-y-0.5">
                      {stats.low_stock_filaments.map(f => (
                        <li key={f.id} className="font-mono text-sm">
                          • {f.material_type} {f.color} ({f.brand}): <strong>{Math.round(f.remaining_grams)}g</strong>
                        </li>
                      ))}
                    </ul>
                    <Link to="/filaments">
                      <Button variant="link" size="sm" className="p-0 h-auto text-red-400 hover:text-red-300">
                        Vai ai Filamenti →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              {stats?.low_stock_accessories?.length > 0 && (
                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 mt-0.5 text-red-400" />
                  <div>
                    <span className="font-semibold">Accessori sotto 10 pezzi:</span>
                    <ul className="mt-1 space-y-0.5">
                      {stats.low_stock_accessories.map(a => (
                        <li key={a.id} className="font-mono text-sm">
                          • {a.name}: <strong>{a.stock_quantity} pz</strong>
                        </li>
                      ))}
                    </ul>
                    <Link to="/accessories">
                      <Button variant="link" size="sm" className="p-0 h-auto text-red-400 hover:text-red-300">
                        Vai agli Accessori →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Fatturato Totale"
          value={stats?.total_sales?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '0.00'}
          icon={Euro}
          prefix="€"
        />
        <StatCard
          title="Profitto Totale"
          value={stats?.total_profit?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '0.00'}
          icon={TrendingUp}
          prefix="€"
        />
        <StatCard
          title="Filamento Usato"
          value={stats?.total_grams?.toLocaleString('it-IT') || '0'}
          icon={Scale}
          suffix=" g"
        />
        <StatCard
          title="Ore di Stampa"
          value={stats?.total_hours?.toLocaleString('it-IT', { minimumFractionDigits: 1 }) || '0'}
          icon={Clock}
          suffix=" h"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Spesa Filamenti"
          value={stats?.total_purchases?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '0.00'}
          icon={ShoppingBag}
          prefix="€"
        />
        <StatCard
          title="Margine Medio"
          value={stats?.avg_margin?.toFixed(1) || '0.0'}
          icon={Percent}
          suffix="%"
        />
        <StatCard
          title="Più Redditizio"
          value={stats?.most_profitable || 'N/A'}
          icon={Trophy}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Andamento Mensile</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.chart_data?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.chart_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    fontFamily="JetBrains Mono"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '2px',
                      fontFamily: 'JetBrains Mono'
                    }}
                    formatter={(value) => [`€${value.toFixed(2)}`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Fatturato"
                    dot={{ fill: 'hsl(var(--chart-1))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    name="Profitto"
                    dot={{ fill: 'hsl(var(--chart-3))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Prodotti Più Redditizi</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.top_products?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.top_products} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '2px',
                      fontFamily: 'JetBrains Mono'
                    }}
                    formatter={(value) => [`€${value.toFixed(2)}`, 'Profitto']}
                  />
                  <Bar 
                    dataKey="profit" 
                    fill="hsl(var(--chart-1))"
                    radius={[0, 2, 2, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nessun prodotto venduto
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
