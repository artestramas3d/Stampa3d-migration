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

## Note Importanti
- SMTP REALE: smtps.aruba.it, preventivi a info@artestramas3d.it
- Deploy VPS Aruba: calcolatore.artestramas3d.it
- Listino pubblico: listino.artestramas3d.it (punta alla stessa app, route /listino)
- Frontend Dockerfile: NODE_OPTIONS=--max-old-space-size=768
- Frontend nginx.conf: listen 80, try_files per SPA
- Nginx proxy: proxy_pass http://frontend:80
- requirements.txt semplificato (solo dipendenze necessarie)
- Badge "Made with Emergent" rimosso

## Task Futuri (Backlog)
- P2: Classifica profittabilità prodotti / Dashboard avanzata
- P2: Notifiche smart (scorte basse, vendite non pagate, riepilogo settimanale)
- P2: Catalogo pubblico migliorato (foto, filtri, richiesta preventivo)
- P2: Sistema abbonamenti Free/Pro con Stripe
- P3: Refactoring server.py in moduli (routes, models, services)
