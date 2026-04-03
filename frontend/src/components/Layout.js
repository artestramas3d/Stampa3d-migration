import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import { getActiveBanners, resendVerification } from '../lib/api';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { 
  LayoutDashboard, Cylinder, Calculator, ShoppingCart, Receipt, Settings,
  Menu, Sun, Moon, LogOut, Package, Megaphone, ShieldCheck, User, AlertTriangle, Mail
} from 'lucide-react';
import { toast } from 'sonner';

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
  const { t } = useLang();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/filaments', label: t('filaments'), icon: Cylinder },
    { path: '/accessories', label: t('accessories'), icon: Package },
    { path: '/calculator', label: t('calculator'), icon: Calculator },
    { path: '/sales', label: t('sales'), icon: Receipt },
    { path: '/purchases', label: t('purchases'), icon: ShoppingCart },
    { path: '/settings', label: t('settings'), icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="font-heading font-bold text-lg tracking-tight">Artes&Tramas</span>
        </Link>
        <span className="text-[10px] text-muted-foreground">Calcolatore</span>
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

        {/* Profile link */}
        <Link
          to="/profile"
          onClick={onNavigate}
          className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`}
          data-testid="nav-profile"
        >
          <User className="w-4 h-4" />
          <span>{t('profile')}</span>
        </Link>

        {/* Admin section */}
        {user?.is_admin && (
          <>
            <div className="mt-3 mb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('admin')}</span>
            </div>
            <Link
              to="/admin"
              onClick={onNavigate}
              className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}
              data-testid="nav-admin"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t('admin_panel')}</span>
            </Link>
            <Link
              to="/banners"
              onClick={onNavigate}
              className={`sidebar-link ${location.pathname === '/banners' ? 'active' : ''}`}
              data-testid="nav-banners"
            >
              <Megaphone className="w-4 h-4" />
              <span>{t('banners')}</span>
            </Link>
          </>
        )}

        {/* Sidebar banner slot */}
        <BannerSlot banners={banners} position="sidebar" />
      </nav>

      <div className="p-3 border-t border-border/40 space-y-2">
        <Button
          variant="ghost" size="sm"
          className="w-full justify-start gap-2"
          onClick={toggleTheme}
          data-testid="theme-toggle"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? t('light_theme') : t('dark_theme')}</span>
        </Button>
        <Button
          variant="ghost" size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </Button>
      </div>
    </div>
  );
}

function EmailVerificationBanner() {
  const { user, checkAuth } = useAuth();
  const { t } = useLang();
  const [resending, setResending] = useState(false);

  if (!user || user.email_verified) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success(t('resend_sent'));
    } catch { toast.error('Error'); }
    finally { setResending(false); }
  };

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 flex items-center justify-between gap-3" data-testid="email-verify-banner">
      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="text-sm">{t('email_not_verified_msg')}</span>
      </div>
      <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs border-yellow-500/50 text-yellow-600" onClick={handleResend} disabled={resending}>
        <Mail className="w-3 h-3 mr-1" />{t('resend_email')}
      </Button>
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

      {/* Email Verification Warning */}
      <EmailVerificationBanner />

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
            <span className="font-heading font-bold text-sm">Artes&Tramas</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-14 md:pt-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
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
