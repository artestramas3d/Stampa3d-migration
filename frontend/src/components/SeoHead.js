import { Helmet } from 'react-helmet-async';

/**
 * Componente SEO/Open Graph riusabile.
 *
 * Props:
 *  - title: string (required) - Titolo pagina (mostrato nel tab + Google)
 *  - description: string - Meta description (<=160 char consigliato)
 *  - image: string - URL immagine per Open Graph (idealmente 1200x630)
 *  - url: string - URL canonico (default: window.location.href)
 *  - type: 'website'|'article'|'product' (default 'website')
 *  - jsonLd: object - schema.org JSON-LD (opzionale)
 *  - noindex: bool - se true aggiunge robots noindex
 */
export function SeoHead({
  title,
  description = '',
  image = '',
  url = '',
  type = 'website',
  siteName = 'Artes&Tramas 3D',
  jsonLd = null,
  noindex = false,
}) {
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : '');
  const cleanDesc = (description || '').slice(0, 300);

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      {cleanDesc && <meta name="description" content={cleanDesc} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      {cleanDesc && <meta property="og:description" content={cleanDesc} />}
      {image && <meta property="og:image" content={image} />}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="it_IT" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      {cleanDesc && <meta name="twitter:description" content={cleanDesc} />}
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD structured data (Product/Organization) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
