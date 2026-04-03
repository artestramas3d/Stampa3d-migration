# FilamentProfit

Calcolatore costi stampa 3D per maker.

## Deploy

Leggi [DEPLOY_ARUBA.md](./DEPLOY_ARUBA.md) per le istruzioni complete.

### Quick Start (locale)

```bash
docker compose up -d --build
```

Il sito sarà disponibile su http://localhost

### Struttura
- `backend/` - API FastAPI + MongoDB
- `frontend/` - React + TailwindCSS
- `nginx/` - Configurazione reverse proxy
- `docker-compose.yml` - Orchestrazione servizi
