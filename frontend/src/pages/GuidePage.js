import { useState } from 'react';
import { Book, Printer, Globe } from 'lucide-react';

const GUIDES = {
  it: {
    title: "Guida Utente",
    subtitle: "Calcolatore Costi Stampa 3D",
    print: "Stampa / Salva PDF",
    sections: [
      {
        title: "Benvenuto",
        content: `Benvenuto nel Calcolatore Costi per Stampa 3D! Questa applicazione ti aiuta a gestire i costi di stampa, i materiali, le vendite e la profittabilità delle tue creazioni 3D. Questa guida ti mostrerà come utilizzare tutte le funzionalità.`
      },
      {
        title: "1. Registrazione e Accesso",
        content: `Per iniziare, registrati con la tua email e una password. Riceverai un'email di verifica: clicca il link per attivare il tuo account. Dopo la verifica, potrai accedere a tutte le funzionalità.

Se dimentichi la password, clicca su "Password dimenticata" nella pagina di login e segui le istruzioni per reimpostarla.`
      },
      {
        title: "2. Dashboard",
        content: `La Dashboard è la tua panoramica generale. Qui trovi:
• Fatturato totale e profitto netto
• Trend mensili con grafici
• Avvisi per scorte basse (filamenti sotto i 200g)
• Prodotti più venduti
• Vendite recenti

La Dashboard si aggiorna automaticamente con i tuoi dati.`
      },
      {
        title: "3. Gestione Filamenti",
        content: `Nella sezione Filamenti puoi registrare tutte le tue bobine:
• Materiale (PLA, PETG, ABS, TPU, ecc.)
• Colore con anteprima visiva (supporta anche bicolore!)
• Brand e peso della bobina
• Prezzo di acquisto
• Grammi rimanenti

Per i filamenti bicolore: seleziona il Colore 1 e il Colore 2 nei color picker. L'anteprima mostrerà un cerchio diviso in diagonale con entrambi i colori.

Il sistema calcola automaticamente il costo per grammo e ti avvisa quando le scorte scendono sotto i 200g.`
      },
      {
        title: "4. Gestione Accessori",
        content: `Registra tutti gli accessori che usi nelle stampe:
• Nome dell'accessorio (gancetti, magneti, packaging, ecc.)
• Costo unitario
• Quantità in stock

Gli accessori vengono inclusi nel calcolo del costo finale quando li selezioni nel Calcolatore.`
      },
      {
        title: "5. Calcolatore Costi",
        content: `Il Calcolatore è il cuore dell'applicazione. Ecco come usarlo:

PASSO 1 — Seleziona la stampante
Scegli la stampante che userai. Il sistema include automaticamente il costo di ammortamento e l'elettricità.

PASSO 2 — Aggiungi filamenti
Seleziona il filamento e inserisci i grammi che userai. Puoi aggiungere più filamenti per stampe multicolore.

PASSO 3 — Tempo di stampa
Inserisci le ore e i minuti di stampa. Puoi anche importare questi dati da un file .3mf di Bambu Studio usando il pulsante "Importa .3mf".

PASSO 4 — Tempo di design
Se hai dedicato tempo al design/modellazione, inseriscilo qui.

PASSO 5 — Accessori e quantità
Aggiungi eventuali accessori e imposta la quantità di pezzi da produrre.

PASSO 6 — Margine di profitto
Imposta il margine percentuale desiderato oppure inserisci un prezzo manuale.

Il sistema calcola: costo filamento + elettricità + ammortamento + accessori + design = costo totale. Poi applica il margine per il prezzo di vendita suggerito.

IMPORTAZIONE .3MF
Clicca "Importa .3mf" e carica il file esportato da Bambu Studio. Il sistema estrarrà automaticamente il tempo di stampa e i grammi di filamento necessari.`
      },
      {
        title: "6. Registro Vendite",
        content: `Nella sezione Vendite puoi:
• Salvare ogni vendita dal Calcolatore
• Vedere nome prodotto, costo, prezzo di vendita e profitto
• Segnare se una vendita è stata pagata o meno
• Filtrare per mese e stato di pagamento
• Ordinare per data, prezzo, profitto o nome
• Esportare tutto in formato CSV

Ogni vendita registra tutti i dettagli del calcolo per riferimento futuro.`
      },
      {
        title: "7. Acquisti",
        content: `Registra ogni acquisto di materiale:
• Tipo di materiale, brand e colore
• Quantità di bobine e prezzo totale
• Grammi totali

Quando registri un acquisto, il sistema può:
• Aggiornare automaticamente un filamento esistente in magazzino
• Creare un nuovo filamento se non esiste ancora

Puoi ordinare gli acquisti per data, prezzo, grammi, materiale o brand ed esportare in CSV.`
      },
      {
        title: "8. Impostazioni (Stampanti)",
        content: `Nella sezione Impostazioni gestisci le tue stampanti:
• Nome e modello
• Costo di acquisto
• Vita stimata in ore
• Potenza in Watt
• Costo elettricità per kWh

Questi dati servono al Calcolatore per calcolare con precisione l'ammortamento e il costo dell'elettricità per ogni stampa.`
      },
      {
        title: "9. Profilo",
        content: `Nel tuo Profilo puoi:
• Cambiare il nome visualizzato
• Cambiare la lingua dell'interfaccia (Italiano, Inglese, Spagnolo, Francese)
• Cambiare la password

Le statistiche del profilo mostrano un riepilogo dei tuoi dati.`
      },
      {
        title: "10. Segnala un Problema",
        content: `Se trovi un bug o un malfunzionamento:
• Vai su "Segnala Problema" nella barra laterale
• Inserisci un titolo e una descrizione dettagliata
• Scegli la priorità (bassa, media, alta)
• Allega uno screenshot se necessario

L'amministratore riceverà la segnalazione e potrai vedere lo stato della risoluzione.`
      },
      {
        title: "11. Tema Chiaro/Scuro",
        content: `Puoi cambiare il tema dell'interfaccia cliccando l'icona sole/luna nella barra laterale. Il tema scuro è più riposante per gli occhi, soprattutto in ambienti poco illuminati.`
      },
      {
        title: "Consigli per Iniziare",
        content: `1. Aggiungi le tue stampanti nelle Impostazioni
2. Registra i filamenti che hai in magazzino
3. Aggiungi gli accessori che usi frequentemente
4. Usa il Calcolatore per la tua prima stampa
5. Salva la vendita e inizia a tracciare i profitti!

Buona stampa! 🖨️`
      }
    ]
  },
  en: {
    title: "User Guide",
    subtitle: "3D Printing Cost Calculator",
    print: "Print / Save PDF",
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
Enter hours and minutes of print time. You can also import this data from a Bambu Studio .3mf file using the "Import .3mf" button.

STEP 4 — Design Time
If you spent time on design/modeling, enter it here.

STEP 5 — Accessories and Quantity
Add any accessories and set the number of pieces to produce.

STEP 6 — Profit Margin
Set the desired percentage margin or enter a manual price.

The system calculates: filament cost + electricity + depreciation + accessories + design = total cost. Then applies the margin for the suggested selling price.

.3MF IMPORT
Click "Import .3mf" and upload the file exported from Bambu Studio. The system will automatically extract the print time and required filament grams.`
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

Each sale records all calculation details for future reference.`
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
  const guide = GUIDES[lang];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white" data-testid="guide-page">
      {/* No-print header */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            data-testid="print-guide-btn"
          >
            <Printer className="w-4 h-4" />
            {guide.print}
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="max-w-3xl mx-auto px-6 py-10 print:px-12 print:py-8">
        {/* Cover */}
        <div className="text-center mb-12 pb-8 border-b-2 border-orange-500">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Book className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{guide.title}</h1>
          <p className="text-xl text-orange-500 font-medium">{guide.subtitle}</p>
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
