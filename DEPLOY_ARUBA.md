# FilamentProfit - Guida Deploy su Aruba VPS

## Prerequisiti
- VPS Aruba con Ubuntu 22.04+ (minimo 1GB RAM, 20GB disco)
- Dominio collegato al VPS (es. artestramas3d.it)
- Accesso SSH al server

---

## 1. Collegati al VPS via SSH

```bash
ssh root@TUO_IP_VPS
```

## 2. Installa Docker e Docker Compose

```bash
# Aggiorna il sistema
apt update && apt upgrade -y

# Installa Docker
curl -fsSL https://get.docker.com | sh

# Installa Docker Compose
apt install docker-compose-plugin -y

# Verifica installazione
docker --version
docker compose version
```

## 3. Clona il repository

```bash
cd /opt
git clone https://github.com/TUO_USERNAME/TUO_REPO.git filament-profit
cd filament-profit
```

## 4. Configura le variabili d'ambiente

### Backend (.env)
```bash
nano backend/.env
```

Inserisci:
```
MONGO_URL=mongodb://mongo:27017
DB_NAME=filament_profit
JWT_SECRET=GENERA_UNA_STRINGA_CASUALE_LUNGA
FRONTEND_URL=https://artestramas3d.it
```

Per generare JWT_SECRET:
```bash
openssl rand -hex 32
```

### Frontend (.env)
```bash
nano frontend/.env
```

Inserisci:
```
REACT_APP_BACKEND_URL=https://artestramas3d.it
```

## 5. Avvia con Docker Compose

```bash
docker compose up -d --build
```

Questo avvierà:
- **MongoDB** (database)
- **Backend** (FastAPI su porta 8001)
- **Frontend** (React su porta 3000)
- **Nginx** (reverse proxy + SSL su porta 80/443)

## 6. Configura SSL con Let's Encrypt

```bash
# Installa certbot
apt install certbot python3-certbot-nginx -y

# Genera certificato (sostituisci con il tuo dominio)
certbot --nginx -d artestramas3d.it -d www.artestramas3d.it
```

## 7. Configura DNS su Aruba

Nel pannello Aruba, aggiungi questi record DNS:
```
Tipo A    → @ → TUO_IP_VPS
Tipo A    → www → TUO_IP_VPS
```

---

## Comandi utili

```bash
# Vedere i log
docker compose logs -f

# Riavviare i servizi
docker compose restart

# Fermare tutto
docker compose down

# Aggiornare il codice
cd /opt/filament-profit
git pull
docker compose up -d --build
```

## Backup MongoDB

```bash
# Backup
docker compose exec mongo mongodump --out /dump

# Restore
docker compose exec mongo mongorestore /dump
```

---

## Configurazione Email (Resend) - Da fare dopo aver comprato il dominio

1. Registrati su https://resend.com (gratis)
2. Aggiungi il tuo dominio
3. Configura i record DNS (DKIM, SPF) su Aruba
4. Ottieni la API Key
5. Aggiorna backend/.env con: `RESEND_API_KEY=re_xxx`
6. Riavvia: `docker compose restart backend`
