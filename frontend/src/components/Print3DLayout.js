import { Link, useLocation, Outlet } from 'react-router-dom';
import { Printer, Calculator as CalcIcon, Cylinder, Package, FileText } from 'lucide-react';

/**
 * Layout condiviso per la sezione "Calcolatore costi Stampa 3D".
 * Renderizza una barra tab sopra la pagina figlia, replicando la UX del modulo Cricut.
 */
export default function Print3DLayout() {
  const location = useLocation();
  const tabs = [
    { path: '/print3d/quotes', label: 'Preventivi', icon: FileText },
    { path: '/print3d/calculator', label: 'Calcolatore', icon: CalcIcon },
    { path: '/print3d/filaments', label: 'Filamenti', icon: Cylinder },
    { path: '/print3d/accessories', label: 'Accessori', icon: Package },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Calcolatore costi Stampa 3D</h1>
          <p className="text-xs text-muted-foreground">Preventivi, calcolatore, filamenti e accessori per stampa 3D</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2" data-testid="print3d-tabs">
        {tabs.map(t => {
          const active = location.pathname === t.path || location.pathname.startsWith(t.path + '/');
          const Icon = t.icon;
          return (
            <Link
              key={t.path}
              to={t.path}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
              data-testid={`print3d-tab-${t.path.split('/').pop()}`}
            >
              <Icon className="w-4 h-4" />{t.label}
            </Link>
          );
        })}
      </div>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
