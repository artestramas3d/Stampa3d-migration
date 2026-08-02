import { Link } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';
import { ShoppingBag, ArrowLeft, Package } from 'lucide-react';

/**
 * 404 elegante per il dominio Shop.
 * Mostrato quando l'utente naviga su rotte SaaS (calculator, filaments, sales, ecc.)
 * dal dominio shop, o su rotte inesistenti.
 */
export default function NotFoundShopPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <SeoHead
        title="Pagina non trovata · Artes&Tramas 3D"
        description="La pagina che cerchi non è disponibile."
        noindex
      />

      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="shop-home-link">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm text-orange-500">Artes&amp;Tramas</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Shop 3D</div>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16">
        <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-orange-400" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-3">404</h1>
        <p className="text-xl font-semibold text-gray-800 mb-2">Pagina non trovata</p>
        <p className="text-sm text-gray-500 max-w-md mb-8">
          La pagina che stai cercando non esiste o è stata rimossa. Torna alla home o esplora i nostri prodotti.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-md"
            data-testid="back-to-shop-home"
          >
            <ArrowLeft className="w-4 h-4" /> Torna alla Home
          </Link>
          <Link
            to="/listino"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold border-2 border-orange-500 text-orange-500 hover:bg-orange-50 transition-colors"
          >
            Vedi tutti i prodotti
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-4 text-center text-[11px] text-gray-500">
        © {new Date().getFullYear()} Artes&amp;Tramas 3D
      </footer>
    </div>
  );
}
