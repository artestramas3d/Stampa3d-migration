#!/bin/bash
# Setup automatico sottodominio shop.artestramas3d.it
# Uso: bash setup-shop.sh

set -e

DOMAIN="shop.artestramas3d.it"
EMAIL="info@artestramas3d.it"

echo "==> Setup sottodominio $DOMAIN"

# 1. Verifica che il DNS punti al server
SERVER_IP=$(curl -s ifconfig.me)
DNS_IP=$(dig +short "$DOMAIN" | tail -n1)
echo "    IP server: $SERVER_IP"
echo "    IP DNS $DOMAIN: $DNS_IP"
if [ "$SERVER_IP" != "$DNS_IP" ]; then
    echo "ATTENZIONE: il DNS di $DOMAIN non punta a $SERVER_IP."
    echo "Vai nel pannello DNS di Aruba e crea un record A:"
    echo "    shop  ->  $SERVER_IP"
    echo "Aspetta 5-10 minuti per la propagazione, poi rilancia questo script."
    exit 1
fi

# 2. Ferma nginx per liberare la porta 80
echo "==> Fermo nginx per generare certificato..."
docker compose stop nginx

# 3. Genera certificato Let's Encrypt
echo "==> Genero certificato SSL per $DOMAIN..."
if ! command -v certbot &> /dev/null; then
    echo "Installo certbot..."
    apt-get update -y && apt-get install -y certbot
fi
certbot certonly --standalone --non-interactive --agree-tos \
    --email "$EMAIL" -d "$DOMAIN"

# 4. Riavvia nginx
echo "==> Riavvio nginx..."
docker compose start nginx

# 5. Verifica
sleep 3
echo "==> Verifica:"
curl -I "https://$DOMAIN" 2>&1 | head -n 3

echo ""
echo "DONE! Apri https://$DOMAIN nel browser."
