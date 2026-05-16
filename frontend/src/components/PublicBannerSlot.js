import { useEffect, useState } from 'react';
import { getPublicBanners } from '../lib/api';

/**
 * Mostra i banner pubblici (TradeTracker, AdSense, HTML custom) gestiti dall'Admin.
 * - page: "demo" | "shop"
 * - position: "header" | "content" | "footer"
 */
export function PublicBannerSlot({ page, position }) {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let mounted = true;
    getPublicBanners(page).then(data => {
      if (mounted) setBanners(data || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [page]);

  const filtered = banners.filter(b => b.position === position);
  if (filtered.length === 0) return null;

  return (
    <div data-testid={`public-banner-${page}-${position}`} className="public-banner-slot w-full flex flex-col items-center gap-3 py-3">
      {filtered.map(b => (
        <div key={b.id} className="banner-content max-w-full overflow-hidden" dangerouslySetInnerHTML={{ __html: b.html_code }} />
      ))}
    </div>
  );
}
