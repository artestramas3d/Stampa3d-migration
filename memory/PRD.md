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

## Note Importanti
- SMTP REALE: smtps.aruba.it, preventivi a info@artestramas3d.it
- Deploy VPS Aruba: calcolatore.artestramas3d.it
- Listino pubblico: listino.artestramas3d.it (punta alla stessa app, route /listino)
- Frontend Dockerfile: NODE_OPTIONS=--max-old-space-size=512
- requirements.txt NON deve contenere emergentintegrations
- Badge "Made with Emergent" rimosso

## Task Futuri (Backlog)
- P1: Export CSV/Excel completo per tutte le sezioni
- P2: Esportazione fatture PDF
- P2: Classifica profittabilità prodotti
- P3: Refactoring server.py in moduli (routes, models, services)
