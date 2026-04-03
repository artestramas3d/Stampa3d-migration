import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getActiveBanners } from '../lib/api';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { 
  LayoutDashboard, 
  Cylinder, 
  Calculator, 
  ShoppingCart, 
  Receipt, 
  Settings,
  Menu,
  Sun,
  Moon,
  LogOut,
  Printer,
  Package,
  Megaphone,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/filaments', label: 'Filamenti', icon: Cylinder },
  { path: '/accessories', label: 'Accessori', icon: Package },
  { path: '/calculator', label: 'Calcolatore', icon: Calculator },
  { path: '/sales', label: 'Vendite', icon: Receipt },
  { path: '/purchases', label: 'Acquisti', icon: ShoppingCart },
  { path: '/settings', label: 'Impostazioni', icon: Settings },
];

function BannerSlot({ banners, position }) {
  const filtered = banners.filter(b => b.position === position);
  if (filtered.length === 0) return null;
  return (
    <div data-testid={`banner-slot-${position}`}>
      {filtered.map(b => (
        <div key={b.id} className="banner-slot" dangerouslySetInnerHTML={{ __html: b.html_code }} />
      ))}
    </div>
  );
}

function Sidebar({ onNavigate, banners }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center">
            <Printer className="w-4 h-4 text-primary" />
          </div>
          <span className="font-heading font-bold text-lg">FilamentProfit</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Admin: Banner management */}
        {user?.is_admin && (
          <>
            <div className="mt-3 mb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin</span>
            </div>
            <Link
              to="/admin"
              onClick={onNavigate}
              className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}
              data-testid="nav-admin"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Pannello</span>
            </Link>
            <Link
              to="/banners"
              onClick={onNavigate}
              className={`sidebar-link ${location.pathname === '/banners' ? 'active' : ''}`}
              data-testid="nav-banners"
            >
              <Megaphone className="w-4 h-4" />
              <span>Banner</span>
            </Link>
          </>
        )}

        {/* Sidebar banner slot */}
        <BannerSlot banners={banners} position="sidebar" />
      </nav>

      <div className="p-3 border-t border-border/40 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={toggleTheme}
          data-testid="theme-toggle"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Tema Chiaro' : 'Tema Scuro'}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          <span>Esci</span>
        </Button>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    getActiveBanners().then(setBanners).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="main-layout">
      {/* Header Banner */}
      <BannerSlot banners={banners} position="header" />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-border/40 bg-card flex-col fixed h-screen">
          <Sidebar banners={banners} />
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border/40 h-14 flex items-center px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar onNavigate={() => setMobileOpen(false)} banners={banners} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 ml-3">
            <Printer className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold">FilamentProfit</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-14 md:pt-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}

            {/* Content bottom banner */}
            <div className="mt-6">
              <BannerSlot banners={banners} position="content" />
            </div>
          </div>
        </main>
      </div>

      {/* Footer Banner */}
      <footer className="md:ml-64">
        <BannerSlot banners={banners} position="footer" />
      </footer>
    </div>
  );
}
