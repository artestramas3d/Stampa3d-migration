# Guida Backup e Ripristino - Artes&Tramas 3D

---

## Backup Completo (Database + Codice)

### Passo 1: Collegati al server
```
ssh root@94.177.202.133
```

### Passo 2: Crea la cartella backup
```
mkdir -p /opt/backups
```

### Passo 3: Backup del Database MongoDB
```
docker exec filament-mongo mongodump --db filament_profit --out /tmp/dbbackup
docker cp filament-mongo:/tmp/dbbackup /opt/backups/db_$(date +%Y%m%d_%H%M%S)
docker exec filament-mongo rm -rf /tmp/dbbackup
```

### Passo 4: Backup dei file .env (credenziali)
```
cp /opt/Stampa3d-migration/backend/.env /opt/backups/backend_env_$(date +%Y%m%d)
```

### Passo 5: Verifica il backup
```
ls -la /opt/backups/
```

---

## Comando Rapido (tutto in uno)

Copia e incolla questo blocco per fare il backup completo:

```
ssh root@94.177.202.133
```

```
BACKUP_DIR="/opt/backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
docker exec filament-mongo mongodump --db filament_profit --out /tmp/dbbackup
docker cp filament-mongo:/tmp/dbbackup/filament_profit $BACKUP_DIR/database
docker exec filament-mongo rm -rf /tmp/dbbackup
cp /opt/Stampa3d-migration/backend/.env $BACKUP_DIR/backend.env
echo "Backup completato in: $BACKUP_DIR"
ls -la $BACKUP_DIR/
```

---

## Ripristino del Database

Se devi ripristinare il database da un backup:

### Passo 1: Trova il backup da ripristinare
```
ls -la /opt/backups/
```

### Passo 2: Ripristina
Sostituisci `NOME_BACKUP` con la cartella del backup che vuoi ripristinare:

```
BACKUP="backup_20260510_120000"
docker cp /opt/backups/$BACKUP/database filament-mongo:/tmp/dbrestore
docker exec filament-mongo mongorestore --db filament_profit --drop /tmp/dbrestore
docker exec filament-mongo rm -rf /tmp/dbrestore
```

Il flag `--drop` cancella i dati attuali prima di ripristinare. Se vuoi solo aggiungere i dati senza cancellare, rimuovi `--drop`.

### Passo 3: Riavvia il backend
```
cd /opt/Stampa3d-migration
docker compose restart backend
```

---

## Scaricare il Backup sul tuo Mac

### Dal VPS al Mac
Apri il Terminale sul Mac (NON sul VPS):

```
scp -r root@94.177.202.133:/opt/backups/backup_XXXXXXXX ~/Desktop/backup_sito
```

Sostituisci `backup_XXXXXXXX` con il nome della cartella.

---

## Backup Automatico (Opzionale)

Per fare un backup automatico ogni notte alle 3:00:

```
crontab -e
```

Aggiungi questa riga in fondo:
```
0 3 * * * BACKUP_DIR="/opt/backups/auto_$(date +\%Y\%m\%d)" && mkdir -p $BACKUP_DIR && docker exec filament-mongo mongodump --db filament_profit --out /tmp/dbbackup && docker cp filament-mongo:/tmp/dbbackup/filament_profit $BACKUP_DIR/database && docker exec filament-mongo rm -rf /tmp/dbbackup && find /opt/backups/auto_* -mtime +30 -exec rm -rf {} \;
```

Questo:
- Fa il backup ogni notte alle 3:00
- Salva in `/opt/backups/auto_YYYYMMDD`
- Cancella automaticamente i backup piu' vecchi di 30 giorni

---

## Ripristino Completo (Codice + Database)

Se devi reinstallare tutto da zero su un nuovo server:

### 1. Installa Docker
```
apt update && apt install -y docker.io docker-compose-v2
```

### 2. Clona il codice
```
cd /opt
git clone https://github.com/TUO_UTENTE/Stampa3d-migration.git
cd Stampa3d-migration
```

### 3. Ripristina le credenziali
```
cp /percorso/backup/backend.env backend/.env
```

### 4. Correggi i file per il server
Segui i passi 4a, 4b, 4c, 4d della Guida Aggiornamento.

### 5. Avvia i container
```
docker compose up -d --build
```

### 6. Ripristina il database
```
docker cp /percorso/backup/database filament-mongo:/tmp/dbrestore
docker exec filament-mongo mongorestore --db filament_profit --drop /tmp/dbrestore
docker exec filament-mongo rm -rf /tmp/dbrestore
docker compose restart backend
```

### 7. Configura SSL
```
docker compose stop nginx
certbot certonly --standalone -d calcolatore.artestramas3d.it --force-renewal
docker compose start nginx
```

---

## Cosa viene salvato nel backup

| Elemento | Cosa contiene |
|----------|---------------|
| `database/` | Tutti i dati: utenti, filamenti, vendite, acquisti, clienti, preventivi, impostazioni, newsletter |
| `backend.env` | Credenziali: password MongoDB, SMTP Aruba, JWT secret |

Il codice sorgente e' su GitHub, quindi non serve backupparlo separatamente.
