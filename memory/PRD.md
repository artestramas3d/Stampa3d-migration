# FilamentProfit - PRD (Product Requirements Document)

## Problema Originale
Creare un'applicazione web che replica ed espande le funzionalità di un calcolatore di costi per stampa 3D basato su foglio di calcolo. L'app è progettata per maker che tracciano costi di stampa, materiali, vendite e profittabilità.

## Moduli
- Dashboard con statistiche
- Gestione Filamenti (con avvisi scorte basse)
- Impostazioni Stampante (Costi Fissi)
- Gestione Accessori
- Calcolatore Costi Stampa (multicolore, quantità, prezzo manuale, ore/minuti)
- Registro Vendite (con stato pagato/non pagato)
- Tracciamento Acquisti (con creazione automatica filamenti)
- Esportazione CSV

## Stack Tecnologico
- Frontend: React + TailwindCSS + shadcn/ui
- Backend: FastAPI (Python)
- Database: MongoDB
- Auth: JWT con cookies httpOnly

## Funzionalità Completate
1. ✅ Autenticazione JWT (Login/Register)
2. ✅ Dashboard con statistiche, grafici mensili, top prodotti, avvisi scorte
3. ✅ CRUD Filamenti con avvisi scorte basse (< 200g)
4. ✅ CRUD Stampanti con calcolo ammortamento/elettricità
5. ✅ CRUD Accessori (gancetti, magneti, packaging)
6. ✅ Tracciamento Acquisti con creazione/aggiornamento automatico filamenti
7. ✅ Calcolatore Costi avanzato:
   - Supporto multicolore
   - Quantità multiple
   - Prezzo manuale di vendita
   - Copia da stampe recenti
   - Input ore e minuti separati (es. 3h 20m) - Completato 02/04/2026
8. ✅ Registro Vendite con toggle Pagato/Non Pagato e filtri
9. ✅ Esportazione CSV (vendite e acquisti)
10. ✅ Tema chiaro/scuro

## Task Futuri (Backlog)
- P1: Esportazione dati completa CSV/Excel (più moduli)
- P2: Importazione dati da Bambu Studio / Orca Slicer
- P2: Esportazione fatture
- P2: Classifica profittabilità prodotti

## Refactoring Necessario
- server.py (~900 righe): valutare suddivisione in moduli separati

## Architettura File
```
/app/backend/server.py - API endpoints FastAPI
/app/frontend/src/pages/ - Pagine React (Dashboard, Filaments, Calculator, Sales, Purchases, Settings, Accessories)
/app/frontend/src/lib/api.js - Client API
/app/frontend/src/context/ - AuthContext, ThemeContext
```
