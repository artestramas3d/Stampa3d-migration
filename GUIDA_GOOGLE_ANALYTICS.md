# Guida — Integrazione Google Analytics 4 (3 minuti)

Tieni il tracker interno (Admin → Analytics) per le statistiche rapide, ma collega anche Google Analytics 4 (GA4) per analytics avanzati: sorgenti traffico (chi ti manda visitatori), parole chiave Google, geolocalizzazione, dispositivi, percorsi utente, conversioni.

## Passo 1 — Crea un account GA4
1. Vai su https://analytics.google.com/
2. Login col tuo account Google → "Inizia a misurare"
3. Nome account: `Artes&Tramas` → Avanti
4. Nome proprietà: `Stampa 3D Calcolatore` → fuso orario `Italia (GMT+1)` → valuta `EUR`
5. Tipo attività: `Piccola` → Categoria: `Hobby e tempo libero`
6. Tipo piattaforma: **Web**
7. URL sito: `https://calcolatore.artestramas3d.it`
8. Nome stream: `Artes&Tramas Web`
9. Conferma → copia il **Tag ID** che inizia con `G-XXXXXXXXXX`

## Passo 2 — Incolla il codice in Admin Panel
1. Apri l'app → Admin → tab **"Codici"**
2. Sezione "Codice in HEAD" → incolla:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    page_title: document.title,
    page_path: location.pathname
  });
</script>
```

3. **IMPORTANTE**: sostituisci `G-XXXXXXXXXX` (in entrambi i posti) col tuo ID reale.
4. Salva. Lo script verra' caricato automaticamente in TUTTE le pagine (calcolatore, demo, shop, listino).

## Passo 3 — Verifica funzionamento
1. Apri https://calcolatore.artestramas3d.it in **modalita' incognito**
2. Su GA4 → "Realtime" / "Tempo reale" → vedrai la tua visita comparire entro 10 secondi
3. Dopo 24-48h: hai dati completi su sorgenti, geolocalizzazione, dispositivi, eventi

## Passo 4 — Monitora le conversioni (bonus)
Imposta come **eventi conversione** in GA4 → Admin → Eventi:
- `sign_up` → registrazione nuovo utente
- `view_item` → visualizzazione prodotto shop
- `generate_lead` → form richiesta info prodotto inviato
- `page_view` (gia' tracciato in automatico)

Questo ti permette di capire quanto traffico **converte** in registrati / lead, fondamentale per ottimizzare la pubblicita' a pagamento.

---

## Bonus: Microsoft Clarity (gratis, complementare)
Mostra le **registrazioni video** delle sessioni utente + mappe di calore (heatmap) dei click. Utilissimo per capire dove gli utenti si bloccano.

1. https://clarity.microsoft.com/ → Crea progetto gratuito
2. Copia lo snippet → incollalo in Admin → Codici → "Codice in HEAD" (subito sotto quello di GA4)
3. Pronto. Dopo 30 minuti hai le prime registrazioni.

---

## Strumenti consigliati riassunti
- **Page Tracker interno** (Admin → Analytics) → vista rapida senza account esterni
- **GA4** (gratis) → analytics professionali con sorgenti traffico, geo, conversioni
- **Microsoft Clarity** (gratis) → registrazioni sessioni + heatmap
- **Google Search Console** (gratis) → per vedere su quali parole chiave compari su Google
