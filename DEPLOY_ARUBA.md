# Come mettere il Calcolatore su Aruba - Guida Passo Passo

Questa guida ti spiega come mettere il calcolatore online su un server Aruba.
Il calcolatore sarà su **calc.artestramas3d.it** (sottodominio).
Non serve esperienza. Segui ogni passaggio nell'ordine.

---

## COSA TI SERVE

1. Il **dominio** artestramas3d.it comprato su Aruba
2. Un **VPS** (server virtuale) su Aruba - costa circa 5-10 euro/mese
3. Il codice del sito su **GitHub** (lo salvi da qui con il pulsante "Save to Github")

---

## PASSO 1 - Compra dominio e VPS su Aruba

1. Vai su https://www.aruba.it
2. Cerca "VPS" e compra un pacchetto VPS con **Ubuntu 22.04** (il più economico va bene)
3. Se non hai già il dominio, compralo anche (nella sezione "Domini")
4. Dopo l'acquisto, Aruba ti manda una email con:
   - L'indirizzo IP del tuo server (es. 185.xxx.xxx.xxx)
   - Username: `root`
   - Password del server

**Conserva questi dati!**

---

## PASSO 2 - Collega il sottodominio al server

1. Vai nel pannello Aruba → sezione **DNS** del dominio artestramas3d.it
2. Aggiungi questo record:
   - Tipo: **A** | Nome: **calc** | Valore: **IL_TUO_IP** (quello della email)
3. Salva. I DNS possono metterci fino a 24 ore per funzionare.

---

## PASSO 3 - Collegati al server

### Se usi Windows:
1. Scarica **PuTTY** da https://putty.org
2. Aprilo, scrivi l'IP del server nel campo "Host Name"
3. Clicca "Open"
4. Scrivi `root` e poi la password che ti ha dato Aruba

### Se usi Mac:
1. Apri l'app **Terminale**
2. Scrivi: `ssh root@IL_TUO_IP`
3. Scrivi la password quando la chiede

Ora sei dentro al server! Vedrai una schermata nera con scritto qualcosa tipo `root@vps:~#`

---

## PASSO 4 - Installa Docker (copia e incolla questi comandi uno alla volta)

```
apt update && apt upgrade -y
```
(aspetta che finisca, ci mette qualche minuto)

```
curl -fsSL https://get.docker.com | sh
```
(installa Docker, aspetta che finisca)

```
apt install docker-compose-plugin git -y
```
(installa Docker Compose e Git)

Verifica che funzioni:
```
docker --version
```
Deve uscire qualcosa tipo "Docker version 24.xxx"

---

## PASSO 5 - Scarica il codice del sito

```
cd /opt
```

```
git clone https://github.com/TUO_USERNAME/TUO_REPO.git sito
```
(sostituisci con il link del tuo repository GitHub)

```
cd sito
```

---

## PASSO 6 - Configura il sito

### Configura il backend:
```
nano backend/.env
```

Cancella tutto quello che c'è e scrivi queste 4 righe:
```
MONGO_URL=mongodb://mongo:27017
DB_NAME=filament_profit
JWT_SECRET=CAMBIAMI_CON_STRINGA_LUNGA_CASUALE
FRONTEND_URL=https://calc.artestramas3d.it
```

Per salvare: premi **Ctrl+O**, poi **Invio**, poi **Ctrl+X**

Per generare la stringa casuale per JWT_SECRET:
```
openssl rand -hex 32
```
Copia il risultato e mettilo al posto di CAMBIAMI_CON_STRINGA_LUNGA_CASUALE

### Configura il frontend:
```
nano frontend/.env
```

Scrivi:
```
REACT_APP_BACKEND_URL=https://calc.artestramas3d.it
```

Salva con **Ctrl+O**, **Invio**, **Ctrl+X**

### Configura Nginx (il nome dominio):
```
nano nginx/default.conf
```

Trova le righe con `artestramas3d.it` e sostituiscile con `calc.artestramas3d.it`.
Salva con **Ctrl+O**, **Invio**, **Ctrl+X**

---

## PASSO 7 - Avvia il sito!

```
docker compose up -d --build
```

**Aspetta 2-5 minuti.** Vedrai tante righe scorrere. Quando finisce e torni al `root@vps:~#`, il sito è attivo!

Prova ad aprire nel browser: `http://calc.artestramas3d.it`

Se funziona, vai al passo successivo per aggiungere HTTPS (il lucchetto).

---

## PASSO 8 - Aggiungi HTTPS (il lucchetto verde)

```
apt install certbot python3-certbot-nginx -y
```

Questo comando non funzionerà direttamente con Docker. Facciamo in modo diverso:

```
docker compose down
```

```
apt install nginx -y
```

```
certbot --nginx -d calc.artestramas3d.it
```

Ti chiederà:
- La tua email → scrivila
- Accetti i termini → scrivi **Y**
- Vuoi condividere la email → scrivi **N**

Dopo che ha finito:
```
systemctl stop nginx
```

Ora modifica il file nginx per usare HTTPS:
```
nano nginx/default.conf
```

Togli il `#` davanti alle righe del blocco HTTPS (quelle sotto "Decommentare dopo aver configurato SSL").
Metti il `#` davanti a tutte le righe del primo blocco (quello senza ssl).
Salva con **Ctrl+O**, **Invio**, **Ctrl+X**

Riavvia:
```
docker compose up -d --build
```

Ora prova: `https://calc.artestramas3d.it` - Dovresti vedere il lucchetto verde!

---

## COMANDI UTILI DA RICORDARE

| Cosa vuoi fare | Comando |
|---|---|
| Vedere se il sito funziona | `docker compose ps` |
| Vedere i log (errori) | `docker compose logs -f` |
| Riavviare il sito | `docker compose restart` |
| Spegnere il sito | `docker compose down` |
| Accendere il sito | `docker compose up -d` |
| Aggiornare il sito dopo modifiche | vedi sotto |

### Come aggiornare il sito dopo che fai modifiche qui su Emergent:

1. Salva su GitHub (pulsante "Save to Github" qui nella chat)
2. Collegati al server (PuTTY o Terminale)
3. Scrivi questi comandi:

```
cd /opt/sito
git pull
docker compose up -d --build
```

Fatto! Il sito si aggiorna in 2-3 minuti.

---

## SE QUALCOSA NON FUNZIONA

- **Il sito non si apre**: aspetta 24 ore per i DNS, poi riprova
- **Errore "connection refused"**: scrivi `docker compose ps` per vedere se i servizi girano
- **Errore nei log**: scrivi `docker compose logs backend` per vedere gli errori del backend
- **Hai sbagliato qualcosa**: torna qui su Emergent e chiedimi aiuto! Copiami il messaggio di errore e ti aiuto.

---

## BACKUP DEI DATI

Per fare un backup del database (fallo ogni tanto!):
```
cd /opt/sito
docker compose exec mongo mongodump --out /dump
docker cp filament-mongo:/dump ./backup_$(date +%Y%m%d)
```

I tuoi dati saranno nella cartella `backup_XXXXXXXX`.
