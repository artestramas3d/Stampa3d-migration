# Guida Aggiornamento Sito - Artes&Tramas 3D
## Per Federico - Passo per Passo

---

## Procedura Standard (dopo ogni modifica su Emergent)

### Passo 1: Salva su GitHub
- Nella chat di Emergent, clicca il pulsante **"Save to Github"**
- Aspetta la conferma che il salvataggio è completato

### Passo 2: Collegati al server
Apri il Terminale sul Mac e scrivi:
```
ssh root@94.177.202.133
```
Inserisci la password quando richiesto.

### Passo 3: Aggiorna il codice
```
cd /opt/Stampa3d-migration
git reset --hard origin/main
git pull origin main
```

### Passo 4: Ripristina i file del server
Questi file devono essere adattati al tuo VPS ogni volta. Copia e incolla OGNI blocco separatamente:

**4a - Dockerfile frontend:**
```
cat > frontend/Dockerfile << 'EOF'
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=768
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
```

**4b - Nginx frontend config:**
```
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

**4c - Correggi porta proxy Nginx:**
```
sed -i 's|proxy_pass http://frontend:3000|proxy_pass http://frontend:80|g' nginx/default.conf
```

**4d - Correggi requirements.txt backend:**
```
cat > backend/requirements.txt << 'EOF'
fastapi==0.110.1
uvicorn==0.25.0
motor==3.3.1
pymongo==4.5.0
python-jose==3.5.0
python-multipart==0.0.22
python-dotenv==1.2.2
bcrypt==4.1.3
pydantic==2.12.5
passlib==1.7.4
PyJWT==2.12.1
email-validator==2.3.0
requests==2.32.5
watchfiles==1.1.1
EOF
```

### Passo 5: Ricostruisci e riavvia
```
docker compose up -d --build frontend backend
docker compose restart nginx
```

### Passo 6: Aspetta
Il build richiede **3-5 minuti**. Quando torna il cursore `root@ArtesTramas:`, il sito e' aggiornato.

### Passo 7: Verifica
```
curl -I https://calcolatore.artestramas3d.it
```
Deve dire `HTTP/1.1 200 OK`. Poi apri il sito nel browser.

---

## Riepilogo Veloce (copia tutto in ordine)

```
ssh root@94.177.202.133
```
```
cd /opt/Stampa3d-migration
git reset --hard origin/main
git pull origin main
```
```
cat > frontend/Dockerfile << 'EOF'
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=768
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
```
```
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```
```
sed -i 's|proxy_pass http://frontend:3000|proxy_pass http://frontend:80|g' nginx/default.conf
```
```
cat > backend/requirements.txt << 'EOF'
fastapi==0.110.1
uvicorn==0.25.0
motor==3.3.1
pymongo==4.5.0
python-jose==3.5.0
python-multipart==0.0.22
python-dotenv==1.2.2
bcrypt==4.1.3
pydantic==2.12.5
passlib==1.7.4
PyJWT==2.12.1
email-validator==2.3.0
requests==2.32.5
watchfiles==1.1.1
EOF
```
```
docker compose up -d --build frontend backend
docker compose restart nginx
```

---

## Cosa fa ogni comando

| Comando | Cosa fa |
|---------|---------|
| `ssh root@94.177.202.133` | Ti collega al server remoto |
| `cd /opt/Stampa3d-migration` | Vai nella cartella del progetto |
| `git reset --hard origin/main` | Annulla modifiche locali e si allinea a GitHub |
| `git pull origin main` | Scarica le ultime modifiche da GitHub |
| `cat > file << 'EOF' ... EOF` | Scrive/sovrascrive un file con il contenuto dato |
| `sed -i 's/old/new/g' file` | Sostituisce testo nel file |
| `docker compose up -d --build` | Ricostruisce e riavvia i container |
| `docker compose restart nginx` | Riavvia solo il proxy Nginx |

---

## Se qualcosa va storto

### Il build fallisce (errore memoria)
```
docker system prune -af
docker compose up -d --build frontend backend
docker compose restart nginx
```

### Il sito da 502 Bad Gateway
Controlla quale container e' crashato:
```
docker compose ps
docker compose logs frontend --tail 20
docker compose logs backend --tail 20
```

### Il sito da 404 Not Found
Il file `nginx.conf` del frontend non e' stato copiato. Riesegui il Passo 4a e 4b, poi:
```
docker compose up -d --build frontend
docker compose restart nginx
```

### Il build del backend fallisce (requirements)
Riesegui il Passo 4d, poi:
```
docker compose up -d --build backend
```

### Vuoi vedere se i container sono attivi
```
docker compose ps
```

### Vuoi riavviare senza ricostruire (piu' veloce, solo backend)
```
docker compose restart backend
```

### Vuoi riavviare tutto da zero
```
docker compose down
docker system prune -af
```
Poi riesegui dal Passo 5.

---

## Rinnovo Certificato SSL (ogni 3 mesi)

```
cd /opt/Stampa3d-migration
docker compose stop nginx
sudo certbot certonly --standalone -d calcolatore.artestramas3d.it --force-renewal
docker compose start nginx
```

---

## Attivare il sottodominio shop.artestramas3d.it (UNA TANTUM)

Il listino è ora accessibile su `shop.artestramas3d.it` (oltre che `listino.artestramas3d.it`). I clienti **NON** devono registrarsi per visitarlo. Procedura una tantum:

### Passo 1: Crea il record DNS su Aruba
1. Vai nel pannello DNS di Aruba
2. Crea un record A:
   - Nome: `shop`
   - Valore: `94.177.202.133` (IP del tuo VPS)
3. Salva e aspetta 5-10 minuti

### Passo 2: Connettiti al server e lancia lo script
```
ssh root@94.177.202.133
cd /opt/Stampa3d-migration
git pull origin main
bash setup-shop.sh
```

Lo script automaticamente:
- Verifica che il DNS sia configurato
- Genera il certificato SSL via Let's Encrypt
- Riavvia nginx

### Passo 3: Verifica
Apri `https://shop.artestramas3d.it` nel browser. Deve mostrare la vetrina prodotti.

## Comandi utili

| Cosa vuoi fare | Comando |
|----------------|---------|
| Vedere IP del server | `curl -s ifconfig.me` |
| Vedere spazio disco | `df -h` |
| Vedere memoria RAM | `free -h` |
| Vedere lo swap | `swapon --show` |
| Uscire dal server | `exit` |
