#!/bin/bash
# promote-owner.sh
# Promuove un utente a Admin + Shop Owner + Email Verified
# Uso: bash promote-owner.sh [email]
# Esempio: bash promote-owner.sh artestramas3d@gmail.com

set -e

EMAIL="${1:-artestramas3d@gmail.com}"
ENV_FILE="./backend/.env"

echo "=========================================="
echo "  PROMUOVI UTENTE A SHOP OWNER"
echo "=========================================="
echo "Email target: $EMAIL"
echo ""

# 1. Leggi DB_NAME e MONGO_URL da backend/.env
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE non trovato. Esegui questo script dalla root del progetto (dove c'e' la cartella backend/)."
  exit 1
fi

DB_NAME=$(grep -E "^DB_NAME=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
MONGO_URL=$(grep -E "^MONGO_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DB_NAME" ]; then
  echo "ERROR: DB_NAME non trovato in $ENV_FILE"
  exit 1
fi

echo "Database: $DB_NAME"

# 2. Trova il container MongoDB (prova nomi comuni)
CONTAINER=""
for NAME in mongo mongodb artes-mongo artes-tramas-mongo artestramas-mongo; do
  if docker ps --format '{{.Names}}' | grep -qw "$NAME"; then
    CONTAINER="$NAME"
    break
  fi
done

# Fallback: cerca container con "mongo" nel nome
if [ -z "$CONTAINER" ]; then
  CONTAINER=$(docker ps --format '{{.Names}}' | grep -i mongo | head -1)
fi

if [ -z "$CONTAINER" ]; then
  echo "ERROR: nessun container MongoDB trovato. Container attivi:"
  docker ps --format '  - {{.Names}} ({{.Image}})'
  exit 1
fi

echo "Container MongoDB: $CONTAINER"
echo ""

# 3. Verifica che l'utente esista
echo "=== Verifica utente ==="
FOUND=$(docker exec "$CONTAINER" mongosh "$DB_NAME" --quiet --eval "
  const u = db.users.findOne({email: '$EMAIL'});
  if (u) print(JSON.stringify({email: u.email, is_admin: u.is_admin, is_shop_owner: u.is_shop_owner, verified: u.email_verified}));
  else print('NOT_FOUND');
")

if [ "$FOUND" = "NOT_FOUND" ]; then
  echo ""
  echo "ERROR: utente $EMAIL NON esiste nel database."
  echo "Prima registralo dal sito, poi rilancia questo script."
  exit 1
fi

echo "Stato attuale: $FOUND"
echo ""

# 4. Promuovi
echo "=== Promozione in corso ==="
docker exec "$CONTAINER" mongosh "$DB_NAME" --quiet --eval "
  const r = db.users.updateOne(
    {email: '$EMAIL'},
    {\$set: {is_admin: true, is_shop_owner: true, email_verified: true}}
  );
  print('matched: ' + r.matchedCount + ' | modified: ' + r.modifiedCount);
"

# 5. Verifica finale
echo ""
echo "=== Verifica finale ==="
docker exec "$CONTAINER" mongosh "$DB_NAME" --quiet --eval "
  const u = db.users.findOne({email: '$EMAIL'});
  print('email:         ' + u.email);
  print('is_admin:      ' + u.is_admin);
  print('is_shop_owner: ' + u.is_shop_owner);
  print('verified:      ' + u.email_verified);
"

echo ""
echo "=========================================="
echo "  FATTO! Ora esci e rifai login sul sito."
echo "  Vedrai i tab 'Gestione Vetrina' e"
echo "  'Impostazioni Shop' nell'Admin Panel."
echo "=========================================="
