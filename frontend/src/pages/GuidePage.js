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
    subtitle: "3D Printing Cost Calculator",
    print: "Print / Save PDF",
    download: "Download PDF",
    sections: [
      {
        title: "Welcome",
        content: `Welcome to the 3D Printing Cost Calculator! This application helps you manage printing costs, materials, sales, and profitability of your 3D creations. This guide will show you how to use all features.`
      },
      {
        title: "1. Registration and Login",
        content: `To get started, register with your email and a password. You will receive a verification email: click the link to activate your account. After verification, you can access all features.

If you forget your password, click "Forgot Password" on the login page and follow the instructions to reset it.`
      },
      {
        title: "2. Dashboard",
        content: `The Dashboard is your general overview. Here you find:
• Total revenue and net profit
• Monthly trends with charts
• Low stock alerts (filaments below 200g)
• Best-selling products
• Recent sales

The Dashboard updates automatically with your data.`
      },
      {
        title: "3. Filament Management",
        content: `In the Filaments section you can register all your spools:
• Material (PLA, PETG, ABS, TPU, etc.)
• Color with visual preview (also supports bicolor!)
• Brand and spool weight
• Purchase price
• Remaining grams

For bicolor filaments: select Color 1 and Color 2 in the color pickers. The preview will show a diagonally split circle with both colors.

The system automatically calculates cost per gram and alerts you when stock drops below 200g.`
      },
      {
        title: "4. Accessories Management",
        content: `Register all accessories you use in prints:
• Accessory name (hooks, magnets, packaging, etc.)
• Unit cost
• Quantity in stock

Accessories are included in the final cost calculation when you select them in the Calculator.`
      },
      {
        title: "5. Cost Calculator",
        content: `The Calculator is the heart of the application. Here's how to use it:

STEP 1 — Select Printer
Choose the printer you'll use. The system automatically includes depreciation and electricity costs.

STEP 2 — Add Filaments
Select the filament and enter the grams you'll use. You can add multiple filaments for multicolor prints.

STEP 3 — Print Time
Enter hours and minutes of print time. You can also import this data from a .3mf file using the "Import .3mf" button.

STEP 4 — Design Time
If you spent time on design/modeling, enter it here.

STEP 5 — Accessories and Quantity
Add any accessories and set the number of pieces to produce. If quantity is greater than 1, sales will be registered as individual pieces you can manage separately.

STEP 6 — Profit Margin
Set the desired percentage margin or enter a manual price.

STEP 7 — Client (optional)
Select a client from your address book to link to the sale.

The system calculates: filament cost + electricity + depreciation + accessories + design = total cost. Then applies the margin for the suggested selling price.

.3MF IMPORT
Click "Import .3mf" and upload the file exported from your slicer. Supported slicers:
• Bambu Studio (v2.05+)
• OrcaSlicer
• Creality Print
• PrusaSlicer
• Cura

IMPORTANT: The file must be exported AFTER slicing. In Bambu Studio use "File → Export → Export plate sliced file" (NOT "Save project").

For multicolor prints, the system automatically detects each filament with type, color and grams.

GENERATE QUOTE PDF
After calculating costs, you can generate a Quote PDF directly from the calculator by clicking "Generate Quote PDF". The quote shows only the product and final price (not internal costs) and is customized with your business details and logo.`
      },
      {
        title: "6. Sales Register",
        content: `In the Sales section you can:
• Save every sale from the Calculator
• View product name, cost, selling price and profit
• Mark whether a sale has been paid or not
• Filter by month and payment status
• Sort by date, price, profit or name
• Export everything in CSV format
• Edit price and name of any sale (pencil icon)

MULTIPLE QUANTITIES
If you printed multiple copies (e.g. 4 keychains), each piece is registered as a single row. You can:
• Mark paid/unpaid for each piece individually
• Edit the price of each piece
• See the batch indicator (1/4, 2/4, etc.)

REPRINT
Every sale has a "Reprint" button (printer icon). Clicking it takes you back to the Calculator with all data pre-filled: filaments, printer, print time and accessories.`
      },
      {
        title: "7. Purchases",
        content: `Record every material purchase:
• Material type, brand and color
• Number of spools and total price
• Total grams

When you record a purchase, the system can:
• Automatically update an existing filament in stock
• Create a new filament if it doesn't exist yet

You can sort purchases by date, price, grams, material or brand and export to CSV.`
      },
      {
        title: "8. Settings (Printers)",
        content: `In Settings, manage your printers:
• Name and model
• Purchase cost
• Estimated life in hours
• Power in Watts
• Electricity cost per kWh

This data is used by the Calculator to precisely calculate depreciation and electricity cost for each print.`
      },
      {
        title: "9. Profile",
        content: `In your Profile you can:
• Change your display name
• Change the interface language (Italian, English, Spanish, French)
• Change your password

Profile statistics show a summary of your data.`
      },
      {
        title: "10. Report a Problem",
        content: `If you find a bug or malfunction:
• Go to "Report Problem" in the sidebar
• Enter a title and detailed description
• Choose priority (low, medium, high)
• Attach a screenshot if necessary

The administrator will receive the report and you can see the resolution status.`
      },
      {
        title: "11. Light/Dark Theme",
        content: `You can change the interface theme by clicking the sun/moon icon in the sidebar. Dark theme is easier on the eyes, especially in low-light environments.`
      },
      {
        title: "12. Client Management",
        content: `In the Clients section you can manage your address book:
• Name, surname, phone, email, address and notes
• Quick search among clients
• Purchase history for each client (bag icon)
• Export address book to CSV

Clients can be linked to sales directly from the Calculator by selecting them from the "Client" dropdown.`
      },
      {
        title: "13. PDF Quotes",
        content: `You can generate professional quotes in two ways:

FROM THE CALCULATOR (quick method):
After calculating costs, click "Generate Quote PDF". The system creates a quote with the product and selling price. Internal costs are not shown.

FROM THE QUOTES PAGE (custom quotes):
Go to "Quotes" in the sidebar. Here you can:
• Create quotes with multiple products
• Select a client from your address book or enter manually
• Add notes and validity period
• Preview and print/save as PDF

BUSINESS DETAILS:
In the "Business Details" tab, enter:
• Company name, address, ZIP, city
• VAT number, phone, email
• Logo (image upload, max 500KB)

These details will appear in the header of all quotes.

The history of generated quotes is available in the "History" tab.`
      },
      {
        title: "14. Cookies and Privacy",
        content: `The site is GDPR compliant. On first visit you'll see a banner that lets you:
• Accept all cookies
• Accept only necessary ones
• Customize preferences (technical, analytics, marketing)

You can change your preferences at any time from the Cookie Policy page, accessible from the site footer.`
      },
      {
        title: "Tips to Get Started",
        content: `1. Add your printers in Settings
2. Register the filaments you have in stock
3. Add the accessories you frequently use
4. Use the Calculator for your first print
5. Save the sale and start tracking profits!

Happy printing! 🖨️`
      }
    ]
  },
  de: {
    title: "Benutzerhandbuch",
    subtitle: "3D-Druck Kostenkalkulator",
    print: "Drucken / Als PDF speichern",
    download: "PDF herunterladen",
    sections: [
      {
        title: "Willkommen",
        content: `Willkommen beim 3D-Druck Kostenkalkulator! Diese Anwendung hilft Ihnen bei der Verwaltung von Druckkosten, Materialien, Verkäufen und der Rentabilität Ihrer 3D-Kreationen. Diese Anleitung zeigt Ihnen, wie Sie alle Funktionen nutzen können.`
      },
      {
        title: "1. Registrierung und Anmeldung",
        content: `Um zu beginnen, registrieren Sie sich mit Ihrer E-Mail und einem Passwort. Sie erhalten eine Bestätigungs-E-Mail: Klicken Sie auf den Link, um Ihr Konto zu aktivieren. Nach der Bestätigung können Sie auf alle Funktionen zugreifen.

Wenn Sie Ihr Passwort vergessen haben, klicken Sie auf "Passwort vergessen" auf der Anmeldeseite und folgen Sie den Anweisungen.`
      },
      {
        title: "2. Dashboard",
        content: `Das Dashboard ist Ihre allgemeine Übersicht. Hier finden Sie:
• Gesamtumsatz und Nettogewinn
• Monatliche Trends mit Diagrammen
• Warnungen bei niedrigem Bestand (Filamente unter 200g)
• Meistverkaufte Produkte
• Letzte Verkäufe

Das Dashboard wird automatisch mit Ihren Daten aktualisiert.`
      },
      {
        title: "3. Filament-Verwaltung",
        content: `Im Bereich Filamente können Sie alle Ihre Spulen registrieren:
• Material (PLA, PETG, ABS, TPU, usw.)
• Farbe mit visueller Vorschau (auch zweifarbig!)
• Marke und Spulengewicht
• Einkaufspreis
• Verbleibende Gramm

Für zweifarbige Filamente: Wählen Sie Farbe 1 und Farbe 2 in den Farbwählern. Die Vorschau zeigt einen diagonal geteilten Kreis mit beiden Farben.

Das System berechnet automatisch die Kosten pro Gramm und warnt Sie, wenn der Bestand unter 200g fällt.`
      },
      {
        title: "4. Zubehör-Verwaltung",
        content: `Registrieren Sie alle Zubehörteile, die Sie bei Drucken verwenden:
• Name des Zubehörs (Haken, Magnete, Verpackung usw.)
• Stückkosten
• Lagerbestand

Zubehör wird in die Endkostenberechnung einbezogen, wenn Sie es im Kalkulator auswählen.`
      },
      {
        title: "5. Kostenkalkulator",
        content: `Der Kalkulator ist das Herzstück der Anwendung. So verwenden Sie ihn:

SCHRITT 1 — Drucker auswählen
Wählen Sie den Drucker, den Sie verwenden werden. Das System berücksichtigt automatisch Abschreibungs- und Stromkosten.

SCHRITT 2 — Filamente hinzufügen
Wählen Sie das Filament und geben Sie die Gramm ein. Sie können mehrere Filamente für mehrfarbige Drucke hinzufügen.

SCHRITT 3 — Druckzeit
Geben Sie Stunden und Minuten der Druckzeit ein. Sie können diese Daten auch aus einer Bambu Studio .3mf-Datei importieren.

SCHRITT 4 — Designzeit
Wenn Sie Zeit für Design/Modellierung aufgewendet haben, geben Sie sie hier ein.

SCHRITT 5 — Zubehör und Menge
Fügen Sie Zubehör hinzu und legen Sie die Stückzahl fest.

SCHRITT 6 — Gewinnmarge
Legen Sie die gewünschte prozentuale Marge fest oder geben Sie einen manuellen Preis ein.

Das System berechnet: Filamentkosten + Strom + Abschreibung + Zubehör + Design = Gesamtkosten. Dann wird die Marge für den vorgeschlagenen Verkaufspreis angewendet.

.3MF-IMPORT
Klicken Sie auf "Import .3mf" und laden Sie die aus Bambu Studio exportierte Datei hoch. Das System extrahiert automatisch Druckzeit und benötigte Filamentgramm.`
      },
      {
        title: "6. Verkaufsregister",
        content: `Im Bereich Verkäufe können Sie:
• Jeden Verkauf aus dem Kalkulator speichern
• Produktname, Kosten, Verkaufspreis und Gewinn einsehen
• Markieren, ob ein Verkauf bezahlt wurde oder nicht
• Nach Monat und Zahlungsstatus filtern
• Nach Datum, Preis, Gewinn oder Name sortieren
• Alles im CSV-Format exportieren`
      },
      {
        title: "7. Einkäufe",
        content: `Erfassen Sie jeden Materialeinkauf:
• Materialtyp, Marke und Farbe
• Anzahl der Spulen und Gesamtpreis
• Gesamtgramm

Bei der Erfassung eines Einkaufs kann das System:
• Ein bestehendes Filament im Lager automatisch aktualisieren
• Ein neues Filament erstellen, wenn es noch nicht existiert

Sie können Einkäufe nach Datum, Preis, Gramm, Material oder Marke sortieren und als CSV exportieren.`
      },
      {
        title: "8. Einstellungen (Drucker)",
        content: `In den Einstellungen verwalten Sie Ihre Drucker:
• Name und Modell
• Anschaffungskosten
• Geschätzte Lebensdauer in Stunden
• Leistung in Watt
• Stromkosten pro kWh

Diese Daten werden vom Kalkulator verwendet, um Abschreibung und Stromkosten für jeden Druck genau zu berechnen.`
      },
      {
        title: "9. Profil",
        content: `In Ihrem Profil können Sie:
• Ihren Anzeigenamen ändern
• Die Oberflächensprache ändern (Italienisch, Englisch, Spanisch, Französisch)
• Ihr Passwort ändern

Die Profilstatistiken zeigen eine Zusammenfassung Ihrer Daten.`
      },
      {
        title: "10. Problem melden",
        content: `Wenn Sie einen Fehler finden:
• Gehen Sie zu "Problem melden" in der Seitenleiste
• Geben Sie einen Titel und eine detaillierte Beschreibung ein
• Wählen Sie die Priorität (niedrig, mittel, hoch)
• Hängen Sie bei Bedarf einen Screenshot an

Der Administrator erhält die Meldung und Sie können den Lösungsstatus einsehen.`
      },
      {
        title: "11. Helles/Dunkles Design",
        content: `Sie können das Design ändern, indem Sie auf das Sonnen-/Mondsymbol in der Seitenleiste klicken. Das dunkle Design ist augenschonender, besonders in schwach beleuchteten Umgebungen.`
      },
      {
        title: "12. Kundenverwaltung",
        content: `Im Bereich Kunden können Sie Ihr Adressbuch verwalten:
• Name, Nachname, Telefon, E-Mail, Adresse und Notizen
• Schnellsuche unter Kunden
• Kaufhistorie für jeden Kunden (Taschensymbol)
• Adressbuch als CSV exportieren

Kunden können direkt im Kalkulator mit Verkäufen verknüpft werden.`
      },
      {
        title: "13. PDF-Angebote",
        content: `Sie können professionelle Angebote auf zwei Arten erstellen:

AUS DEM KALKULATOR (Schnellmethode):
Nach der Kostenberechnung klicken Sie auf "Angebot PDF erstellen". Das System erstellt ein Angebot mit Produkt und Verkaufspreis. Interne Kosten werden nicht angezeigt.

VON DER ANGEBOTE-SEITE (individuelle Angebote):
Gehen Sie zu "Angebote" in der Seitenleiste. Hier können Sie:
• Angebote mit mehreren Produkten erstellen
• Kunden aus dem Adressbuch auswählen oder manuell eingeben
• Notizen und Gültigkeitsdauer hinzufügen
• Vorschau anzeigen und als PDF drucken/speichern

GESCHÄFTSDATEN:
Im Tab "Geschäftsdaten" geben Sie ein:
• Firmenname, Adresse, PLZ, Stadt
• USt-IdNr., Telefon, E-Mail
• Logo (Bild-Upload, max 500KB)

Diese Daten erscheinen in der Kopfzeile aller Angebote.`
      },
      {
        title: "14. Cookies und Datenschutz",
        content: `Die Website ist DSGVO-konform. Beim ersten Besuch sehen Sie ein Banner, das Ihnen ermöglicht:
• Alle Cookies akzeptieren
• Nur notwendige akzeptieren
• Präferenzen anpassen (technische, analytische, Marketing)

Sie können Ihre Präferenzen jederzeit auf der Cookie-Richtlinien-Seite ändern.`
      },
      {
        title: "Tipps zum Einstieg",
        content: `1. Fügen Sie Ihre Drucker in den Einstellungen hinzu
2. Registrieren Sie die Filamente, die Sie auf Lager haben
3. Fügen Sie häufig verwendetes Zubehör hinzu
4. Verwenden Sie den Kalkulator für Ihren ersten Druck
5. Speichern Sie den Verkauf und beginnen Sie, Gewinne zu verfolgen!

Viel Spaß beim Drucken! 🖨️`
      }
    ]
  },
  fr: {
    title: "Guide Utilisateur",
    subtitle: "Calculateur de Coûts d'Impression 3D",
    print: "Imprimer / Enregistrer PDF",
    download: "Télécharger PDF",
    sections: [
      {
        title: "Bienvenue",
        content: `Bienvenue dans le Calculateur de Coûts d'Impression 3D ! Cette application vous aide à gérer les coûts d'impression, les matériaux, les ventes et la rentabilité de vos créations 3D. Ce guide vous montrera comment utiliser toutes les fonctionnalités.`
      },
      {
        title: "1. Inscription et Connexion",
        content: `Pour commencer, inscrivez-vous avec votre email et un mot de passe. Vous recevrez un email de vérification : cliquez sur le lien pour activer votre compte. Après la vérification, vous pourrez accéder à toutes les fonctionnalités.

Si vous oubliez votre mot de passe, cliquez sur "Mot de passe oublié" sur la page de connexion et suivez les instructions pour le réinitialiser.`
      },
      {
        title: "2. Tableau de Bord",
        content: `Le Tableau de Bord est votre vue d'ensemble. Vous y trouvez :
• Chiffre d'affaires total et bénéfice net
• Tendances mensuelles avec graphiques
• Alertes de stock bas (filaments en dessous de 200g)
• Produits les plus vendus
• Ventes récentes

Le Tableau de Bord se met à jour automatiquement avec vos données.`
      },
      {
        title: "3. Gestion des Filaments",
        content: `Dans la section Filaments, vous pouvez enregistrer toutes vos bobines :
• Matériau (PLA, PETG, ABS, TPU, etc.)
• Couleur avec aperçu visuel (supporte aussi le bicolore !)
• Marque et poids de la bobine
• Prix d'achat
• Grammes restants

Pour les filaments bicolores : sélectionnez la Couleur 1 et la Couleur 2 dans les sélecteurs. L'aperçu montrera un cercle divisé en diagonale avec les deux couleurs.

Le système calcule automatiquement le coût par gramme et vous alerte quand le stock descend sous 200g.`
      },
      {
        title: "4. Gestion des Accessoires",
        content: `Enregistrez tous les accessoires que vous utilisez :
• Nom de l'accessoire (crochets, aimants, emballage, etc.)
• Coût unitaire
• Quantité en stock

Les accessoires sont inclus dans le calcul du coût final lorsque vous les sélectionnez dans le Calculateur.`
      },
      {
        title: "5. Calculateur de Coûts",
        content: `Le Calculateur est le cœur de l'application. Voici comment l'utiliser :

ÉTAPE 1 — Sélectionner l'imprimante
Choisissez l'imprimante que vous utiliserez. Le système inclut automatiquement l'amortissement et les coûts d'électricité.

ÉTAPE 2 — Ajouter des filaments
Sélectionnez le filament et entrez les grammes. Vous pouvez ajouter plusieurs filaments pour des impressions multicolores.

ÉTAPE 3 — Temps d'impression
Entrez les heures et minutes d'impression. Vous pouvez aussi importer ces données depuis un fichier .3mf de Bambu Studio.

ÉTAPE 4 — Temps de conception
Si vous avez consacré du temps au design/modélisation, entrez-le ici.

ÉTAPE 5 — Accessoires et quantité
Ajoutez les accessoires et définissez le nombre de pièces à produire.

ÉTAPE 6 — Marge bénéficiaire
Définissez la marge en pourcentage souhaitée ou entrez un prix manuel.

Le système calcule : coût filament + électricité + amortissement + accessoires + design = coût total. Puis applique la marge pour le prix de vente suggéré.

IMPORT .3MF
Cliquez sur "Import .3mf" et chargez le fichier exporté de Bambu Studio. Le système extraira automatiquement le temps d'impression et les grammes de filament nécessaires.`
      },
      {
        title: "6. Registre des Ventes",
        content: `Dans la section Ventes, vous pouvez :
• Enregistrer chaque vente depuis le Calculateur
• Voir nom du produit, coût, prix de vente et bénéfice
• Marquer si une vente a été payée ou non
• Filtrer par mois et statut de paiement
• Trier par date, prix, bénéfice ou nom
• Exporter tout en format CSV`
      },
      {
        title: "7. Achats",
        content: `Enregistrez chaque achat de matériel :
• Type de matériau, marque et couleur
• Nombre de bobines et prix total
• Grammes totaux

Lors de l'enregistrement d'un achat, le système peut :
• Mettre à jour automatiquement un filament existant en stock
• Créer un nouveau filament s'il n'existe pas encore

Vous pouvez trier les achats par date, prix, grammes, matériau ou marque et exporter en CSV.`
      },
      {
        title: "8. Paramètres (Imprimantes)",
        content: `Dans les Paramètres, gérez vos imprimantes :
• Nom et modèle
• Coût d'achat
• Durée de vie estimée en heures
• Puissance en Watts
• Coût de l'électricité par kWh

Ces données sont utilisées par le Calculateur pour calculer précisément l'amortissement et le coût de l'électricité pour chaque impression.`
      },
      {
        title: "9. Profil",
        content: `Dans votre Profil, vous pouvez :
• Changer votre nom affiché
• Changer la langue de l'interface (Italien, Anglais, Espagnol, Français)
• Changer votre mot de passe

Les statistiques du profil montrent un résumé de vos données.`
      },
      {
        title: "10. Signaler un Problème",
        content: `Si vous trouvez un bug :
• Allez dans "Signaler un Problème" dans la barre latérale
• Entrez un titre et une description détaillée
• Choisissez la priorité (basse, moyenne, haute)
• Joignez une capture d'écran si nécessaire

L'administrateur recevra le signalement et vous pourrez voir le statut de la résolution.`
      },
      {
        title: "11. Thème Clair/Sombre",
        content: `Vous pouvez changer le thème en cliquant sur l'icône soleil/lune dans la barre latérale. Le thème sombre est plus reposant pour les yeux, surtout dans les environnements peu éclairés.`
      },
      {
        title: "12. Gestion des Clients",
        content: `Dans la section Clients, vous pouvez gérer votre carnet d'adresses :
• Nom, prénom, téléphone, email, adresse et notes
• Recherche rapide parmi les clients
• Historique des achats pour chaque client (icône sac)
• Export du carnet d'adresses en CSV

Les clients peuvent être associés aux ventes directement depuis le Calculateur en les sélectionnant dans le menu déroulant "Client".`
      },
      {
        title: "13. Devis PDF",
        content: `Vous pouvez générer des devis professionnels de deux manières :

DEPUIS LE CALCULATEUR (méthode rapide) :
Après avoir calculé les coûts, cliquez sur "Générer Devis PDF". Le système crée un devis avec le produit et le prix de vente. Les coûts internes ne sont pas affichés.

DEPUIS LA PAGE DEVIS (devis personnalisés) :
Allez dans "Devis" dans la barre latérale. Vous pouvez :
• Créer des devis avec plusieurs produits
• Sélectionner un client du carnet d'adresses ou saisir manuellement
• Ajouter des notes et une durée de validité
• Prévisualiser et imprimer/enregistrer en PDF

DONNÉES ENTREPRISE :
Dans l'onglet "Données Entreprise", saisissez :
• Nom de l'entreprise, adresse, code postal, ville
• N° TVA, téléphone, email
• Logo (téléchargement d'image, max 500 Ko)

Ces données apparaîtront dans l'en-tête de tous les devis.`
      },
      {
        title: "14. Cookies et Confidentialité",
        content: `Le site est conforme au RGPD. Lors de votre première visite, vous verrez une bannière qui vous permet de :
• Accepter tous les cookies
• Accepter uniquement les nécessaires
• Personnaliser les préférences (techniques, analytiques, marketing)

Vous pouvez modifier vos préférences à tout moment depuis la page Politique de Cookies.`
      },
      {
        title: "Conseils pour Démarrer",
        content: `1. Ajoutez vos imprimantes dans les Paramètres
2. Enregistrez les filaments que vous avez en stock
3. Ajoutez les accessoires que vous utilisez fréquemment
4. Utilisez le Calculateur pour votre première impression
5. Enregistrez la vente et commencez à suivre vos bénéfices !

Bonne impression ! 🖨️`
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
