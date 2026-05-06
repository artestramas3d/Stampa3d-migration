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
ssh root@<IP-DEL-TUO-VPS>
```
Inserisci la password quando richiesto.

### Passo 3: Aggiorna il sito
```
cd /opt/Stampa3d-migration
git stash
git pull
docker compose up -d --build
```

### Passo 4: Aspetta
Il build richiede **3-5 minuti**. Quando torna il cursore `root@ArtesTramas:`, il sito è aggiornato.

### Passo 5: Verifica
Apri `https://calcolatore.artestramas3d.it` nel browser e controlla che funzioni.

---

## Cosa fa ogni comando

| Comando | Cosa fa |
|---------|---------|
| `ssh root@IP` | Ti collega al server remoto |
| `cd /opt/Stampa3d-migration` | Vai nella cartella del progetto |
| `git stash` | Mette da parte eventuali modifiche locali sul server |
| `git pull` | Scarica le ultime modifiche da GitHub |
| `docker compose up -d --build` | Ricostruisce e riavvia i container |

---

## Se qualcosa va storto

### Il build fallisce (errore memoria)
```
docker system prune -af
docker compose up -d --build
```

### Il sito non si apre dopo il build
Controlla i log:
```
docker compose logs nginx --tail 20
docker compose logs backend --tail 20
docker compose logs frontend --tail 20
```

### git pull dice "local changes would be overwritten"
```
git stash
git pull
docker compose up -d --build
```

### Vuoi riavviare senza ricostruire (più veloce)
```
docker compose restart
```

### Vuoi vedere se i container sono attivi
```
docker compose ps
```

### Vuoi fermare tutto
```
docker compose down
```

### Vuoi riavviare tutto da zero
```
docker compose down
docker system prune -af
docker compose up -d --build
```

---

## Comandi utili

| Cosa vuoi fare | Comando |
|----------------|---------|
| Vedere IP del server | `curl -s ifconfig.me` |
| Vedere spazio disco | `df -h` |
| Vedere memoria RAM | `free -h` |
| Vedere lo swap | `swapon --show` |
| Uscire dal server | `exit` |

---

## Riepilogo veloce (copia e incolla)

```
ssh root@<IP-DEL-TUO-VPS>
cd /opt/Stampa3d-migration
git stash
git pull
docker compose up -d --build
```

Fatto! 🚀
