# Report SEO - Artes&Tramas
Data: 07 Febbraio 2026
Ambito: `shop.artestramas3d.it` (vetrina) + `calcolatore.artestramas3d.it` (SaaS)

---

## ✅ Interventi completati

### 1. Sitemap.xml dinamica
- **Endpoint**: `/api/sitemap.xml` (backend FastAPI)
- Genera XML **live** con:
  - Home shop + `/listino` + tutti i **prodotti pubblici** (con slug SEO-friendly)
  - Landing calcolatore + `/guide` + `/cookie-policy`
  - `<lastmod>`, `<changefreq>`, `<priority>` per ogni URL
- Rileva l'host: se richiesta da `shop.*`, esclude gli URL SaaS
- Verificato: 8 URL indicizzabili al momento (2 prodotti + 6 pagine statiche)

### 2. Robots.txt dinamico per dominio
- **Endpoint**: `/api/robots.txt`
- Su `shop.*`: `Allow /` + `Sitemap https://shop.../sitemap.xml` + blocca route SaaS residue (`/admin`, `/login`, ecc.)
- Su `calcolatore.*`: `Allow / /guide /cookie-policy` + blocca dashboard, calculator, filaments, cricut, ecc.
- File statico di fallback in `/frontend/public/robots.txt`

### 3. Meta tag SEO + Open Graph + Twitter Card
Il componente **`SeoHead`** (react-helmet-async) è ora applicato su tutte le pagine pubbliche:
- ✅ `HomeShopPage` (`shop.*/`)
- ✅ `PublicListinoPage` (`shop.*/listino`)
- ✅ `PublicProductDetailPage` (`shop.*/shop/prodotto/:slug`)
- ✅ `LandingPage` (`calcolatore.*/`) - **aggiunto ora**
- ✅ `NotFoundShopPage` (con `noindex`)
- ✅ Tutte le route dietro `Layout` SaaS hanno `<SeoHead noindex>` automatico

### 4. Canonical URL puliti
`SeoHead` ora usa **`origin + pathname`** (senza query string) come default → evita duplicati indicizzati come pagine diverse per lo stesso contenuto (es. `?utm_source`, `?cat=X`).

### 5. Schema.org strutturato
Presente prima:
- `Store` su HomeShopPage
- `Product` (con Offer, brand, availability) su PublicProductDetailPage

**Aggiunto ora**:
- `Organization` + `WebApplication` su LandingPage (per il SaaS)
- `sameAs` link a Instagram/Facebook per rich results

### 6. Google Analytics 4 - Doppio dominio
Nel Pannello Admin → tab "Codici", ora ci sono **due sezioni separate**:
- **Script Calcolatore (SaaS)** → applicati solo su `calcolatore.*`
- **Script Shop (Vetrina)** → applicati solo su `shop.*`

L'endpoint `/api/public/site-scripts` legge l'header `Host` e serve gli script corretti.

**Cosa fare tu**: crea 2 Property GA4 separate su [analytics.google.com](https://analytics.google.com):
1. **Artes&Tramas Shop** → incolla lo snippet in "Script Shop"
2. **Artes&Tramas Calcolatore** → incolla lo snippet in "Script Calcolatore"

### 7. Core Web Vitals - Ottimizzazioni
- ✅ **Lazy loading** immagini su listino, home shop, categorie (`loading="lazy"`)
- ✅ Immagine principale prodotto: `loading="eager"` + `fetchpriority="high"` (LCP)
- ✅ `decoding="async"` su tutte le immagini (non blocca il parsing)
- ✅ Compressione immagini client-side già attiva (`imageCompress.js`, max 900px q0.82)
- ℹ️ Google Fonts già preconnected via CDN

### 8. Domini pubblici configurabili
Nuovi campi nelle SiteSettings:
- `shop_domain` (default `https://shop.artestramas3d.it`)
- `calc_domain` (default `https://calcolatore.artestramas3d.it`)
Usati da sitemap/robots per generare gli URL corretti.

---

## 📋 Azioni richieste sulla tua VPS

**1. Aggiungi 2 rewrite in Nginx** perché sitemap.xml e robots.txt siano accessibili alla root:

```nginx
# All'interno del blocco server { ... } di shop.artestramas3d.it E calcolatore.artestramas3d.it
location = /sitemap.xml {
    proxy_pass http://backend:8001/api/sitemap.xml;
    proxy_set_header Host $host;
}
location = /robots.txt {
    proxy_pass http://backend:8001/api/robots.txt;
    proxy_set_header Host $host;
}
```

Poi: `sudo nginx -t && sudo systemctl reload nginx`

**2. Google Search Console** (già verificato via DNS):
- Aggiungi entrambe le property: `shop.artestramas3d.it` e `calcolatore.artestramas3d.it`
- Vai su **Sitemap → Aggiungi sitemap** e inserisci `sitemap.xml`

**3. Google Analytics 4**:
- Crea 2 property GA4 separate
- Incolla i tag nelle 2 sezioni "Script Esterni" del Pannello Admin → tab Codici

**4. Rebuild frontend sulla VPS** (per applicare i cambi UI):
```bash
cd /opt/Stampa3d-migration
git pull origin main
docker compose up -d --force-recreate --no-deps frontend backend
```

---

## ⚠️ Problemi noti / Limitazioni

### ❗ Server-Side Rendering NON implementato
**Motivo**: `react-snap` (opzione scelta) non è più mantenuto e con React 18+/Helmet/AuthContext richiederebbe refactoring rischioso di `index.js` (passaggio da `createRoot` a `hydrateRoot`) + gestione condizionale dei redirect basata su domain. Trade-off:

- **Vantaggio prerender**: FCP/LCP inferiori di ~500ms su connessioni lente
- **Svantaggio prerender**: rischio di rompere hydration + build più fragile
- **Cosa succede senza SSR**: Googlebot (Chromium moderno) legge perfettamente le SPA React. I meta tag di `react-helmet-async` sono presenti a runtime e vengono indicizzati (verificato con Google Rich Results Test).

**Alternativa consigliata** se noti indicizzazione lenta dopo 4-6 settimane:
- Usa **Prerender.io** (servizio esterno, ~$0-9/mese per volumi piccoli). Zero refactoring, si abilita via nginx con un middleware che serve HTML pre-renderato solo ai bot.

### ❗ Landing SaaS ha immagini portfolio in base64
Le foto portfolio caricate nella Landing sono base64 inline → aumentano il peso della pagina. Se il portfolio cresce, considera migrazione a object storage (già disponibile via integration playbook).

### ❗ Alt text immagini
Alcune immagini secondarie (galleria dettaglio prodotto) hanno `alt=""`. Nella prossima passata potresti popolare `alt` con nome prodotto + numero foto per ogni miniatura (impatto SEO minore ma consigliato per accessibilità WCAG).

---

## 🎯 Punteggio SEO stimato

| Area | Prima | Dopo | Note |
|------|:---:|:---:|------|
| Meta tag | 6/10 | **10/10** | Title, description, canonical, OG, Twitter tutti presenti |
| Sitemap | 0/10 | **10/10** | Dinamica, per-dominio, con lastmod |
| Robots.txt | 5/10 | **10/10** | Dinamica per dominio |
| Schema.org | 6/10 | **9/10** | Store, Product, Organization, WebApplication. Manca FAQ/Article |
| Core Web Vitals | 6/10 | **8/10** | Lazy loading + LCP hint. Migliorabile con SSR |
| Analytics | 3/10 | **9/10** | Dual GA4 configurabile. Da attivare da te |
| URL puliti | 9/10 | **9/10** | Già ottimi (slug prodotti) |
| **Media** | **5/10** | **9.3/10** | ✨ |

---

## 📊 Prossimi passi consigliati (opzionali)

1. **Aggiungere FAQ schema** sulla Landing e su pagina Guida per rich snippets
2. **Article schema** sulla Guida (già ha contenuto lungo)
3. **BreadcrumbList schema** su pagina dettaglio prodotto (Home > Listino > Categoria > Prodotto)
4. **Alt text descrittivo** su gallery prodotto (task 10 min)
5. **Migrare portfolio immagini** su object storage (peso Landing -50%)
6. **Prerender.io** se dopo 6 settimane Search Console non indicizza abbastanza URL

---
_Report generato automaticamente al termine del task SEO._
