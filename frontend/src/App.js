import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LangProvider } from "./context/LangContext";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import FilamentsPage from "./pages/FilamentsPage";
import AccessoriesPage from "./pages/AccessoriesPage";
import CalculatorPage from "./pages/CalculatorPage";
import SalesPage from "./pages/SalesPage";
import PurchasesPage from "./pages/PurchasesPage";
import SettingsPage from "./pages/SettingsPage";
import BannersPage from "./pages/BannersPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ProfilePage from "./pages/ProfilePage";
import BugReportPage from "./pages/BugReportPage";
import PublicListinoPage from "./pages/PublicListinoPage";
import HomeShopPage from "./pages/HomeShopPage";
import PublicProductDetailPage from "./pages/PublicProductDetailPage";
import { PageTracker } from "./components/PageTracker";
import LandingPage from "./pages/LandingPage";
import GuidePage from "./pages/GuidePage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import ClientsPage from "./pages/ClientsPage";
import QuotesPage from "./pages/QuotesPage";
import DemoCalculatorPage from "./pages/DemoCalculatorPage";
import { CookieBanner } from "./components/CookieBanner";
import { PublicScripts } from "./components/PublicScripts";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  // Se il dominio è shop/listino, mostra direttamente lo Shop pubblico (no login).
  // Il flag ?__shop=1 forza la modalita' shop anche dal preview per testing.
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const forceShop = typeof window !== 'undefined' && window.location.search.includes('__shop=1');
  const isShopDomain = host === 'shop.artestramas3d.it' || host === 'listino.artestramas3d.it' || forceShop;

  if (isShopDomain) {
    return (
      <>
        <PageTracker />
        <Routes>
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/shop/prodotto/:slug" element={<PublicProductDetailPage />} />
          <Route path="/prodotto/:slug" element={<PublicProductDetailPage />} />
          <Route path="/listino" element={<PublicListinoPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanelPage /></ProtectedRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/" element={<HomeShopPage />} />
          <Route path="*" element={<HomeShopPage />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <PageTracker />
      <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/filaments" element={<ProtectedRoute><FilamentsPage /></ProtectedRoute>} />
      <Route path="/accessories" element={<ProtectedRoute><AccessoriesPage /></ProtectedRoute>} />
      <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
      <Route path="/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/banners" element={<ProtectedRoute><BannersPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanelPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/bug-report" element={<ProtectedRoute><BugReportPage /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
      <Route path="/quotes" element={<ProtectedRoute><QuotesPage /></ProtectedRoute>} />
      {/* Public pages - no auth */}
      <Route path="/listino" element={<PublicListinoPage />} />
      <Route path="/shop/prodotto/:slug" element={<PublicProductDetailPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/demo" element={<DemoCalculatorPage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/cookie-policy" element={<CookiePolicyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
              <CookieBanner />
              <PublicScripts />
              <Toaster position="top-right" richColors />
            </BrowserRouter>
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
