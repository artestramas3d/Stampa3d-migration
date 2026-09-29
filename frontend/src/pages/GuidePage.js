import { useState, useRef } from 'react';
import { Book, Printer, Globe, Download } from 'lucide-react';
import { AffiliateLinks } from '../components/AffiliateLinks';
import { downloadHtmlAsPdf } from '../lib/pdfExport';
import { toast } from 'sonner';

const GUIDES = {
  it: {
    title: "Guida Utente",
    subtitle: "Calcolatore Costi Stampa 3D + Cricut",
    print: "Stampa",
    download: "Scarica PDF",
    version: "v2026.09 — Aggiornata",
    sections: [
      {
        title: "Benvenuto",
        content: `Benvenuto nel Calcolatore Costi Artes&Tramas 3D! Un'app completa per makers e professionisti che tracciano costi di stampa 3D, plotter da taglio (Cricut), materiali, vendite e clienti.

QUESTA GUIDA COPRE:
• Calcolatore Stampa 3D (con Attrezzature/AMS e integrazione Cricut)
• Modulo Cricut / Plotter da Taglio
• Clienti, Vendite, Preventivi e Acquisti
• Blog / Notizie`
      },
      {
        title: "1. Registrazione e Accesso",
        content: `Per iniziare, registrati con email e password. Riceverai un'email di verifica: clicca il link per attivare l'account.

Se dimentichi la password, usa "Password dimenticata" dalla pagina di login. Riceverai un link temporaneo per reimpostarla.

RETENTION ACCOUNT
Per igiene del database:
• Account NON verificati inattivi da oltre 90 giorni vengono eliminati
• Account VERIFICATI senza login da oltre 12 mesi vengono disattivati (riattivabili facendo login)
• Account disattivati da oltre 12 mesi vengono eliminati definitivamente
Basta effettuare il login per riattivare un account disattivato.`
      },
      {
        title: "2. Dashboard",
        content: `Panoramica generale con:
• Fatturato totale, profitto netto e trend mensili
• Grafici delle vendite
• Avvisi scorte basse (filamenti sotto 200g)
• Prodotti più venduti e vendite recenti
• Riepilogo spedizioni del mese

La Dashboard si aggiorna in tempo reale con i tuoi dati.`
      },
      {
        title: "3. Gestione Filamenti",
        content: `Registra ogni bobina con:
• Materiale (PLA, PETG, ABS, TPU, ecc.)
• Colore con anteprima (supporto BICOLORE con split diagonale)
• Brand, peso e prezzo di acquisto
• Grammi rimanenti

Il sistema calcola automaticamente il costo per grammo e avvisa quando le scorte scendono sotto i 200g.

Puoi esportare l'inventario in CSV per il tuo commercialista.`
      },
      {
        title: "4. Gestione Accessori",
        content: `Registra accessori che usi nelle stampe (gancetti, magneti, packaging, ecc.) con nome, costo unitario e quantità in stock.

Le CATEGORIE ACCESSORI sono personalizzabili: puoi aggiungerne di nuove dalle voci di menu (Accessori → Nuova categoria).

Gli accessori si aggiungono automaticamente al calcolo quando li selezioni nel Calcolatore.`
      },
      {
        title: "5. Impostazioni: Stampanti e Attrezzature",
        content: `Nella pagina "Impostazioni" gestisci:

STAMPANTI 3D
• Nome/modello, costo di acquisto, vita stimata in ore
• Potenza (W) e costo elettricità (€/kWh)
• Manutenzione (€/ora di stampa): copre ugelli, cinghie, lubrificanti, ecc.
Il sistema calcola automaticamente ammortamento €/h ed elettricità €/h.

⭐ ATTREZZATURE & ACCESSORI (NOVITÀ)
Sezione dedicata alle attrezzature amortizzate a tempo:
• Bambu Lab AMS / AMS 2 Pro (multicolore)
• Piatti texturati, PEI, ecc.
• Sistemi di essiccazione filamento
Inserisci: Nome, Marca, Prezzo, Vita utile (ore). Il sistema calcola l'ammortamento €/ora.

Nel Calcolatore 3D potrai poi SELEZIONARE PIÙ ATTREZZATURE contemporaneamente per ciascuna stampa, indicando le ore di utilizzo di ognuna.`
      },
      {
        title: "6. Calcolatore Costi Stampa 3D",
        content: `Il Calcolatore è il cuore dell'app. Passi:

PASSO 1 — Stampante
Scegli la stampante. Include automaticamente ammortamento + elettricità + manutenzione oraria.

PASSO 2 — Filamenti
Seleziona i filamenti e grammi. Puoi aggiungerne più di uno (multicolore).

PASSO 3 — Tempo di stampa
Ore e minuti separati. Puoi importarli da file .3mf con "Importa .3mf".

PASSO 4 — Tempo di design
Se hai modellato tu il pezzo, aggiungi ore di design (default 20€/h).

PASSO 5 — Accessori e quantità
Aggiungi accessori e imposta quantità (se > 1, ogni pezzo diventa una riga vendita indipendente).

⭐ PASSO 6 — Attrezzature (AMS, piatti, ecc.)
Se hai configurato attrezzature nelle Impostazioni, appariranno qui. Spunta quelle usate e indica le ore. Il costo di ammortamento viene sommato al totale.

⭐ PASSO 7 — Lavorazioni Cricut (SE HAI USATO IL PLOTTER)
Se hai creato preventivi Cricut con "Aggiungi al Calcolatore 3D", li vedrai qui. Selezionali per includerne il costo. IMPORTANTE: puoi scegliere se applicare il margine anche al costo Cricut:
• Checkbox ATTIVA (default): il costo Cricut concorre al margine come tutti gli altri costi → guadagni anche sulle lavorazioni Cricut
• Checkbox DISATTIVA: il costo Cricut viene sommato al prezzo di vendita come pass-through (il cliente paga esattamente il valore del preventivo Cricut, senza markup addizionale)

PASSO 8 — Prezzo
Imposta un margine % oppure un prezzo manuale. Puoi anche impostare IVA (22%), yield rate (% stampe riuscite) e manutenzione oraria personalizzata.

PASSO 9 — Cliente (opzionale)
Associa la vendita a un cliente della tua rubrica.

IMPORTA .3MF
Bambu Studio (2.05+), OrcaSlicer, Creality Print, PrusaSlicer, Cura sono supportati. Il file deve essere SLICATO (esporta il piatto slicato, non il progetto).

Il sistema calcola: materiale + elettricità + ammortamento stampante + manutenzione + accessori + attrezzature + design + eventuali costi Cricut = costo totale. Poi applica il margine.`
      },
      {
        title: "7. Modulo Cricut / Plotter da Taglio ⭐",
        content: `Se possiedi una Cricut, Silhouette, Brother o altro plotter da taglio, il modulo Cricut è pensato per te. Trovi tre sezioni in "Calcolatore costi Plotter da taglio":

MATERIALI
Registra ogni materiale con:
• Categoria (HTV, Vinile adesivo/removibile, Transfer Tape, Cartoncino, ecc.)
• Marca, colore + hex, fornitore
• Prezzo, quantità di acquisto, unità di misura (m², cm², metri lineari, fogli, pezzi)
• % sfrido (scarto tipico)
• Rimanenza + soglia stock basso
Il sistema calcola auto il costo unitario.

MACCHINE
Registra il tuo plotter con:
• Nome, marca/modello, prezzo, data acquisto
• Consumo (W) e costo elettricità (€/kWh)
• Ammortamento: formula "simple" (prezzo/ore vita) o "fiscal" (prezzo/anni/12/ore mese)
Il sistema calcola €/h di ammortamento e di energia.

CONSUMABILI
Lame, tappetini, penne, punte, rulli, fogli protettivi. Per ciascuno: prezzo + numero di utilizzi previsti → costo per uso auto.

CALCOLATORE PREVENTIVO CRICUT
Nel calcolatore progetto trovi 7 sezioni:
1. Info (nome, cliente, categoria, data, note)
2. Materiale principale + materiali extra
3. Tempi di lavorazione: preparazione, taglio, spellicolatura, transfer tape, pressatura, assemblaggio (⭐ TUTTI IN MINUTI, non ore)
4. Macchina + minuti di utilizzo (⭐ NOVITÀ: da ore a minuti, più realistico per lavori corti)
5. Consumabili (multi-select con numero utilizzi per progetto)
6. Confezione: sacchetto, scatola, cartoncino, etichetta, biglietto, nastro
7. Costi indiretti (marketplace %, commissioni pagamento %, spese generali fisse, IVA %)

PREZZO
Imposta margine % oppure prezzo manuale. Il riepilogo sticky sulla destra mostra live: produzione, costi indiretti, prezzo, profitto netto e margine effettivo.

INTEGRAZIONE CON IL 3D
Attivando "Aggiungi al Calcolatore Stampa 3D" sul preventivo Cricut, questo apparirà nella sezione "Lavorazioni Cricut" del Calcolatore 3D. Utile per prodotti misti (es. maglietta con HTV + gadget stampato in 3D).

DUPLICA / SALVA COME VENDITA
Ogni preventivo Cricut può essere duplicato (utile per varianti) o salvato direttamente come vendita nel Registro Vendite.`
      },
      {
        title: "8. Clienti (Rubrica CRM)",
        content: `Rubrica clienti con:
• Nome, cognome, telefono, email, indirizzo, note
• Ricerca rapida e ordinamento
• Storico acquisti per cliente (icona borsa)
• Esportazione CSV

I clienti si associano alle vendite dal Calcolatore (menu "Cliente"). Nei preventivi PDF vengono precompilati automaticamente.`
      },
      {
        title: "9. Registro Vendite",
        content: `Ogni vendita salvata dal Calcolatore mostra:
• Nome prodotto, costo, prezzo di vendita, profitto, cliente
• Stato pagamento (Pagato / Non pagato) toggle rapido
• Spedizione (costo separato)
• Modulo di origine (3D / Cricut / Manuale)

FILTRI E ORDINAMENTO
Per mese, stato pagamento, ordinabile per data/prezzo/profitto/nome.

QUANTITÀ MULTIPLE
Se hai stampato 4 portachiavi, ogni pezzo diventa una riga singola con indicatore batch (1/4, 2/4...). Puoi:
• Segnare pagato/non pagato ogni pezzo
• Modificare prezzo del singolo pezzo
• Vederli aggregati o singoli

RISTAMPA
Icona stampante → torna al Calcolatore con tutti i dati precompilati.

MODIFICA
Icona matita → modifica nome, prezzo, cliente, spedizione (ricalcolo profitto automatico).

PREVENTIVO DA VENDITA
Icona documento blu → genera un preventivo PDF a partire da una vendita esistente. Se hai già generato preventivi per quella vendita, l'icona diventa verde con pallino (evita duplicati inconsapevoli).

EXPORT CSV
Esporta tutto in CSV per commercialista.`
      },
      {
        title: "10. Acquisti",
        content: `Registra ogni acquisto materiale (tipo, brand, colore, quantità bobine, prezzo, grammi).

Il sistema:
• Aggiorna automaticamente un filamento esistente
• O crea un nuovo filamento se non esiste
Puoi ordinare per data, prezzo, grammi, materiale o brand ed esportare in CSV.`
      },
      {
        title: "11. Preventivi PDF Professionali",
        content: `Tre modi per generare preventivi:

A) DAL CALCOLATORE (rapido)
Dopo il calcolo, clicca "Genera Preventivo PDF". Il preventivo mostra solo prodotto e prezzo (nessun costo interno).

B) DALLE VENDITE (retroattivo)
Icona documento blu su ogni vendita → dialog precompilato → PDF.

C) DALLA PAGINA PREVENTIVI (multi-prodotto)
Nel menu "Preventivi" puoi creare preventivi complessi con più prodotti, cliente della rubrica o manuale, note, validità.

DATI AZIENDALI
Tab "Dati Aziendali": nome azienda, indirizzo, CAP, città, P.IVA, telefono, email, logo (max 500KB). Appariranno nell'intestazione di TUTTI i preventivi.

DOWNLOAD & STAMPA
Ogni preventivo ha:
• Scarica PDF → download vero file .pdf (sfondo bianco garantito anche in dark mode)
• Stampa → dialog di stampa browser

STORICO
Tab "Storico" nella pagina Preventivi. Ogni preventivo mostra: numero PRV-YYYYMMDD-HHMMSS, cliente, prodotti, valore, data invio (se inviato via email).`
      },
      {
        title: "12. Notizie / Blog",
        content: `Modulo Blog pubblico dove leggere articoli, guide e novità di Artes&Tramas 3D. Ogni articolo ha:
• Titolo, categoria (Guide / Novità / Case study / ecc.)
• Contenuto formattato (grassetto, liste, link, immagini)
• Copertina, data pubblicazione

ROUTE PUBBLICHE
• /notizie — lista articoli pubblici con filtro categoria
• /notizie/:slug — dettaglio articolo (leggibile anche in dark mode)`
      },
      {
        title: "13. Profilo, Tema, Lingua",
        content: `Nel Profilo puoi:
• Cambiare nome, lingua UI (IT/EN/ES/FR)
• Cambiare password
• Vedere statistiche personali

TEMA CHIARO/SCURO
Icona sole/luna nella sidebar. Il tema si applica anche a modali, form ed export.

SELETTORE LINGUA PRE-LOGIN
Le pagine di login/registrazione/password dimenticata hanno un selettore lingua (IT/EN/ES/FR). La scelta è salvata in localStorage.`
      },
      {
        title: "14. Segnala un Problema",
        content: `Se trovi un bug: "Segnala Problema" nella sidebar. Inserisci titolo, descrizione, priorità (bassa/media/alta), allega screenshot (max 5MB). Riceverai aggiornamenti sullo stato di risoluzione.`
      },
      {
        title: "15. Cookie e Privacy (GDPR)",
        content: `Al primo accesso vedrai un banner GDPR-compliant per gestire i cookie:
• Tecnici (sempre attivi)
• Analitici (opzionali)
• Marketing (opzionali)

Modifica le preferenze in ogni momento dal footer del sito (Cookie Policy).`
      },
      {
        title: "Consigli per Iniziare",
        content: `1. Aggiungi la tua stampante 3D nelle Impostazioni
2. Aggiungi le attrezzature amortizzate (AMS, ecc.) se le hai
3. Registra i filamenti in magazzino
4. Aggiungi accessori frequenti
5. Se hai una Cricut: registra materiali, macchine e consumabili nel modulo Cricut
6. Usa il Calcolatore per la tua prima stampa
7. Salva la vendita, associa il cliente e inizia a tracciare i profitti

Buona stampa! 🖨️✂️`
      }
    ]
  },
  en: {
    title: "User Guide",
    subtitle: "3D Printing Cost Calculator + Cricut",
    print: "Print",
    download: "Download PDF",
    version: "v2026.09 — Updated",
    sections: [
      {
        title: "Welcome",
        content: `Welcome to the Artes&Tramas 3D Cost Calculator! A complete app for makers and professionals tracking 3D printing costs, cutting plotters (Cricut), materials, sales, and clients.

THIS GUIDE COVERS:
• 3D Printing Calculator (with Equipment/AMS and Cricut integration)
• Cricut / Cutting Plotter Module
• Clients, Sales, Quotes, and Purchases
• Blog / News`
      },
      {
        title: "1. Registration and Login",
        content: `To get started, register with your email and a password. You will receive a verification email: click the link to activate your account.

If you forget your password, use "Forgot Password" from the login page. You'll receive a temporary link to reset it.

ACCOUNT RETENTION
For database hygiene:
• UNVERIFIED accounts inactive for over 90 days are deleted
• VERIFIED accounts with no login for over 12 months are deactivated (reactivatable by logging in)
• Deactivated accounts for over 12 months are permanently deleted
Just log in to reactivate a deactivated account.`
      },
      {
        title: "2. Dashboard",
        content: `Overview with:
• Total revenue, net profit, and monthly trends
• Sales charts
• Low stock alerts (filaments under 200g)
• Best-selling products and recent sales
• Monthly shipping summary

The Dashboard updates in real-time with your data.`
      },
      {
        title: "3. Filament Management",
        content: `Register every spool with:
• Material (PLA, PETG, ABS, TPU, etc.)
• Color with preview (BICOLOR support with diagonal split)
• Brand, weight, and purchase price
• Remaining grams

The system automatically calculates cost per gram and alerts when stock drops below 200g.

You can export inventory to CSV for your accountant.`
      },
      {
        title: "4. Accessories Management",
        content: `Register accessories used in prints (hooks, magnets, packaging, etc.) with name, unit cost, and stock quantity.

ACCESSORY CATEGORIES are customizable: add new ones from the Accessories menu.

Accessories are automatically added to the calculation when selected in the Calculator.`
      },
      {
        title: "5. Settings: Printers and Equipment",
        content: `On the "Settings" page you manage:

3D PRINTERS
• Name/model, purchase cost, estimated life in hours
• Power (W) and electricity cost (€/kWh)
• Maintenance (€/print hour): covers nozzles, belts, lubricants, etc.
The system automatically calculates depreciation €/h and electricity €/h.

⭐ EQUIPMENT & ACCESSORIES (NEW)
Section dedicated to time-amortized equipment:
• Bambu Lab AMS / AMS 2 Pro (multicolor)
• Textured plates, PEI, etc.
• Filament drying systems
Enter: Name, Brand, Price, Useful Life (hours). The system calculates amortization €/hour.

In the 3D Calculator you can then SELECT MULTIPLE EQUIPMENT items simultaneously for each print, specifying usage hours for each.`
      },
      {
        title: "6. 3D Printing Cost Calculator",
        content: `The Calculator is the heart of the app. Steps:

STEP 1 — Printer
Choose the printer. Automatically includes depreciation + electricity + hourly maintenance.

STEP 2 — Filaments
Select filaments and grams. You can add more than one (multicolor).

STEP 3 — Print time
Hours and minutes separately. You can import them from .3mf file with "Import .3mf".

STEP 4 — Design time
If you modeled the piece yourself, add design hours (default €20/h).

STEP 5 — Accessories and quantity
Add accessories and set quantity (if > 1, each piece becomes an independent sale row).

⭐ STEP 6 — Equipment (AMS, plates, etc.)
If you configured equipment in Settings, it will appear here. Check the ones used and specify hours. The amortization cost is added to the total.

⭐ STEP 7 — Cricut Jobs (IF YOU USED THE PLOTTER)
If you created Cricut quotes with "Add to 3D Calculator", you'll see them here. Select to include their cost. IMPORTANT: you can choose whether to apply the margin to the Cricut cost too:
• Checkbox ACTIVE (default): Cricut cost contributes to margin like any other cost → you also earn on Cricut jobs
• Checkbox INACTIVE: Cricut cost is added to sale price as pass-through (client pays exactly the Cricut quote value, no additional markup)

STEP 8 — Price
Set a margin % or a manual price. You can also set VAT (22%), yield rate (% successful prints), and custom hourly maintenance.

STEP 9 — Client (optional)
Associate the sale with a client from your address book.

.3MF IMPORT
Bambu Studio (2.05+), OrcaSlicer, Creality Print, PrusaSlicer, Cura are supported. The file must be SLICED (export the sliced plate, not the project).

The system calculates: material + electricity + printer depreciation + maintenance + accessories + equipment + design + any Cricut costs = total cost. Then applies the margin.`
      },
      {
        title: "7. Cricut / Cutting Plotter Module ⭐",
        content: `If you own a Cricut, Silhouette, Brother, or other cutting plotter, the Cricut module is for you. Three sections in "Plotter Cost Calculator":

MATERIALS
Register each material with:
• Category (HTV, Adhesive/Removable Vinyl, Transfer Tape, Cardstock, etc.)
• Brand, color + hex, supplier
• Price, purchase quantity, unit (m², cm², linear meters, sheets, pieces)
• Waste % (typical scrap)
• Remaining + low stock threshold
The system auto-calculates unit cost.

MACHINES
Register your plotter with:
• Name, brand/model, price, purchase date
• Consumption (W) and electricity cost (€/kWh)
• Depreciation: "simple" formula (price/life hours) or "fiscal" (price/years/12/monthly hours)
The system calculates €/h depreciation and energy.

CONSUMABLES
Blades, mats, pens, nibs, rollers, protective sheets. For each: price + number of expected uses → cost per use auto.

CRICUT QUOTE CALCULATOR
In the project calculator you find 7 sections:
1. Info (name, client, category, date, notes)
2. Main material + extra materials
3. Processing times: preparation, cutting, peeling, transfer tape, pressing, assembly (⭐ ALL IN MINUTES, not hours)
4. Machine + minutes of use (⭐ NEW: from hours to minutes, more realistic for short jobs)
5. Consumables (multi-select with number of uses per project)
6. Packaging: bag, box, cardstock, label, card, ribbon
7. Indirect costs (marketplace %, payment fees %, fixed overhead, VAT %)

PRICE
Set margin % or manual price. The sticky summary on the right shows live: production, indirect costs, price, net profit, and effective margin.

3D INTEGRATION
By activating "Add to 3D Print Calculator" on the Cricut quote, it will appear in the "Cricut Jobs" section of the 3D Calculator. Useful for mixed products (e.g. HTV t-shirt + 3D-printed gadget).

DUPLICATE / SAVE AS SALE
Each Cricut quote can be duplicated (useful for variants) or saved directly as a sale in the Sales Registry.`
      },
      {
        title: "8. Clients (CRM Address Book)",
        content: `Client address book with:
• First name, last name, phone, email, address, notes
• Quick search and sorting
• Purchase history per client (bag icon)
• CSV export

Clients are linked to sales from the Calculator ("Client" menu). In PDF quotes they are auto-filled.`
      },
      {
        title: "9. Sales Registry",
        content: `Every sale saved from the Calculator shows:
• Product name, cost, sale price, profit, client
• Payment status (Paid / Unpaid) quick toggle
• Shipping (separate cost)
• Origin module (3D / Cricut / Manual)

FILTERS AND SORTING
By month, payment status, sortable by date/price/profit/name.

MULTIPLE QUANTITIES
If you printed 4 keychains, each piece becomes a single row with batch indicator (1/4, 2/4...). You can:
• Mark paid/unpaid each piece
• Edit price of the single piece
• See them aggregated or singularly

REPRINT
Printer icon → returns to Calculator with all data pre-filled.

EDIT
Pencil icon → edit name, price, client, shipping (automatic profit recalculation).

QUOTE FROM SALE
Blue document icon → generate a PDF quote from an existing sale. If quotes were already generated for that sale, the icon turns green with dot (avoids unintended duplicates).

CSV EXPORT
Export everything to CSV for your accountant.`
      },
      {
        title: "10. Purchases",
        content: `Register every material purchase (type, brand, color, spool quantity, price, grams).

The system:
• Automatically updates an existing filament
• Or creates a new one if it doesn't exist
You can sort purchases by date, price, grams, material, or brand and export to CSV.`
      },
      {
        title: "11. Professional PDF Quotes",
        content: `Three ways to generate quotes:

A) FROM THE CALCULATOR (fast)
After calculation, click "Generate PDF Quote". The quote shows only product and price (no internal costs).

B) FROM SALES (retroactive)
Blue document icon on each sale → pre-filled dialog → PDF.

C) FROM THE QUOTES PAGE (multi-product)
In the "Quotes" menu you can create complex quotes with multiple products, client from address book or manual, notes, validity.

COMPANY DATA
"Company Data" tab: company name, address, ZIP, city, VAT, phone, email, logo (max 500KB). They appear in the header of ALL quotes.

DOWNLOAD & PRINT
Each quote has:
• Download PDF → real .pdf file download (white background guaranteed even in dark mode)
• Print → browser print dialog

HISTORY
"History" tab in Quotes page. Each quote shows: number PRV-YYYYMMDD-HHMMSS, client, products, value, send date (if sent via email).`
      },
      {
        title: "12. News / Blog",
        content: `Public Blog module to read articles, guides, and news from Artes&Tramas 3D. Each article has:
• Title, category (Guides / News / Case study / etc.)
• Formatted content (bold, lists, links, images)
• Cover, publication date

PUBLIC ROUTES
• /notizie — public articles list with category filter
• /notizie/:slug — article detail (readable also in dark mode)`
      },
      {
        title: "13. Profile, Theme, Language",
        content: `In Profile you can:
• Change name, UI language (IT/EN/ES/FR)
• Change password
• See personal statistics

LIGHT/DARK THEME
Sun/moon icon in the sidebar. The theme also applies to modals, forms, and exports.

PRE-LOGIN LANGUAGE SELECTOR
Login/register/forgot password pages have a language selector (IT/EN/ES/FR). The choice is saved in localStorage.`
      },
      {
        title: "14. Report a Problem",
        content: `If you find a bug: "Report Problem" in the sidebar. Enter title, description, priority (low/medium/high), attach a screenshot (max 5MB). You will receive updates on the resolution status.`
      },
      {
        title: "15. Cookies and Privacy (GDPR)",
        content: `On first access, you will see a GDPR-compliant banner to manage cookies:
• Technical (always active)
• Analytics (optional)
• Marketing (optional)

Modify preferences at any time from the site footer (Cookie Policy).`
      },
      {
        title: "Getting Started Tips",
        content: `1. Add your 3D printer in Settings
2. Add amortized equipment (AMS, etc.) if you have any
3. Register filaments in stock
4. Add frequent accessories
5. If you have a Cricut: register materials, machines, and consumables in the Cricut module
6. Use the Calculator for your first print
7. Save the sale, link the client, and start tracking profits

Happy printing! 🖨️✂️`
      }
    ]
  },
  de: {
    title: "Benutzerhandbuch",
    subtitle: "3D-Druck Kostenkalkulator + Cricut",
    print: "Drucken",
    download: "PDF herunterladen",
    version: "v2026.09 — Aktualisiert",
    sections: [
      {
        title: "Willkommen",
        content: `Willkommen beim Artes&Tramas 3D Kostenkalkulator! Eine vollständige App für Maker und Profis, die 3D-Druckkosten, Schneideplotter (Cricut), Materialien, Verkäufe und Kunden verfolgen.

DIESES HANDBUCH DECKT AB:
• 3D-Druck-Rechner (mit Zubehör/AMS und Cricut-Integration)
• Cricut / Schneideplotter-Modul
• Kunden, Verkäufe, Angebote und Einkäufe
• Blog / News`
      },
      {
        title: "1. Registrierung und Anmeldung",
        content: `Um zu beginnen, registriere dich mit deiner E-Mail und einem Passwort. Du erhältst eine Bestätigungs-E-Mail: Klicke auf den Link, um dein Konto zu aktivieren.

Wenn du dein Passwort vergisst, verwende "Passwort vergessen" auf der Anmeldeseite. Du erhältst einen temporären Link zum Zurücksetzen.

KONTO-AUFBEWAHRUNG
Für Datenbankhygiene:
• NICHT verifizierte Konten, die über 90 Tage inaktiv sind, werden gelöscht
• VERIFIZIERTE Konten ohne Login über 12 Monate werden deaktiviert (durch Anmelden reaktivierbar)
• Über 12 Monate deaktivierte Konten werden dauerhaft gelöscht
Melde dich einfach an, um ein deaktiviertes Konto zu reaktivieren.`
      },
      {
        title: "2. Dashboard",
        content: `Übersicht mit:
• Gesamtumsatz, Nettogewinn und Monatstrends
• Verkaufsdiagramme
• Warnungen bei niedrigem Bestand (Filamente unter 200g)
• Meistverkaufte Produkte und aktuelle Verkäufe
• Monatliche Versandübersicht

Das Dashboard aktualisiert sich in Echtzeit mit deinen Daten.`
      },
      {
        title: "3. Filamentverwaltung",
        content: `Registriere jede Spule mit:
• Material (PLA, PETG, ABS, TPU usw.)
• Farbe mit Vorschau (BICOLOR-Unterstützung mit diagonalem Split)
• Marke, Gewicht und Kaufpreis
• Verbleibende Gramm

Das System berechnet automatisch die Kosten pro Gramm und warnt, wenn der Bestand unter 200g fällt.

Du kannst das Inventar für deinen Buchhalter als CSV exportieren.`
      },
      {
        title: "4. Zubehörverwaltung",
        content: `Registriere Zubehör, das du in Drucken verwendest (Haken, Magnete, Verpackung usw.) mit Name, Einzelkosten und Lagerbestand.

ZUBEHÖRKATEGORIEN sind anpassbar: Füge neue aus dem Zubehör-Menü hinzu.

Zubehör wird automatisch zur Berechnung hinzugefügt, wenn du es im Rechner auswählst.`
      },
      {
        title: "5. Einstellungen: Drucker und Zubehör",
        content: `Auf der Seite "Einstellungen" verwaltest du:

3D-DRUCKER
• Name/Modell, Kaufkosten, geschätzte Lebensdauer in Stunden
• Leistung (W) und Stromkosten (€/kWh)
• Wartung (€/Druckstunde): deckt Düsen, Riemen, Schmiermittel usw. ab
Das System berechnet automatisch Abschreibung €/h und Strom €/h.

⭐ ZUBEHÖR (NEU)
Bereich für zeitlich abgeschriebenes Zubehör:
• Bambu Lab AMS / AMS 2 Pro (Multicolor)
• Texturierte Platten, PEI usw.
• Filament-Trocknungssysteme
Gebe ein: Name, Marke, Preis, Nutzungsdauer (Stunden). Das System berechnet die Abschreibung €/Stunde.

Im 3D-Rechner kannst du dann MEHRERE ZUBEHÖRTEILE gleichzeitig für jeden Druck AUSWÄHLEN und die Nutzungsstunden jedes Einzelnen angeben.`
      },
      {
        title: "6. 3D-Druck Kostenrechner",
        content: `Der Rechner ist das Herzstück der App. Schritte:

SCHRITT 1 — Drucker
Wähle den Drucker. Beinhaltet automatisch Abschreibung + Strom + Stundenwartung.

SCHRITT 2 — Filamente
Wähle Filamente und Gramm. Du kannst mehr als eines hinzufügen (Multicolor).

SCHRITT 3 — Druckzeit
Stunden und Minuten getrennt. Du kannst sie aus einer .3mf-Datei mit "Importieren .3mf" importieren.

SCHRITT 4 — Designzeit
Wenn du das Stück selbst modelliert hast, füge Designstunden hinzu (Standard 20€/h).

SCHRITT 5 — Zubehör und Menge
Füge Zubehör hinzu und lege die Menge fest (bei > 1 wird jedes Stück eine unabhängige Verkaufszeile).

⭐ SCHRITT 6 — Zubehör (AMS, Platten usw.)
Wenn du in den Einstellungen Zubehör konfiguriert hast, erscheint es hier. Kreuze die verwendeten an und gebe die Stunden an. Die Abschreibungskosten werden zur Summe addiert.

⭐ SCHRITT 7 — Cricut-Arbeiten (WENN DU DEN PLOTTER VERWENDET HAST)
Wenn du Cricut-Angebote mit "Zum 3D-Rechner hinzufügen" erstellt hast, siehst du sie hier. Wähle sie aus, um ihre Kosten einzubeziehen. WICHTIG: Du kannst wählen, ob die Marge auch auf die Cricut-Kosten angewendet wird:
• Checkbox AKTIV (Standard): Cricut-Kosten tragen wie andere Kosten zur Marge bei → du verdienst auch an Cricut-Arbeiten
• Checkbox INAKTIV: Cricut-Kosten werden zum Verkaufspreis als Durchgang addiert (Kunde zahlt genau den Cricut-Angebotswert, kein zusätzlicher Aufschlag)

SCHRITT 8 — Preis
Lege eine Marge % oder einen manuellen Preis fest. Du kannst auch MwSt (22%), Yield Rate (% erfolgreiche Drucke) und benutzerdefinierte stündliche Wartung festlegen.

SCHRITT 9 — Kunde (optional)
Verknüpfe den Verkauf mit einem Kunden aus deinem Adressbuch.

.3MF-IMPORT
Bambu Studio (2.05+), OrcaSlicer, Creality Print, PrusaSlicer, Cura werden unterstützt. Die Datei muss GESLICED sein (exportiere die geslicete Platte, nicht das Projekt).

Das System berechnet: Material + Strom + Druckerabschreibung + Wartung + Zubehör + Ausrüstung + Design + eventuelle Cricut-Kosten = Gesamtkosten. Dann wird die Marge angewendet.`
      },
      {
        title: "7. Cricut / Schneideplotter-Modul ⭐",
        content: `Wenn du eine Cricut, Silhouette, Brother oder einen anderen Schneideplotter besitzt, ist das Cricut-Modul für dich. Drei Bereiche in "Plotter-Kostenrechner":

MATERIALIEN
Registriere jedes Material mit:
• Kategorie (HTV, Klebe-/Ablösvinyl, Transferband, Karton usw.)
• Marke, Farbe + Hex, Lieferant
• Preis, Kaufmenge, Einheit (m², cm², Laufmeter, Blätter, Stück)
• Verschnitt % (typischer Ausschuss)
• Rest + Warnschwelle
Das System berechnet auto die Einheitskosten.

MASCHINEN
Registriere deinen Plotter mit:
• Name, Marke/Modell, Preis, Kaufdatum
• Verbrauch (W) und Stromkosten (€/kWh)
• Abschreibung: "einfache" Formel (Preis/Lebensdauer Stunden) oder "steuerlich" (Preis/Jahre/12/Monatsstunden)
Das System berechnet €/h Abschreibung und Energie.

VERBRAUCHSMATERIALIEN
Klingen, Matten, Stifte, Spitzen, Rollen, Schutzblätter. Für jedes: Preis + Anzahl erwarteter Nutzungen → Kosten pro Nutzung auto.

CRICUT-ANGEBOTSRECHNER
Im Projektrechner findest du 7 Bereiche:
1. Info (Name, Kunde, Kategorie, Datum, Notizen)
2. Hauptmaterial + Zusatzmaterialien
3. Bearbeitungszeiten: Vorbereitung, Schneiden, Ablösen, Transferband, Pressen, Montage (⭐ ALLE IN MINUTEN, keine Stunden)
4. Maschine + Nutzungsminuten (⭐ NEU: von Stunden zu Minuten, realistischer für kurze Arbeiten)
5. Verbrauchsmaterialien (Multi-Select mit Anzahl der Nutzungen pro Projekt)
6. Verpackung: Beutel, Box, Karton, Etikett, Karte, Band
7. Indirekte Kosten (Marketplace %, Zahlungsgebühren %, feste Gemeinkosten, MwSt %)

PREIS
Lege Marge % oder manuellen Preis fest. Die klebrige Zusammenfassung rechts zeigt live: Produktion, indirekte Kosten, Preis, Nettogewinn und effektive Marge.

3D-INTEGRATION
Durch Aktivieren von "Zum 3D-Druck-Rechner hinzufügen" auf dem Cricut-Angebot erscheint es im Abschnitt "Cricut-Arbeiten" des 3D-Rechners. Nützlich für Mischprodukte (z.B. HTV-T-Shirt + 3D-gedrucktes Gadget).

DUPLIZIEREN / ALS VERKAUF SPEICHERN
Jedes Cricut-Angebot kann dupliziert (nützlich für Varianten) oder direkt als Verkauf im Verkaufsregister gespeichert werden.`
      },
      {
        title: "8. Kunden (CRM Adressbuch)",
        content: `Kundenadressbuch mit:
• Vorname, Nachname, Telefon, E-Mail, Adresse, Notizen
• Schnellsuche und Sortierung
• Kaufhistorie pro Kunde (Taschensymbol)
• CSV-Export

Kunden werden mit Verkäufen im Rechner verknüpft (Menü "Kunde"). In PDF-Angeboten werden sie automatisch ausgefüllt.`
      },
      {
        title: "9. Verkaufsregister",
        content: `Jeder aus dem Rechner gespeicherte Verkauf zeigt:
• Produktname, Kosten, Verkaufspreis, Gewinn, Kunde
• Zahlungsstatus (Bezahlt / Unbezahlt) Schnellumschalter
• Versand (separate Kosten)
• Herkunftsmodul (3D / Cricut / Manuell)

FILTER UND SORTIERUNG
Nach Monat, Zahlungsstatus, sortierbar nach Datum/Preis/Gewinn/Name.

MEHRERE MENGEN
Wenn du 4 Schlüsselanhänger gedruckt hast, wird jedes Stück eine einzelne Zeile mit Batch-Indikator (1/4, 2/4...). Du kannst:
• Jedes Stück bezahlt/unbezahlt markieren
• Preis des einzelnen Stücks bearbeiten
• Sie zusammen oder einzeln sehen

NACHDRUCKEN
Druckersymbol → kehre mit allen vorausgefüllten Daten zum Rechner zurück.

BEARBEITEN
Bleistiftsymbol → bearbeite Name, Preis, Kunde, Versand (automatische Gewinnneuberechnung).

ANGEBOT AUS VERKAUF
Blaues Dokumentsymbol → generiere ein PDF-Angebot aus einem bestehenden Verkauf. Wenn bereits Angebote für diesen Verkauf generiert wurden, wird das Symbol grün mit Punkt (vermeidet unbeabsichtigte Duplikate).

CSV-EXPORT
Alles als CSV für deinen Buchhalter exportieren.`
      },
      {
        title: "10. Einkäufe",
        content: `Registriere jeden Materialeinkauf (Typ, Marke, Farbe, Spulenmenge, Preis, Gramm).

Das System:
• Aktualisiert automatisch ein bestehendes Filament
• Oder erstellt ein neues, wenn es nicht existiert
Du kannst Einkäufe nach Datum, Preis, Gramm, Material oder Marke sortieren und als CSV exportieren.`
      },
      {
        title: "11. Professionelle PDF-Angebote",
        content: `Drei Wege zum Generieren von Angeboten:

A) AUS DEM RECHNER (schnell)
Nach der Berechnung, klicke "PDF-Angebot generieren". Das Angebot zeigt nur Produkt und Preis (keine internen Kosten).

B) AUS VERKÄUFEN (rückwirkend)
Blaues Dokumentsymbol auf jedem Verkauf → vorausgefüllter Dialog → PDF.

C) AUS DER ANGEBOTSSEITE (Multi-Produkt)
Im Menü "Angebote" kannst du komplexe Angebote mit mehreren Produkten, Kunden aus dem Adressbuch oder manuell, Notizen, Gültigkeit erstellen.

FIRMENDATEN
Tab "Firmendaten": Firmenname, Adresse, PLZ, Stadt, USt-IdNr, Telefon, E-Mail, Logo (max 500KB). Sie erscheinen im Kopf ALLER Angebote.

HERUNTERLADEN & DRUCKEN
Jedes Angebot hat:
• PDF herunterladen → echter .pdf-Dateidownload (weißer Hintergrund auch im Dunkelmodus garantiert)
• Drucken → Browser-Druckdialog

VERLAUF
Tab "Verlauf" auf der Angebotsseite. Jedes Angebot zeigt: Nummer PRV-JJJJMMTT-HHMMSS, Kunde, Produkte, Wert, Versanddatum (wenn per E-Mail gesendet).`
      },
      {
        title: "12. News / Blog",
        content: `Öffentliches Blog-Modul zum Lesen von Artikeln, Anleitungen und Neuigkeiten von Artes&Tramas 3D. Jeder Artikel hat:
• Titel, Kategorie (Anleitungen / News / Case Study usw.)
• Formatierter Inhalt (fett, Listen, Links, Bilder)
• Cover, Veröffentlichungsdatum

ÖFFENTLICHE ROUTEN
• /notizie — öffentliche Artikelliste mit Kategoriefilter
• /notizie/:slug — Artikeldetail (auch im Dunkelmodus lesbar)`
      },
      {
        title: "13. Profil, Thema, Sprache",
        content: `Im Profil kannst du:
• Name, UI-Sprache (IT/EN/ES/FR) ändern
• Passwort ändern
• Persönliche Statistiken sehen

HELLES/DUNKLES THEMA
Sonnen-/Mondsymbol in der Seitenleiste. Das Thema gilt auch für Modale, Formulare und Exporte.

SPRACHUMSCHALTER VOR LOGIN
Anmelde-/Registrierungs-/Passwort-Vergessen-Seiten haben einen Sprachumschalter (IT/EN/ES/FR). Die Auswahl wird in localStorage gespeichert.`
      },
      {
        title: "14. Problem melden",
        content: `Wenn du einen Fehler findest: "Problem melden" in der Seitenleiste. Gib Titel, Beschreibung, Priorität (niedrig/mittel/hoch), Screenshot (max 5MB) ein. Du erhältst Updates zum Lösungsstatus.`
      },
      {
        title: "15. Cookies und Datenschutz (DSGVO)",
        content: `Beim ersten Zugriff siehst du ein DSGVO-konformes Banner zur Verwaltung von Cookies:
• Technisch (immer aktiv)
• Analytisch (optional)
• Marketing (optional)

Ändere die Präferenzen jederzeit im Footer der Website (Cookie-Richtlinie).`
      },
      {
        title: "Tipps zum Einstieg",
        content: `1. Füge deinen 3D-Drucker in den Einstellungen hinzu
2. Füge amortisiertes Zubehör (AMS usw.) hinzu, wenn vorhanden
3. Registriere Filamente im Bestand
4. Füge häufig verwendetes Zubehör hinzu
5. Wenn du eine Cricut hast: Registriere Materialien, Maschinen und Verbrauchsmaterialien im Cricut-Modul
6. Verwende den Rechner für deinen ersten Druck
7. Speichere den Verkauf, verknüpfe den Kunden und beginne Gewinne zu verfolgen

Viel Spaß beim Drucken! 🖨️✂️`
      }
    ]
  },
  fr: {
    title: "Guide Utilisateur",
    subtitle: "Calculateur de Coûts d'Impression 3D + Cricut",
    print: "Imprimer",
    download: "Télécharger PDF",
    version: "v2026.09 — Mis à jour",
    sections: [
      {
        title: "Bienvenue",
        content: `Bienvenue dans le Calculateur de Coûts Artes&Tramas 3D ! Une application complète pour makers et professionnels qui suivent les coûts d'impression 3D, plotters de découpe (Cricut), matériaux, ventes et clients.

CE GUIDE COUVRE :
• Calculateur d'Impression 3D (avec Équipement/AMS et intégration Cricut)
• Module Cricut / Plotter de Découpe
• Clients, Ventes, Devis et Achats
• Blog / Actualités`
      },
      {
        title: "1. Inscription et Connexion",
        content: `Pour commencer, inscris-toi avec ton email et un mot de passe. Tu recevras un email de vérification : clique sur le lien pour activer ton compte.

Si tu oublies ton mot de passe, utilise "Mot de passe oublié" sur la page de connexion. Tu recevras un lien temporaire pour le réinitialiser.

RÉTENTION DE COMPTE
Pour l'hygiène de la base de données :
• Comptes NON vérifiés inactifs depuis plus de 90 jours sont supprimés
• Comptes VÉRIFIÉS sans connexion depuis plus de 12 mois sont désactivés (réactivables en se connectant)
• Comptes désactivés depuis plus de 12 mois sont supprimés définitivement
Il suffit de se connecter pour réactiver un compte désactivé.`
      },
      {
        title: "2. Tableau de bord",
        content: `Aperçu avec :
• Chiffre d'affaires total, profit net et tendances mensuelles
• Graphiques des ventes
• Alertes de stock bas (filaments sous 200g)
• Produits les plus vendus et ventes récentes
• Résumé mensuel des expéditions

Le tableau de bord se met à jour en temps réel avec tes données.`
      },
      {
        title: "3. Gestion des Filaments",
        content: `Enregistre chaque bobine avec :
• Matériau (PLA, PETG, ABS, TPU, etc.)
• Couleur avec aperçu (support BICOLORE avec split diagonal)
• Marque, poids et prix d'achat
• Grammes restants

Le système calcule automatiquement le coût par gramme et alerte quand le stock descend sous 200g.

Tu peux exporter l'inventaire en CSV pour ton comptable.`
      },
      {
        title: "4. Gestion des Accessoires",
        content: `Enregistre les accessoires utilisés dans les impressions (crochets, aimants, emballage, etc.) avec nom, coût unitaire et quantité en stock.

Les CATÉGORIES D'ACCESSOIRES sont personnalisables : ajoute-en de nouvelles depuis le menu Accessoires.

Les accessoires sont automatiquement ajoutés au calcul lorsque tu les sélectionnes dans le Calculateur.`
      },
      {
        title: "5. Paramètres : Imprimantes et Équipement",
        content: `Sur la page "Paramètres" tu gères :

IMPRIMANTES 3D
• Nom/modèle, coût d'achat, durée de vie estimée en heures
• Puissance (W) et coût électricité (€/kWh)
• Maintenance (€/heure d'impression) : couvre buses, courroies, lubrifiants, etc.
Le système calcule automatiquement l'amortissement €/h et l'électricité €/h.

⭐ ÉQUIPEMENT & ACCESSOIRES (NOUVEAU)
Section dédiée aux équipements amortis dans le temps :
• Bambu Lab AMS / AMS 2 Pro (multicolore)
• Plateaux texturés, PEI, etc.
• Systèmes de séchage de filament
Entre : Nom, Marque, Prix, Durée de vie utile (heures). Le système calcule l'amortissement €/heure.

Dans le Calculateur 3D, tu pourras alors SÉLECTIONNER PLUSIEURS ÉQUIPEMENTS simultanément pour chaque impression, en indiquant les heures d'utilisation de chacun.`
      },
      {
        title: "6. Calculateur de Coûts d'Impression 3D",
        content: `Le Calculateur est le cœur de l'app. Étapes :

ÉTAPE 1 — Imprimante
Choisis l'imprimante. Inclut automatiquement amortissement + électricité + maintenance horaire.

ÉTAPE 2 — Filaments
Sélectionne les filaments et grammes. Tu peux en ajouter plus d'un (multicolore).

ÉTAPE 3 — Temps d'impression
Heures et minutes séparément. Tu peux les importer depuis un fichier .3mf avec "Importer .3mf".

ÉTAPE 4 — Temps de design
Si tu as modélisé la pièce toi-même, ajoute des heures de design (défaut 20€/h).

ÉTAPE 5 — Accessoires et quantité
Ajoute les accessoires et définis la quantité (si > 1, chaque pièce devient une ligne de vente indépendante).

⭐ ÉTAPE 6 — Équipement (AMS, plateaux, etc.)
Si tu as configuré des équipements dans les Paramètres, ils apparaîtront ici. Coche ceux utilisés et indique les heures. Le coût d'amortissement s'ajoute au total.

⭐ ÉTAPE 7 — Travaux Cricut (SI TU AS UTILISÉ LE PLOTTER)
Si tu as créé des devis Cricut avec "Ajouter au Calculateur 3D", tu les verras ici. Sélectionne-les pour inclure leur coût. IMPORTANT : tu peux choisir si appliquer la marge aussi au coût Cricut :
• Case COCHÉE (défaut) : le coût Cricut contribue à la marge comme tout autre coût → tu gagnes aussi sur les travaux Cricut
• Case DÉCOCHÉE : le coût Cricut est ajouté au prix de vente comme pass-through (le client paie exactement la valeur du devis Cricut, sans majoration supplémentaire)

ÉTAPE 8 — Prix
Définis une marge % ou un prix manuel. Tu peux aussi définir la TVA (22%), le taux de réussite (% impressions réussies) et la maintenance horaire personnalisée.

ÉTAPE 9 — Client (optionnel)
Associe la vente à un client de ton carnet d'adresses.

IMPORT .3MF
Bambu Studio (2.05+), OrcaSlicer, Creality Print, PrusaSlicer, Cura sont supportés. Le fichier doit être SLICÉ (exporte le plateau slicé, pas le projet).

Le système calcule : matériau + électricité + amortissement imprimante + maintenance + accessoires + équipement + design + éventuels coûts Cricut = coût total. Puis applique la marge.`
      },
      {
        title: "7. Module Cricut / Plotter de Découpe ⭐",
        content: `Si tu possèdes un Cricut, Silhouette, Brother ou autre plotter de découpe, le module Cricut est pour toi. Trois sections dans "Calculateur Coûts Plotter" :

MATÉRIAUX
Enregistre chaque matériau avec :
• Catégorie (HTV, Vinyle adhésif/removable, Transfer Tape, Cartonnage, etc.)
• Marque, couleur + hex, fournisseur
• Prix, quantité d'achat, unité (m², cm², mètres linéaires, feuilles, pièces)
• % rebut (chute typique)
• Reste + seuil de stock bas
Le système calcule auto le coût unitaire.

MACHINES
Enregistre ton plotter avec :
• Nom, marque/modèle, prix, date d'achat
• Consommation (W) et coût électricité (€/kWh)
• Amortissement : formule "simple" (prix/heures de vie) ou "fiscale" (prix/années/12/heures mois)
Le système calcule €/h d'amortissement et d'énergie.

CONSOMMABLES
Lames, tapis, stylos, pointes, rouleaux, feuilles protectrices. Pour chacun : prix + nombre d'utilisations prévues → coût par utilisation auto.

CALCULATEUR DEVIS CRICUT
Dans le calculateur projet tu trouves 7 sections :
1. Info (nom, client, catégorie, date, notes)
2. Matériau principal + matériaux extra
3. Temps de traitement : préparation, découpe, épluchage, transfer tape, pressage, assemblage (⭐ TOUS EN MINUTES, pas heures)
4. Machine + minutes d'utilisation (⭐ NOUVEAU : d'heures à minutes, plus réaliste pour travaux courts)
5. Consommables (multi-select avec nombre d'utilisations par projet)
6. Emballage : sachet, boîte, cartonnage, étiquette, carte, ruban
7. Coûts indirects (marketplace %, frais paiement %, frais généraux fixes, TVA %)

PRIX
Définis marge % ou prix manuel. Le résumé collant à droite montre en direct : production, coûts indirects, prix, profit net et marge effective.

INTÉGRATION 3D
En activant "Ajouter au Calculateur Impression 3D" sur le devis Cricut, il apparaîtra dans la section "Travaux Cricut" du Calculateur 3D. Utile pour produits mixtes (ex. t-shirt HTV + gadget imprimé en 3D).

DUPLIQUER / ENREGISTRER COMME VENTE
Chaque devis Cricut peut être dupliqué (utile pour variantes) ou enregistré directement comme vente dans le Registre des Ventes.`
      },
      {
        title: "8. Clients (Carnet CRM)",
        content: `Carnet clients avec :
• Prénom, nom, téléphone, email, adresse, notes
• Recherche rapide et tri
• Historique d'achats par client (icône sac)
• Export CSV

Les clients sont liés aux ventes depuis le Calculateur (menu "Client"). Dans les devis PDF ils sont pré-remplis.`
      },
      {
        title: "9. Registre des Ventes",
        content: `Chaque vente enregistrée depuis le Calculateur montre :
• Nom produit, coût, prix de vente, profit, client
• Statut paiement (Payé / Non payé) toggle rapide
• Expédition (coût séparé)
• Module d'origine (3D / Cricut / Manuel)

FILTRES ET TRI
Par mois, statut paiement, triable par date/prix/profit/nom.

QUANTITÉS MULTIPLES
Si tu as imprimé 4 porte-clés, chaque pièce devient une ligne unique avec indicateur batch (1/4, 2/4...). Tu peux :
• Marquer payé/non payé chaque pièce
• Modifier le prix de la pièce unique
• Les voir agrégés ou singuliers

RÉIMPRIMER
Icône imprimante → retourne au Calculateur avec toutes les données pré-remplies.

MODIFIER
Icône crayon → modifie nom, prix, client, expédition (recalcul profit automatique).

DEVIS DEPUIS VENTE
Icône document bleu → génère un devis PDF depuis une vente existante. Si des devis ont déjà été générés pour cette vente, l'icône devient verte avec point (évite duplicatas involontaires).

EXPORT CSV
Exporte tout en CSV pour ton comptable.`
      },
      {
        title: "10. Achats",
        content: `Enregistre chaque achat de matériau (type, marque, couleur, quantité bobines, prix, grammes).

Le système :
• Met automatiquement à jour un filament existant
• Ou en crée un nouveau s'il n'existe pas
Tu peux trier les achats par date, prix, grammes, matériau ou marque et exporter en CSV.`
      },
      {
        title: "11. Devis PDF Professionnels",
        content: `Trois façons de générer des devis :

A) DEPUIS LE CALCULATEUR (rapide)
Après le calcul, clique "Générer Devis PDF". Le devis montre seulement produit et prix (pas les coûts internes).

B) DEPUIS LES VENTES (rétroactif)
Icône document bleu sur chaque vente → dialog pré-rempli → PDF.

C) DEPUIS LA PAGE DEVIS (multi-produit)
Dans le menu "Devis" tu peux créer des devis complexes avec plusieurs produits, client du carnet ou manuel, notes, validité.

DONNÉES ENTREPRISE
Onglet "Données Entreprise" : nom entreprise, adresse, CP, ville, TVA, téléphone, email, logo (max 500KB). Ils apparaîtront dans l'en-tête de TOUS les devis.

TÉLÉCHARGEMENT & IMPRESSION
Chaque devis a :
• Télécharger PDF → téléchargement réel du fichier .pdf (fond blanc garanti même en mode sombre)
• Imprimer → dialog d'impression navigateur

HISTORIQUE
Onglet "Historique" dans la page Devis. Chaque devis montre : numéro PRV-AAAAMMJJ-HHMMSS, client, produits, valeur, date d'envoi (si envoyé par email).`
      },
      {
        title: "12. Actualités / Blog",
        content: `Module Blog public pour lire articles, guides et actualités d'Artes&Tramas 3D. Chaque article a :
• Titre, catégorie (Guides / Actualités / Étude de cas / etc.)
• Contenu formaté (gras, listes, liens, images)
• Couverture, date de publication

ROUTES PUBLIQUES
• /notizie — liste articles publics avec filtre catégorie
• /notizie/:slug — détail article (lisible aussi en mode sombre)`
      },
      {
        title: "13. Profil, Thème, Langue",
        content: `Dans le Profil tu peux :
• Changer nom, langue UI (IT/EN/ES/FR)
• Changer mot de passe
• Voir statistiques personnelles

THÈME CLAIR/SOMBRE
Icône soleil/lune dans la barre latérale. Le thème s'applique aussi aux modales, formulaires et exports.

SÉLECTEUR LANGUE PRÉ-LOGIN
Les pages login/inscription/mot de passe oublié ont un sélecteur langue (IT/EN/ES/FR). Le choix est sauvegardé dans localStorage.`
      },
      {
        title: "14. Signaler un Problème",
        content: `Si tu trouves un bug : "Signaler Problème" dans la barre latérale. Entre titre, description, priorité (basse/moyenne/haute), joins une capture d'écran (max 5MB). Tu recevras des mises à jour sur le statut de résolution.`
      },
      {
        title: "15. Cookies et Vie Privée (RGPD)",
        content: `Au premier accès, tu verras une bannière conforme RGPD pour gérer les cookies :
• Techniques (toujours actifs)
• Analytiques (optionnels)
• Marketing (optionnels)

Modifie les préférences à tout moment depuis le pied de page (Politique Cookies).`
      },
      {
        title: "Conseils pour Démarrer",
        content: `1. Ajoute ton imprimante 3D dans les Paramètres
2. Ajoute l'équipement amorti (AMS, etc.) si tu en as
3. Enregistre les filaments en stock
4. Ajoute les accessoires fréquents
5. Si tu as un Cricut : enregistre matériaux, machines et consommables dans le module Cricut
6. Utilise le Calculateur pour ta première impression
7. Enregistre la vente, associe le client et commence à suivre les profits

Bonne impression ! 🖨️✂️`
      }
    ]
  }

};

export default function GuidePage() {
  const [lang, setLang] = useState('it');
  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef(null);
  const guide = GUIDES[lang];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    setDownloading(true);
    try {
      const html = `<html><body style="background:#fff;color:#111;font-family:system-ui,sans-serif;">${contentRef.current.innerHTML}</body></html>`;
      const date = new Date().toISOString().slice(0, 10);
      await downloadHtmlAsPdf(html, `Guida_Utente_${lang.toUpperCase()}_${date}.pdf`);
      toast.success('PDF scaricato');
    } catch (e) {
      toast.error('Errore durante il download del PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" data-testid="guide-page">
      {/* No-print header */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              {Object.entries({ it: '🇮🇹 IT', en: '🇬🇧 EN', de: '🇩🇪 DE', fr: '🇫🇷 FR' }).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${lang === code ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  data-testid={`lang-${code}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60"
              data-testid="download-guide-pdf-btn"
            >
              <Download className="w-4 h-4" />
              {downloading ? '...' : (guide.download || 'Scarica PDF')}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 border border-orange-500 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
              data-testid="print-guide-btn"
            >
              <Printer className="w-4 h-4" />
              {guide.print}
            </button>
          </div>
        </div>
      </div>

      {/* Printable content */}
      <div ref={contentRef} className="max-w-3xl mx-auto px-6 py-10 print:px-12 print:py-8">
        {/* Cover */}
        <div className="text-center mb-12 pb-8 border-b-2 border-orange-500">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Book className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{guide.title}</h1>
          <p className="text-xl text-orange-500 font-medium">{guide.subtitle}</p>
          {guide.version && <p className="text-xs text-gray-400 mt-2">{guide.version}</p>}
          <p className="text-sm text-gray-400 mt-4">Artes&Tramas 3D</p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {guide.sections.map((section, i) => (
            <div key={i} className="print:break-inside-avoid">
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b border-gray-200">
                {section.title}
              </h2>
              <div className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}

          {/* Risorse Consigliate (link affiliati gestiti dall'Admin) */}
          <div className="print:break-inside-avoid">
            <AffiliateLinks placement="guida" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
          <p>Artes&Tramas 3D &mdash; Calcolatore Costi Stampa 3D</p>
          <p className="mt-1">calcolatore.artestramas3d.it</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .print\\:px-12 { padding-left: 3rem; padding-right: 3rem; }
          .print\\:py-8 { padding-top: 2rem; padding-bottom: 2rem; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
