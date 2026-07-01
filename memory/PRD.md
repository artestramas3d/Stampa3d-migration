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
