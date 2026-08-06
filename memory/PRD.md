# FilamentProfit - PRD

## Problema Originale
App web calcolatore costi stampa 3D per maker. Traccia costi, materiali, vendite e profittabilità.

## Stack: React + FastAPI + MongoDB + JWT Auth

## Funzionalità Completate
1. Autenticazione JWT con cookies httpOnly
2. Dashboard con statistiche, grafici, avvisi scorte
3. CRUD Filamenti con avvisi scorte basse (< 200g)
4. CRUD Stampanti con ammortamento/elettricità
5. CRUD Accessori
6. Acquisti con creazione automatica filamenti
7. Calcolatore Costi (multicolore, quantità, prezzo manuale, ore/minuti stampa+design)
8. Registro Vendite con toggle Pagato/Non Pagato
9. Esportazione CSV (vendite + acquisti)
10. Tema chiaro/scuro
11. Banner pubblicitari (4 posizioni) - Solo admin
12. Pannello Admin: Utenti, Prodotti, Sito, Landing, Newsletter, Segnalazioni, Preventivi, Email Log
13. Recupero Password via SMTP reale (Aruba)
14. Conferma Email con email di benvenuto HTML
15. Multi-lingua: IT, EN, ES, FR
16. Profilo Utente: cambia nome, lingua, password
17. SMTP Reale: smtps.aruba.it
18. Deploy Docker: docker-compose.yml, Dockerfiles, Nginx SSL
19. Impostazioni Sito: nome brand, sottotitolo, colori primario/accento (dinamici via CSS vars)
20. Newsletter con Programmazione: invio immediato o programmato, scheduler background 60s
21. Segnalazione Problemi: bug report con screenshot, gestione admin con stati
22. **Catalogo Prodotti** (06/04/2026): CRUD prodotti con foto, toggle pubblico/nascosto, gestito da Admin Panel tab "Prodotti"
23. **Listino Pubblico** (06/04/2026): Pagina /listino senza auth, mostra prodotti pubblici con filtri categoria. Pensato per listino.artestramas3d.it
24. **Landing Page** (06/04/2026): Pagina /landing senza auth con hero, chi siamo, servizi, portfolio prodotti, form preventivo. Preventivi inviati a info@artestramas3d.it
25. **Import Bambu Studio .3mf** (06/04/2026): Upload file .3mf nel calcolatore, estrae tempo stampa e grammi filamento dal metadata. Disponibile a tutti gli utenti.
26. **Admin Landing Settings**: Configura hero, about, servizi, contatti e social dal Pannello Admin
27. **Admin Preventivi**: Visualizza richieste preventivo dal form pubblico
28. **Filamenti Bicolore** (06/04/2026): Supporto dual-color con split diagonale UI (color_hex2) in Inventario, Calcolatore, Acquisti, Vendite
29. **Ordinamento Frontend** (06/04/2026): Sorting per Vendite e Acquisti
30. **Guida Utente PDF** (06/04/2026): Pagina /guide stampabile multilingua (IT, EN, DE, FR)
31. **Fix Input Decimali** (06/05/2026): Componente DecimalInput riutilizzabile per gestire correttamente numeri decimali in tutti gli input (Calcolatore, Filamenti, Acquisti). Supporta separatore punto e virgola.
32. **Selettore Lingua pre-login** (06/05/2026): Componente LanguageSelector (IT/EN/ES/FR) aggiunto a Login, Registrazione e Password Dimenticata. Scelta salvata in localStorage.
33. **Newsletter Migliorata** (06/05/2026): Editor HTML con toolbar (grassetto, corsivo, sottolineato, H2/H3, elenchi, link, colore testo), selezione destinatari (tutti o utenti specifici con ricerca/checkbox), toggle formattato/testo semplice, anteprima email, supporto invio HTML via SMTP
34. **Fix Parser .3mf Multi-Slicer** (06/05/2026): Riscritto parser con 5 strategie di fallback: plate JSON (Bambu/Orca), slice_info.config, PrintTicket.xml (Creality Print), XML model metadata, gcode comments (formato Bambu, Creality, Cura, PrusaSlicer). Calcolo grammi da lunghezza filamento quando peso = 0.
35. **Cookie Banner + Cookie Policy** (06/05/2026): Banner GDPR-compliant con consenso granulare (Tecnici sempre attivi, Analitici e Marketing opzionali). Pagina /cookie-policy con tabella cookie, diritti utente, gestione preferenze. Link nel footer di Landing e Listino.
36. **Email Benvenuto con Guida** (06/05/2026): Aggiunta sezione "Guida Completa" con link a /guide nella welcome email.
37. **v0.4 - Ristampa dalle Vendite** (08/05/2026): Pulsante stampante nelle vendite che naviga al calcolatore pre-compilando filamenti, stampante, tempo, accessori e nome prodotto.
38. **v0.4 - Quantità Singole nelle Vendite** (08/05/2026): Quando qty > 1, crea righe individuali (batch_id, batch_index/batch_total). Ogni pezzo può essere pagato/non pagato e con prezzo modificabile indipendentemente.
39. **v0.4 - Modifica Prezzo Vendita** (08/05/2026): Dialog modifica per nome prodotto e prezzo di vendita con ricalcolo automatico profitto.
40. **v0.4 - Fix 3MF Unsliced** (08/05/2026): Messaggio errore chiaro quando file .3mf non è stato slicato (solo modello 3D, nessun gcode).
41. **Fase 1 - Gestione Clienti** (10/05/2026): CRUD clienti con ricerca, export CSV, storico acquisti.
42. **Fase 1 - Dati Aziendali** (10/05/2026): Nome, indirizzo, P.IVA, telefono, email, logo per intestazione PDF.
43. **Fase 1 - Preventivi PDF** (10/05/2026): Generazione preventivi con prodotti/prezzi (senza costi interni), selezione cliente, anteprima e stampa PDF.
44. **Fase 1 - Export CSV** (10/05/2026): Export CSV per filamenti e clienti.
45. **Fase 1 - Guida Backup** (10/05/2026): GUIDA_BACKUP.md con backup/ripristino database MongoDB.
46. **Calcolatore - Cliente e Preventivo** (10/05/2026): Selezione cliente nel calcolatore, associazione cliente alla vendita, bottone "Genera Preventivo PDF" diretto dal calcolatore con anteprima e stampa.
47. **Vetrina Pubblica Multi-foto** (16/02/2026): Rifatta pagina /listino come storefront con prodotti multi-foto (max 5, base64), descrizione, prezzo, categoria. Carousel per-card con frecce + dots cliccabili. Pulsante "Richiedi Info / Acquista" e "Richiedi Prodotto Personalizzato" che aprono form (nome/email/telefono/messaggio) e inviano richiesta a info@artestramas3d.it via endpoint POST /api/public/product-inquiry. Inquiry salvate in db.inquiries. Modal con chiusura Escape + backdrop click + mutua esclusività. Tab "Prodotti" spostato dentro "Gestione Vetrina" nell'Admin Panel con upload multi-foto.
48. **Shop Avanzato + Pagina Prodotto** (Feb 2026): Pagina prodotto dedicata `/shop/:slug` con descrizione lunga, gallerie immagini, varianti (colore/dimensione), input personalizzazione, form richiesta ordine. Multi-page banners (Demo/App/Shop). Admin: tab "Richieste Ordine" + top viewed products. Collaborazione admin (tutti gli admin gestiscono tutti i prodotti). Toggle visibilità prezzo ("Scrivici per il prezzo"). Tracking page views interno con `PageTracker.js` + `PageAnalyticsTab`.
49. **Calculator Pro** (Feb 2026): Manutenzione, scarto/yield rate, IVA 22%.
50. **Vendite con Spedizione** (Feb 2026): `shipping_cost`, fix `client_id` su edit, "Spedizioni Mese" su dashboard, categorie accessori dinamiche.
51. **Link Affiliati Dinamici** (01/06/2026): CRUD admin link sponsorizzati (Amazon, Bambu Lab, 3DJake) con multi-placement (guida, shop_footer, calculator, demo), is_active, sort_order, tracking click via `POST /api/affiliate-links/{id}/click`. Endpoint pubblico `GET /api/affiliate-links/{placement}` (clicks nascosto). Componente React `AffiliateLinks` (card o compact mode) con rel=sponsored noopener. Tab "Affiliati" in Admin Panel. Robustness: ObjectId malformato → 400, link inesistente su update/delete/click → 404. Backend 19/19 test passati, frontend regression-clean (10 tab Admin testati).
52. **Analytics Migliorate** (01/07/2026): Grafico giornaliero ora mostra sia totali (barra chiara di sfondo) sia unici (barra piena in primo piano) con numeri sopra la barra, legenda colori, e tabella riassuntiva sotto (Giorno / Totali / Unici / Ripetute + riga totale periodo).
53. **Pilastro 1 Monetizzazione — Affiliati Amplificati** (01/07/2026): (a) Nuovo endpoint `GET /api/admin/affiliate-links/stats?days=N` (auth admin) con daily clicks, top 10 link, total_clicks_period e total_clicks_all_time (aggregate su TUTTI i link, non solo top-10); (b) Widget `AffiliateStatsCard` nel tab Affiliati Admin con grafico click/giorno + top 5 link (selettori 7/14/30gg); (c) Aggiunti 2 nuovi placement: `filaments_low_stock` (card contestuale in `/filaments` quando scorte < 200g) e `dashboard` (footer home utente). Backend 11/11 test passati, frontend regression-clean.
54. **Coupon negli Affiliati** (02/07/2026): Aggiunto campo `coupon_code` (opzionale, max 30 char, uppercase auto) al modello AffiliateLink. Nel form Admin nuovo input dedicato. Nella lista Admin badge con il codice accanto al titolo. Nel componente pubblico `<AffiliateLinks />` il coupon appare come bottone "Copia" (con feedback Check + toast) che triggera anche il tracking click (indica intent forte). Supporto sia in modalità card che compact. Endpoint pubblico espone `coupon_code` (safe, come URL).
55. **UI Fix Frecce Spinner** (10/07/2026): Nuovo componente `NumberSpinner` che nasconde le frecce native `-webkit-inner-spin-button` (inaffidabili nel dark mode) e mostra chevron SVG chiari sempre leggibili con lucide-react (`ChevronUp`/`ChevronDown`). Frecce cliccabili con disable automatico a min/max. Sostituiti tutti i 7 input `type=number` nel Calcolatore. CSS globale in `index.css` disabilita frecce native su tutta l'app.
56. **Preventivi PDF da Vendite Pregresse** (10/07/2026): Nuovo pulsante `FileText` blu nelle azioni di ogni riga della `SalesPage`. Al click apre dialog `Genera Preventivo da Vendita` precompilato con nome prodotto, prezzo, cliente della vendita. L'utente può modificare cliente, quantità, prezzo, validità, note prima di generare il PDF via endpoint esistente `/api/quotes/generate-pdf`. Preview HTML integrata + stampa/salva PDF. Riuso completo del flow esistente del Calcolatore.
57. **Indicatore Preventivi già Generati** (10/07/2026): Aggiunto campo `sale_id` opzionale a `QuoteCreate` (backend) per collegare preventivi a vendite. Nuovo endpoint `GET /api/quotes/sales-map` ritorna mapping `{sale_id: [{quote_number, created_at}, ...]}`. In `SalesPage`: se una vendita ha già preventivi, il pulsante `FileText` diventa **verde** con **pallino verde** in alto a destra (invece del blu default) + dialog mostra box informativo "Preventivi già generati per questa vendita: N — Ultimo: PRV-...". Evita duplicati inconsapevoli.
58. **Download PDF Preventivi** (10/07/2026): Installato `html2pdf.js`. Nuova utility `/lib/pdfExport.js` con funzione `downloadHtmlAsPdf(html, filename)` che converte HTML → PDF client-side (html2canvas + jsPDF, A4 portrait, scale 2x). Aggiunto pulsante **"Scarica PDF"** sia nel dialog "Genera Preventivo da Vendita" (SalesPage) sia nel dialog "Anteprima Preventivo" (CalculatorPage). Filename automatico: `Preventivo_PRV-YYYYMMDD-HHMMSS.pdf`. Il precedente pulsante "Stampa / Salva PDF" ora è diviso in 2: **"Scarica PDF"** (download vero file) + **"Stampa"** (window.print).
59. **Fix PDF Bianco/Nero + Crash QuotesPage** (19/07/2026): Due bug corretti:
    - `pdfExport.js` riscritto usando iframe temporaneo con `opacity:0` + `pointer-events:none` per isolare il rendering dagli stili globali. Force `background:#ffffff !important` su `<html>` e `<body>` dell'iframe + inline style + `color-scheme: light` per evitare ereditarietà del tema dark del parent (bug: PDF risultavano con sfondo NERO perché html2canvas catturava il tema dark). PDF ora 111KB (prima 3KB bianco/44KB nero) con sfondo bianco, testo leggibile, header arancione. Verificato con `pdftoppm`.
    - `QuotesPage.js`: importato `Badge` da `../components/ui/badge` (mancante). Il componente era usato alla riga 313 per il badge "Inviato" quando un preventivo aveva `sent_to` popolato, causando **schermo nero e crash React** appena l'utente inviava un preventivo via email e tornava sulla pagina Storico.
    - Aggiunto pulsante "Scarica PDF" anche nel dialog di `QuotesPage` per coerenza (3 pagine: Sales, Calculator, Quotes tutte con Modifica/Scarica PDF/Stampa).
60. **Fix CSV Input Varianti + Title Tab Shop** (19/07/2026):
    - **Fix input varianti** (`AdminPanelPage` Gestione Vetrina): `parseCsv` faceva `filter(Boolean)` che rimuoveva stringhe vuote → digitando "Rosso," il valore diventava `["Rosso"]` → `formatCsv` produceva "Rosso" senza virgola → cursore ripristinava e impediva la digitazione. Fix: creato componente `CsvInput.js` con state locale raw (stringa), commit dell'array al parent solo su `onBlur`. Applicato a Colori/Materiali/Dimensioni.
    - **Fix title tab browser sul dominio shop**: aggiunto `document.title` dinamico basato su hostname in `PublicListinoPage` e `PublicProductDetailPage`: `shop.*` → "{brand} | Shop Stampa 3D", `listino.*` → "{brand} | Listino Prodotti", altro → "{brand} | Vetrina Prodotti". Nel PDP il title diventa "{nome prodotto} | {brand}" per SEO. Prima il tab mostrava sempre "Artes&Tramas | Calcolatore Stampa 3D" (dal `<title>` statico dell'index.html) anche sul dominio shop.
61. **Esporta Listino PDF** (19/07/2026): Nella Gestione Vetrina admin ora può:
    - Selezionare prodotti con **checkbox** in alto a sinistra di ogni card (card evidenziata con ring primary se selezionata)
    - Pulsante **"Seleziona tutti"** quando nessuna selezione + **"Deseleziona"** quando c'è selezione
    - **Badge "N selezionati"** nel titolo + Pulsante **"Esporta Listino PDF (N)"** contestuale
    - Dialog export con: titolo custom, **toggle "Mostra prezzi nel PDF"** (globale, sostituisce con "Su richiesta"), **toggle "Includi tutte le foto"** (foto principale + miniature aggiuntive), riepilogo categorie con badge conteggio, pulsante "Scarica PDF"
    - PDF ricco: header arancione con brand + data, prodotti raggruppati per categoria con divisore arancione, per ogni prodotto foto principale + strip miniature (se abilitato) + nome bold + descrizione + colori + dimensioni + contatore "N foto disponibili" + prezzo/su richiesta a destra, footer con nota
    - **Compressione automatica delle immagini** via `lib/imageCompress.js`: foto principali ridimensionate a max 512px JPEG q=0.8, miniature a max 128px q=0.7, sfondo bianco per PNG con trasparenza. Deduplicazione delle foto ripetute e fallback all'originale se il compresso è più grande. Risparmio misurato: **93.8%** su PNG 800x800 (857KB → 53KB). Un listino con 20 prodotti × 5 foto passa da ~85MB a ~5MB.
    - Client-side via `downloadHtmlAsPdf` (usa iframe con background bianco forzato — riuso dello stesso pattern del preventivo)
62. **Prezzo "a partire da"** (20/07/2026): Nuovo campo `price_from: bool` sul modello Product (backend + frontend). Nel form Admin nuovo toggle "Prezzo variabile ('a partire da')" mostrato solo se il prezzo è visibile, con anteprima dinamica del testo. Quando attivo:
    - **Card admin Gestione Vetrina**: sopra il prezzo compare "a partire da" in corsivo
    - **Vetrina pubblica** (`PublicListinoPage`): stessa presentazione
    - **Pagina dettaglio prodotto** (`PublicProductDetailPage`): "a partire da" prima del prezzo grande + nota "personalizzazione influisce sul prezzo finale"
    - **PDF listino**: micro-testo "a partire da" sopra il prezzo arancione
    - **Modal richiesta ordine**: prefisso mostrato anche nel riepilogo
    - Utile per prodotti personalizzabili (cake topper, lampade custom) dove il prezzo finale dipende da varianti e complessità.
63. **Fase 1 Separazione Shop** (01/08/2026): Iniziata separazione tra SaaS calcolatore (multi-tenant) e Shop e-commerce (single-owner Federico):
    - **Backend**: nuovo campo `is_shop_owner: bool` sul modello User + dependency `require_shop_owner` + esposizione in `get_current_user`/`login`/`register`/`admin/users`. Endpoint `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` protetti da `require_shop_owner` (invece di `get_current_user`/`require_admin`). Nuovo endpoint `POST /api/admin/toggle-shop-owner/{user_id}` per gestire il flag. Nuovo modello **ShopSettings** (collection `shop_settings`, `_id: "singleton"`) con hero/company/social/policies/featured_categories + 3 endpoint: `GET /api/public/shop-settings` (no auth), `GET /api/admin/shop-settings` (shop_owner), `PUT /api/admin/shop-settings` (shop_owner).
    - **Utenti**: creato `artestramas3d@gmail.com` come admin + shop_owner + email_verified. Aggiornato `/app/memory/test_credentials.md`.
    - **Frontend**: `AdminPanelPage` usa `useAuth().user.is_shop_owner` per mostrare/nascondere i tab **"Gestione Vetrina"** e nuovo tab **"Impostazioni Shop"**. Nuovo componente `ShopSettingsTab` con 5 card editabili (Hero, Info azienda, Social, Testi & policy, Categorie in evidenza) + pulsante Save sticky. `testuser` (admin ma non shop_owner) ora NON vede i tab shop ✓ verificato con screenshot.
    - **API frontend**: `getAdminShopSettings`, `updateShopSettings`, `getPublicShopSettings`, `toggleShopOwner` aggiunte a `lib/api.js`.
    - Prossime fasi: FASE 2 (HomeShopPage + ShopLayout con branding dedicato), FASE 3 (SEO/OpenGraph), FASE 4 (sicurezza `/admin` nascosto).
64. **Fase 2 Separazione Shop — HomeShopPage** (02/08/2026): Creata home dedicata `/pages/HomeShopPage.js` per il dominio shop:
    - **Header shop** con logo brand + "SHOP 3D", nav (Prodotti/Categorie/Chi siamo/Contatti), CTA "Contattaci" arancione. Nessun riferimento al calcolatore SaaS.
    - **Hero** editabile (titolo, sottotitolo, CTA label, immagine) letto da `shop_settings`. Placeholder gradient elegante se immagine mancante.
    - **Grid categorie** dinamica da `featured_categories` + conteggio prodotti per categoria. Link a `/listino?cat=X`.
    - **Prodotti in evidenza** — top 6 per views con card foto + prezzo (supporto "a partire da" + "Su richiesta").
    - **Come funziona** — 3 step (Scegli / Personalizza / Ricevi).
    - **About** editabile da settings.
    - **Footer completo** con 4 colonne (brand+social, contatti, info spedizione/reso, legale P.IVA/terms/privacy/cookie).
    - **Routing** (`App.js`): sul dominio shop `/` mostra HomeShop, `/listino` la lista completa, `/prodotto/:slug` PDP. Aggiunta flag `?__shop=1` per testing dal preview. Route `/admin` accessibile solo se il proprietario la conosce (non linkata da nessuna parte pubblica).
    - **Filtro categoria via query string** in PublicListinoPage: `useEffect` precompila il filtro da `?cat=X`.
    - Testato con settings custom (P.IVA, contatti, social) → tutti i campi appaiono correttamente nella home.
65. **Fase 3 Separazione Shop — SEO/Open Graph** (02/08/2026):
    - Installato **`react-helmet-async`** + wrapping `<HelmetProvider>` in `App.js`.
    - Nuovo componente riusabile `/components/SeoHead.js` con supporto: title, description, canonical, robots (noindex opz), Open Graph (type/title/description/image/url/site_name/locale it_IT), Twitter Card (summary_large_image quando c'è image), JSON-LD structured data.
    - **HomeShopPage**: `<SeoHead>` con titolo dinamico "{hero_title} · {brand}", description dal hero_subtitle/about_text, immagine dall'hero o dal primo prodotto in evidenza, **JSON-LD schema Store** (name, description, url, email, telephone, address, sameAs con tutti i social).
    - **PublicProductDetailPage**: `<SeoHead>` con titolo "{nome prodotto} · {brand}", description dalla descrizione prodotto, prima foto come og:image, **JSON-LD schema Product** completo (name, description, image array, brand, category, Offer con priceCurrency EUR + availability InStock + condition NewCondition). Richiesto per apparire nei Rich Snippet Google Shopping.
    - **PublicListinoPage**: `<SeoHead>` con titolo dinamico "{Categoria filtrata} · {brand}" o "Catalogo Prodotti · {brand}", description contextual, prima foto prodotto come og:image.
    - **Backend nuovo endpoint** `GET /api/public/sitemap.xml`: sitemap XML dinamica con host detection dai request headers. Include `/`, `/listino`, e tutti i `/shop/prodotto/{slug}` dei prodotti `is_public=true`.
    - **`/app/frontend/public/robots.txt`**: Allow su rotte pubbliche shop + Disallow su tutte le rotte SaaS (admin, login, calculator, filaments, sales, ecc.) + Sitemap URL.
    - **`index.html`** arricchito con fallback meta description + theme-color + og:type/site_name/locale (per il primo render prima che Helmet subentri).
    - Testato: title/OG/JSON-LD/canonical tutti presenti nel DOM ✓. Sitemap XML risponde con content-type XML e host corretto ✓.
66. **Fase 4 Separazione Shop — Hardening Security** (02/08/2026):
    - Nuova pagina `/pages/NotFoundShopPage.js`: **404 elegante brandizzato shop** con header Artes&Tramas, icona Package, pulsanti "Torna alla Home" + "Vedi tutti i prodotti", meta `noindex, nofollow` per non essere indicizzata.
    - **Nuovo componente `ShopAdminGate`** in `App.js`: sul dominio shop, `/admin` mostra 404 se l'utente non è loggato (invece di redirect al login pubblico che rivelerebbe l'esistenza della route). Se loggato → Admin Panel normale.
    - **Rotte SaaS bloccate sul dominio shop**: `/calculator`, `/filaments`, `/sales`, `/purchases`, `/settings`, `/dashboard`, ecc. → mostrano il 404 shop (route `path="*"` catch-all).
    - **Noindex globale su Layout SaaS**: aggiunto `<SeoHead noindex>` dentro `Layout.js` → tutte le pagine dietro autenticazione (dashboard, calculator, filaments, sales, settings, admin) hanno automaticamente `robots="noindex, nofollow"`. Google non le indicizzerà mai anche in caso di link accidentali.
    - `/login` accessibile sul dominio shop ma non linkato pubblicamente (solo per l'accesso privato del proprietario).
    - Testato con Playwright: `/calculator?__shop=1` → 404 shop ✓, `/admin?__shop=1` senza auth → 404 shop (no leak) ✓, meta robots corretto ✓.
67. **Editor Visuale In-Place per HomeShopPage** (02/08/2026):
    - Nuovo componente `/components/InlineEditor.jsx` con: `useShopEditor` hook, `EditableField` wrapper (ring arancione + pulsante "Modifica" al hover), `EditModal` (portale React con supporto text/textarea/image + upload compressione client-side + fallback URL), `EditorToolbar` (pill flottante bottom-right "Modifica sito"/"Editor ON").
    - **Visibile solo per `is_shop_owner`**. Editabili direttamente dalla home: titolo hero, sottotitolo, CTA label, immagine hero, immagini categorie (mappate su `settings.category_images`), testo "Chi siamo".
    - `HomeShopPage.js` usa `getAdminShopSettings()` se owner (per avere anche campi privati) e chiama `updateShopSettings` on save. Toast "Modifiche salvate" via sonner.
    - Test manuale Playwright: login → home → clic "Modifica sito" → hover H1 → clic "Modifica" → modal precompilato → salva → h1 aggiornato ✓, modal categoria "Cake Topper" apre correttamente ✓.
68. **Fix `/admin` shop → login + Cookie cross-subdomain** (02/08/2026):
    - `ShopAdminGate` ora renderizza `<LoginPage />` invece di 404 quando l'utente non è loggato su `/admin` (shop domain). Dopo il login il pannello admin appare sulla stessa route senza reindirizzamenti.
    - Aggiunte env vars **opzionali** in `backend/.env`: `COOKIE_DOMAIN` (es. `.artestramas3d.it` per condividere sessione tra `calcolatore.*` e `shop.*`) e `COOKIE_SECURE` (`true` in HTTPS). Helper `_cookie_kwargs()` centralizza la config, usato dai 4 `set_cookie` e 2 `delete_cookie`.
    - `AuthContext.js` ora usa path relativo `/api` invece di `${REACT_APP_BACKEND_URL}/api` per evitare preflight CORS quando la UI viene servita sul dominio shop e chiama il backend.
    - Testato: `/admin?__shop=1` senza cookie → mostra login ✓, dopo login → Pannello Admin ✓.
69. **Sottocategorie prodotti** (02/08/2026):
    - Backend: nuovo campo `subcategory: str` nel modello `Product` (Create/Update/serialize). Nuovo campo `subcategory_images: dict` in `ShopSettings` (immagini future).
    - Admin: form prodotto con nuovo input "Sottocategoria" + `<datalist>` con auto-suggest delle sotto già usate per la categoria selezionata (`currentSubcategories` calcolato dinamicamente). Badge sottocategoria nella card lista.
    - PublicListinoPage: seconda riga di chip filtro "Sotto-categoria" che appare solo quando una categoria è selezionata. Reset automatico del filtro sub quando cambia la categoria. Query string estesa `?cat=X&subcat=Y`.
    - PublicProductDetailPage: badge categoria + badge sottocategoria affiancati.
    - Test manuale Playwright: creazione 2 prodotti con stessa categoria e sub diverse ✓, filtro combinato mostra correttamente 1 risultato ✓, "Tutte" mostra tutti ✓.
70. **Modulo Cricut / Plotter da Taglio — Fase 1: Fondamenta** (06/08/2026):
    - Backend: 3 nuove collezioni Mongo (`cricut_materials`, `cricut_machines`, `cricut_consumables`) con CRUD completo scoped per `user_id`. Endpoint `/api/cricut/meta` restituisce categorie materiali (12: HTV, Vinile adesivo/removibile, Transfer Tape, Cartoncino, ecc.), unità di misura (m², cm², m lineari, fogli, pezzi), tipi consumabili (7).
    - Modello **Materiale**: nome, categoria, marca, colore + hex, fornitore, prezzo/qty/UdM, sfrido %, note, rimanenza, soglia stock basso. `unit_cost` calcolato server-side.
    - Modello **Macchina**: nome, marca/modello, prezzo, data acquisto, consumo watt, costo €/kWh, stato (attiva/disattiva). **Doppia formula ammortamento**: `simple` (prezzo/ore_vita) o `fiscal` (prezzo / anni × 12 × ore_mese). Costi orari (`hourly_amortization`, `hourly_energy_cost`) calcolati auto.
    - Modello **Consumabile**: nome, tipo (Lama/Tappetino/Penna/Punta/Rullo/Foglio protettivo/Personalizzato), prezzo, `life_uses`, `cost_per_use` auto.
    - Frontend: nuova pagina `/cricut` (`CricutPage.js`) con 3 tab, nuova voce sidebar "Cricut" con icona Scissors tra Vendite e Acquisti. Card grid con hover actions, dialog form completo, preview live dei calcoli, badge stock basso.
    - Testato Playwright: creazione materiale HTV Siser Rosso (€2.50/foglio) ✓, creazione Cricut Maker €400/3000h (€0.1333/h ammort + €0.0090/h energia) ✓, creazione Lama Fine Point €15/200 usi (€0.075/uso) ✓.

## Note Importanti
- SMTP REALE: smtps.aruba.it, preventivi e inquiry prodotti a info@artestramas3d.it
- Deploy VPS Aruba: calcolatore.artestramas3d.it
- Listino pubblico: listino.artestramas3d.it (punta alla stessa app, route /listino)
- Frontend Dockerfile: NODE_OPTIONS=--max-old-space-size=768
- Frontend nginx.conf: listen 80, try_files per SPA
- Nginx proxy: proxy_pass http://frontend:80
- requirements.txt semplificato (solo dipendenze necessarie)
- Badge "Made with Emergent" rimosso

## Task Futuri (Backlog)
- P1: Sistema abbonamenti Free/Pro con Stripe
- P2: Classifica profittabilità prodotti / Dashboard avanzata con grafici
- P2: Notifiche smart (scorte basse, vendite non pagate, riepilogo settimanale)
- P0 Tech Debt: Refactoring server.py (~2800 righe) in moduli /routes, /models, /services
- P2 Tech Debt: Split AdminPanelPage.js (~1511 righe) in componenti separati
