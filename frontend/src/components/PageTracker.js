import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/api';

const STORAGE_KEY = 'at3d_visitor_id';

function getVisitorId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = 'v_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/**
 * Hook globale che traccia la navigazione del frontend.
 * - Crea/recupera un visitor_id in localStorage
 * - Normalizza i path per evitare esplosione di chiavi (es. /shop/prodotto/:slug → /shop/prodotto/*)
 */
export function PageTracker() {
  const location = useLocation();
  const lastTracked = useRef('');

  useEffect(() => {
    const raw = location.pathname || '/';
    // Normalizzazione
    let path = raw;
    if (raw.startsWith('/shop/prodotto/')) path = '/shop/prodotto/*';
    else if (raw.startsWith('/prodotto/')) path = '/shop/prodotto/*';
    else if (raw.startsWith('/reset-password/')) path = '/reset-password/*';
    if (lastTracked.current === path) return;
    lastTracked.current = path;
    const vid = getVisitorId();
    trackPageView(path, vid);
  }, [location.pathname]);

  return null;
}
