# Note di Rilascio - Versione 0.4
## Artes&Tramas | Calcolatore Stampa 3D
### 8 Maggio 2026

---

## Nuove Funzionalita'

### Ristampa dalle Vendite
Nella pagina Vendite ogni riga ha ora un pulsante con l'icona stampante. Cliccandolo, vieni reindirizzato al Calcolatore con tutti i dati gia' compilati: filamenti, stampante, tempo di stampa, accessori e nome del prodotto. Ideale per ristampare un oggetto senza dover reinserire i dati manualmente.

### Gestione Quantita' Singole
Quando salvi un calcolo con piu' pezzi (es. 4 portachiavi), ogni pezzo viene ora registrato come riga singola nelle Vendite. Puoi segnare come venduto o non venduto ogni pezzo singolarmente e modificare il prezzo di ciascuno in modo indipendente. Esempio: stampi 4 oggetti, ne vendi 2 a 30 euro e i restanti 2 li abbassi a 20 euro.

### Modifica Prezzo e Nome dalle Vendite
Ogni vendita ha un nuovo pulsante modifica (icona matita). Puoi cambiare il nome del prodotto e il prezzo di vendita in qualsiasi momento. Il profitto viene ricalcolato automaticamente.

### Newsletter Migliorata
L'editor newsletter nel Pannello Admin e' stato completamente rinnovato:
- Toolbar di formattazione: grassetto, corsivo, sottolineato, titoli, elenchi, link e colore del testo
- Scelta dei destinatari: invia a tutti gli utenti oppure seleziona utenti specifici con ricerca e checkbox
- Anteprima della mail prima dell'invio
- Modalita' testo semplice o formattato HTML

### Selettore Lingua nelle Pagine di Accesso
Le pagine di Login, Registrazione e Password Dimenticata includono ora un selettore lingua (IT, EN, ES, FR) visibile prima ancora di effettuare l'accesso.

### Cookie Banner e Cookie Policy
Il sito e' ora conforme al GDPR con un banner cookie che permette di accettare, rifiutare o personalizzare le preferenze (cookie tecnici, analitici, marketing). La pagina Cookie Policy e' accessibile dal footer e consente di modificare le preferenze in qualsiasi momento.

---

## Miglioramenti

### Import File .3mf Potenziato
Il parser dei file .3mf e' stato completamente riscritto e ora supporta:
- Bambu Studio v2.05+ (nuovo formato XML)
- OrcaSlicer
- Creality Print
- PrusaSlicer e Cura
- Stampe multicolore: vengono riconosciuti tutti i filamenti con tipo, colore e grammi per ciascuno
- Precisione decimale: i grammi vengono ora mostrati con 2 decimali (es. 1.13g invece di 1.1g)
- Messaggi di errore chiari quando il file non e' stato esportato correttamente

### Precisione Decimale negli Input
Tutti i campi numerici (grammi, prezzi) ora accettano correttamente i decimali con punto o virgola. Non si azzerano piu' durante la digitazione.

### Precisione nel Calcolatore
Il totale grammi nel riepilogo del calcolatore non mostra piu' errori di arrotondamento (es. 27.46g invece di 27.459999999999997g).

### Email di Benvenuto Aggiornata
La mail di benvenuto per i nuovi iscritti include ora un link diretto alla Guida completa del sito.

---

## Versione consigliata per la Newsletter

Oggetto: **Aggiornamento v0.4 - Nuove funzionalita' per gestire meglio le tue vendite!**

Testo:

Ciao!

Abbiamo rilasciato la versione 0.4 del Calcolatore con importanti novita':

**Ristampa veloce** - Dalla pagina Vendite puoi ora ristampare qualsiasi oggetto con un click. Tutti i dati vengono importati automaticamente nel Calcolatore.

**Gestione pezzi singoli** - Se stampi piu' copie dello stesso oggetto, ogni pezzo viene tracciato singolarmente. Puoi segnare le vendite una per una e modificare il prezzo di ciascun pezzo.

**Modifica vendite** - Hai cambiato idea sul prezzo? Ora puoi modificare prezzo e nome di qualsiasi vendita direttamente dalla lista.

**Import .3mf migliorato** - Supporto completo per Bambu Studio v2, stampe multicolore con dettaglio di ogni filamento usato. Ricorda di esportare come "File piatto slicato" dopo lo slicing.

**Newsletter avanzata** - Per gli admin: nuovo editor con formattazione, scelta destinatari e anteprima.

Buone stampe!
Il team Artes&Tramas
