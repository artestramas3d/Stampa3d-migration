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
11. Banner pubblicitari (4 posizioni: header, sidebar, footer, sotto contenuto) - Solo admin
12. Pannello Admin: Lista utenti, verifica manuale, toggle admin, eliminazione utenti + dati, newsletter, email logs
13. Recupero Password: Pagina forgot + reset con token via SMTP reale
14. Conferma Email: Registrazione crea utente non verificato, link verifica via SMTP reale
15. Multi-lingua: IT, EN, ES, FR
16. Profilo Utente: cambia nome, lingua, password
17. SMTP Reale: Email inviate tramite Aruba (smtps.aruba.it)
18. Deploy Docker: docker-compose.yml, Dockerfiles, Nginx SSL, guida DEPLOY_ARUBA.md
19. **Impostazioni Sito** (06/04/2026): Admin può cambiare nome brand, sottotitolo, colore primario e accento. Colori applicati dinamicamente via CSS variables.
20. **Newsletter con Programmazione** (06/04/2026): Admin crea newsletter da inviare subito o programmare per data/ora futura. Scheduler background controlla ogni 60 secondi.
21. **Segnalazione Problemi** (06/04/2026): Utenti inviano bug report con titolo, descrizione, priorità e screenshot opzionale. Admin gestisce con stato (aperto/in lavorazione/risolto) e note.

## Note Importanti
- SMTP REALE configurato con Aruba (smtps.aruba.it)
- Deploy su VPS Aruba: calcolatore.artestramas3d.it
- Frontend Dockerfile usa NODE_OPTIONS=--max-old-space-size=512 per VPS 1GB RAM
- requirements.txt NON deve contenere emergentintegrations

## Task Futuri (Backlog)
- P1: Sito web collegato (template condiviso per landing page/portfolio)
- P1: Export dati CSV/Excel completa per tutte le sezioni
- P2: Importazione Bambu Studio / Orca Slicer
- P2: Esportazione fatture
- P2: Classifica profittabilità prodotti
- P3: Refactoring server.py in moduli (routes, models, services)
