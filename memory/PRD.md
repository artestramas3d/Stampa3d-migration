# FilamentProfit - PRD

## Problema Originale
App web calcolatore costi stampa 3D per maker. Traccia costi, materiali, vendite e profittabilità.

## Stack: React + FastAPI + MongoDB + JWT Auth

## Funzionalità Completate
1. ✅ Autenticazione JWT con cookies httpOnly
2. ✅ Dashboard con statistiche, grafici, avvisi scorte
3. ✅ CRUD Filamenti con avvisi scorte basse (< 200g)
4. ✅ CRUD Stampanti con ammortamento/elettricità
5. ✅ CRUD Accessori
6. ✅ Acquisti con creazione automatica filamenti
7. ✅ Calcolatore Costi (multicolore, quantità, prezzo manuale, ore/minuti stampa+design)
8. ✅ Registro Vendite con toggle Pagato/Non Pagato
9. ✅ Esportazione CSV
10. ✅ Tema chiaro/scuro
11. ✅ Banner pubblicitari (4 posizioni: header, sidebar, footer, sotto contenuto) - Solo admin
12. ✅ **Pannello Admin** (03/04/2026):
    - Lista utenti registrati con stato, ruolo, data
    - Verifica manuale email utenti
    - Toggle admin utenti
    - Eliminazione utenti + dati
    - Newsletter (simulata - pronta per servizio email reale)
    - Log email (verifica + recovery) con link copiabili
13. ✅ **Recupero Password** (03/04/2026): Pagina forgot + reset con token
14. ✅ **Conferma Email** (03/04/2026): Registrazione crea utente non verificato, link verifica

## Note Importanti
- Email SIMULATE: loggate nel backend + salvate in email_logs. Admin vede i link nel pannello.
- Quando l'utente avrà un dominio, basta collegare un servizio email reale (Resend/SendGrid).

## Task Futuri (Backlog)
- P1: Esportazione dati CSV/Excel completa
- P2: Importazione Bambu Studio / Orca Slicer
- P2: Esportazione fatture
- P2: Classifica profittabilità prodotti
- P2: Collegare servizio email reale quando disponibile dominio
