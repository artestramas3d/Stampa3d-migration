# 🔐 Guida SSL — Rinnovo Certificati Let's Encrypt

**Progetto**: Artes&Tramas (Stampa3d-migration)  
**Server**: VPS Aruba Ubuntu — nginx in Docker  
**Domini**: `artestramas3d.it`, `www.artestramas3d.it`, `shop.artestramas3d.it`, `calcolatore.artestramas3d.it`

---

## 📋 Indice

1. [Quando rinnovare](#quando-rinnovare)
2. [Setup iniziale (una tantum)](#setup-iniziale-una-tantum)
3. [Procedura di rinnovo standard](#procedura-di-rinnovo-standard)
4. [Aggiungere nuovi sottodomini](#aggiungere-nuovi-sottodomini)
5. [Troubleshooting](#troubleshooting)
6. [Auto-rinnovo automatico](#auto-rinnovo-automatico)

---

## Quando rinnovare

I certificati Let's Encrypt scadono ogni **90 giorni**. Il sistema è configurato per rinnovarli automaticamente ~30 giorni prima della scadenza, ma se vedi l'errore **"La connessione non è privata"** (Safari/Chrome), devi rinnovare manualmente.

**Verifica scadenza**:
```bash
ssh root@<IP_VPS>
sudo certbot certificates
```

Output atteso:
```
Certificate Name: artestramas3d.it
  Domains: artestramas3d.it www.artestramas3d.it shop.artestramas3d.it calcolatore.artestramas3d.it
  Expiry Date: 2026-11-27 (VALID: 89 days)
```

---

## Setup iniziale (una tantum)

Se è la prima volta, installa certbot + plugin nginx:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

Verifica versione:
```bash
certbot --version
```

---

## Procedura di rinnovo standard

⚠️ **IMPORTANTE**: nginx gira in Docker. NON usare `--nginx` plugin perché conflitta con nginx-docker sulla porta 80. Usa **standalone**.

### Step 1 — Preparazione

```bash
ssh root@<IP_VPS>
cd /opt/Stampa3d-migration
```

### Step 2 — Pulisci lock file eventuali

```bash
# Verifica processi certbot attivi
ps aux | grep certbot | grep -v grep

# Se ne trovi uno, killalo
sudo kill <PID>          # sostituisci <PID>
# oppure forza
sudo kill -9 <PID>

# Rimuovi lock file
sudo rm -f /var/lib/letsencrypt/.certbot.lock
sudo rm -f /var/log/letsencrypt/.certbot.lock

# Ferma il timer per evitare conflitti
sudo systemctl stop certbot.timer
```

### Step 3 — Ferma nginx-docker (libera porta 80)

```bash
docker compose stop nginx

# Verifica porta libera
sudo ss -tulpn | grep ':80 '
# Nessun output = porta libera ✓
```

### Step 4 — Rinnova il certificato

```bash
sudo certbot certonly --standalone \
  -d artestramas3d.it \
  -d www.artestramas3d.it \
  -d shop.artestramas3d.it \
  -d calcolatore.artestramas3d.it \
  --expand \
  --non-interactive \
  --agree-tos \
  -m artestramas3d@gmail.com
```

**Output atteso**:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/artestramas3d.it/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/artestramas3d.it/privkey.pem
```

### Step 5 — Riavvia nginx

```bash
docker compose start nginx
docker compose exec nginx nginx -s reload
```

### Step 6 — Riattiva auto-rinnovo

```bash
sudo systemctl start certbot.timer
sudo systemctl enable certbot.timer
```

### Step 7 — Verifica

```bash
sudo certbot certificates
curl -sI https://shop.artestramas3d.it | head -3
curl -sI https://calcolatore.artestramas3d.it | head -3
```

Dovresti vedere `HTTP/2 200` o `HTTP/2 301`.

---

## Aggiungere nuovi sottodomini

### 1. Aggiungi record DNS su Aruba

Vai su [Aruba DNS Panel](https://admin.aruba.it) → seleziona il dominio → **Configurazione DNS avanzata**.  
Aggiungi record **A**:
- `nuovosottodominio` → `<IP_VPS>`

### 2. Verifica propagazione DNS

```bash
dig nuovosottodominio.artestramas3d.it +short
```
Aspetta 5–15 minuti che compaia l'IP corretto.

### 3. Aggiungi il sottodominio al certificato

Ripeti la [procedura di rinnovo standard](#procedura-di-rinnovo-standard) al **Step 4** aggiungendo `-d nuovosottodominio.artestramas3d.it` alla lista.

Es. con `blog.artestramas3d.it`:
```bash
sudo certbot certonly --standalone \
  -d artestramas3d.it \
  -d www.artestramas3d.it \
  -d shop.artestramas3d.it \
  -d calcolatore.artestramas3d.it \
  -d blog.artestramas3d.it \
  --expand \
  --non-interactive \
  --agree-tos \
  -m artestramas3d@gmail.com
```

Il flag `--expand` aggiunge domini a un certificato esistente senza crearne uno nuovo.

### 4. Aggiorna nginx-config per il nuovo dominio

Modifica `/opt/Stampa3d-migration/nginx/nginx.conf` (o il tuo file conf) aggiungendo un nuovo `server { ... }` block per il sottodominio. Poi:

```bash
docker compose exec nginx nginx -t   # test config
docker compose exec nginx nginx -s reload
```

---

## Troubleshooting

### ❌ Errore: `Another instance of Certbot is already running`

**Causa**: certbot bloccato o timer che gira in background.  
**Fix**:
```bash
ps aux | grep certbot | grep -v grep
sudo kill -9 <PID>
sudo rm -f /var/lib/letsencrypt/.certbot.lock
sudo rm -f /var/log/letsencrypt/.certbot.lock
```

---

### ❌ Errore: `nginx: [emerg] bind() to 0.0.0.0:80 failed`

**Causa**: Stai usando `--nginx` ma la porta è occupata da nginx-docker.  
**Fix**: usa `certonly --standalone` (vedi Step 4 della procedura standard).

---

### ❌ Errore: `The requested nginx plugin does not appear to be installed`

**Causa**: manca `python3-certbot-nginx`.  
**Fix**:
```bash
sudo apt install -y python3-certbot-nginx
```
Ma se nginx è in Docker **NON serve**: usa direttamente `certonly --standalone`.

---

### ❌ Errore: `DNS problem: NXDOMAIN looking up A for shop.artestramas3d.it`

**Causa**: il sottodominio non è nel DNS.  
**Fix**: aggiungi il record A sul pannello Aruba (vedi sezione "Aggiungere nuovi sottodomini").

---

### ❌ Errore: `Timeout during connect (likely firewall problem)`

**Causa**: firewall blocca porta 80.  
**Fix**:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

Verifica anche il firewall Aruba dal pannello.

---

### ❌ Browser mostra ancora errore SSL dopo il rinnovo

**Causa**: cache browser aggressiva.  
**Fix**:
- **Safari**: `Menu Safari → Cancella cronologia → Ora`, poi riapri
- **Chrome**: apri in Incognito (Cmd+Shift+N)
- **Firefox**: Ctrl+Shift+Del → cancella cache

Test rapido bypassando cache browser:
```bash
curl -sI https://shop.artestramas3d.it | head -5
```

---

### ❌ `certbot certificates` non elenca i nuovi sottodomini

**Causa**: sono stati emessi certificati separati invece di uno esteso.  
**Fix**: elimina il duplicato e riesegui con `--expand`:
```bash
sudo certbot delete --cert-name shop.artestramas3d.it   # se esiste
# poi ripeti la procedura Step 4 con --expand
```

---

### ❌ Il rinnovo va, ma il browser mostra ancora certificato scaduto

**Causa**: dopo aver consolidato più certificati in uno solo, nginx.conf punta ancora ai vecchi path.

**Fix**: aggiorna `/opt/Stampa3d-migration/nginx/default.conf` sostituendo i path SSL:
```bash
sudo cp /opt/Stampa3d-migration/nginx/default.conf /opt/Stampa3d-migration/nginx/default.conf.bak
sudo sed -i \
  -e 's|/etc/letsencrypt/live/shop\.artestramas3d\.it/|/etc/letsencrypt/live/artestramas3d.it/|g' \
  -e 's|/etc/letsencrypt/live/calcolatore\.artestramas3d\.it/|/etc/letsencrypt/live/artestramas3d.it/|g' \
  -e 's|/etc/letsencrypt/live/listino\.artestramas3d\.it/|/etc/letsencrypt/live/artestramas3d.it/|g' \
  /opt/Stampa3d-migration/nginx/default.conf
docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload
```

Poi cancella eventuali cert doppi/scaduti:
```bash
sudo certbot delete --cert-name shop.artestramas3d.it --non-interactive
sudo certbot delete --cert-name calcolatore.artestramas3d.it --non-interactive
sudo certbot delete --cert-name listino.artestramas3d.it --non-interactive
```

---

## Auto-rinnovo automatico

Let's Encrypt rinnova automaticamente ~30 giorni prima della scadenza tramite `certbot.timer`.

### Verifica che sia attivo

```bash
sudo systemctl status certbot.timer
```

Output atteso:
```
● certbot.timer - Run certbot twice daily
     Active: active (waiting)
```

### Attiva se disattivo

```bash
sudo systemctl enable --now certbot.timer
```

### Test rinnovo (dry-run — non tocca niente)

```bash
sudo certbot renew --dry-run
```

### ⚠️ Problema noto con nginx-docker

Il rinnovo automatico usa **standalone** che ferma il container nginx. Se preferisci un rinnovo senza downtime, configura un **hook** che gestisce lo start/stop di nginx-docker.

Crea `/etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh`:
```bash
#!/bin/bash
cd /opt/Stampa3d-migration && docker compose stop nginx
```

Crea `/etc/letsencrypt/renewal-hooks/post/start-nginx.sh`:
```bash
#!/bin/bash
cd /opt/Stampa3d-migration && docker compose start nginx && docker compose exec -T nginx nginx -s reload
```

Rendili eseguibili:
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/start-nginx.sh
```

Ora ogni rinnovo automatico ferma/avvia nginx-docker senza il tuo intervento.

---

## 📞 Comandi di emergenza (copia-incolla veloce)

**Rinnovo completo one-liner** (quando serve subito):
```bash
cd /opt/Stampa3d-migration && \
sudo systemctl stop certbot.timer && \
sudo rm -f /var/lib/letsencrypt/.certbot.lock /var/log/letsencrypt/.certbot.lock && \
docker compose stop nginx && \
sudo certbot certonly --standalone \
  -d artestramas3d.it -d www.artestramas3d.it \
  -d shop.artestramas3d.it -d calcolatore.artestramas3d.it \
  --expand --non-interactive --agree-tos -m artestramas3d@gmail.com && \
docker compose start nginx && \
docker compose exec nginx nginx -s reload && \
sudo systemctl start certbot.timer && \
echo "✅ Rinnovo completato"
```

---

## 📚 Riferimenti

- [Documentazione Certbot](https://certbot.eff.org/instructions?ws=nginx&os=ubuntu-22)
- [Let's Encrypt community forum](https://community.letsencrypt.org/)
- [Docker Compose reference](https://docs.docker.com/compose/)

---

_Ultima modifica: 29 agosto 2026_
_Repository: https://github.com/artestramas3d/Stampa3d-migration_
