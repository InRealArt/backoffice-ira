#!/usr/bin/env bash
# =============================================================================
# backup-db.sh — Sauvegarde complète d'une base PostgreSQL
#
# Génère un dump complet (schéma + données + séquences) d'une DB PostgreSQL.
# Les credentials sont lus depuis un fichier .env — jamais en argument CLI.
#
# Objets sauvegardés :
#   - Tables, colonnes, types (enum, composite, domaines)
#   - Index (simples, uniques, partiels)
#   - Contraintes (PK, FK, UNIQUE, CHECK, NOT NULL)
#   - Séquences avec setval(MAX+1) — autoincrement prêt à l'emploi
#   - Vues et vues matérialisées (structure + données)
#   - Fonctions, procédures stockées, triggers, règles
#   - Extensions
#   - Données de toutes les tables
#
# Usage:
#   ./scripts/backup-db.sh [OPTIONS]
#
# Options:
#   --env=FILE         Fichier .env à charger (défaut: .env.backup)
#                      Doit contenir BACKUP_DATABASE_URL=postgresql://...
#   --schemas=a,b,c    Schémas à sauvegarder (défaut: tous)
#   --output=DIR       Répertoire de destination (défaut: ./backups)
#   --no-compress      Fichier .sql non compressé (défaut: .sql.gz)
#   --sslmode=MODE     Mode SSL : require|verify-full|disable (défaut: require)
#   --help             Affiche cette aide
#
# Fichier .env attendu (ex: .env.backup) :
#   BACKUP_DATABASE_URL=postgresql://user:password@host:5432/dbname
#
# Exemples:
#   ./scripts/backup-db.sh
#   ./scripts/backup-db.sh --env=.env.backup.source
#   ./scripts/backup-db.sh --env=.env.migration --schemas=public,marketplace
#   ./scripts/backup-db.sh --env=.env.backup --output=/mnt/backups
#   ./scripts/backup-db.sh --env=.env.backup --no-compress
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Aide
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  sed -n '2,44p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

# ---------------------------------------------------------------------------
# Affichage
# ---------------------------------------------------------------------------
BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"
DIM="\033[2m"
RESET="\033[0m"

info()    { echo -e "${CYAN}[INFO]${RESET} $*"; }
success() { echo -e "${GREEN}[OK]${RESET}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

# ---------------------------------------------------------------------------
# Parsing des arguments (aucun credential en CLI)
# ---------------------------------------------------------------------------
ENV_FILE="$PROJECT_ROOT/.env.backup"
SCHEMAS_ARG=""
OUTPUT_DIR="$PROJECT_ROOT/backups"
COMPRESS=true
SSL_MODE="require"

for arg in "$@"; do
  case "$arg" in
    --env=*)        ENV_FILE="${arg#--env=}"
                    # Chemin relatif → absolu depuis PROJECT_ROOT
                    [[ "$ENV_FILE" != /* ]] && ENV_FILE="$PROJECT_ROOT/$ENV_FILE" ;;
    --schemas=*)    SCHEMAS_ARG="${arg#--schemas=}" ;;
    --output=*)     OUTPUT_DIR="${arg#--output=}" ;;
    --sslmode=*)    SSL_MODE="${arg#--sslmode=}" ;;
    --no-compress)  COMPRESS=false ;;
    --help|-h)      ;;  # déjà traité
    *)
      error "Option inconnue : $arg"
      echo "  Utilisez --help pour voir les options disponibles."
      exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Chargement du fichier .env
# ---------------------------------------------------------------------------
header "=== Chargement de la configuration ==="

if [[ ! -f "$ENV_FILE" ]]; then
  error "Fichier .env introuvable : $ENV_FILE"
  echo ""
  echo "  Créez ce fichier avec :"
  echo "    echo 'BACKUP_DATABASE_URL=postgresql://user:pass@host:5432/dbname' > .env.backup"
  echo "    chmod 600 .env.backup"
  echo ""
  echo "  Ou spécifiez un autre fichier :"
  echo "    ./scripts/backup-db.sh --env=.env.migration"
  echo ""
  exit 1
fi

# Vérification des permissions (avertit si le fichier est lisible par tous)
PERMS=$(stat -c "%a" "$ENV_FILE" 2>/dev/null || stat -f "%A" "$ENV_FILE" 2>/dev/null || echo "")
if [[ -n "$PERMS" && "$PERMS" != "600" && "$PERMS" != "400" ]]; then
  warn "Permissions de $ENV_FILE : $PERMS (recommandé : 600)"
  warn "  chmod 600 $ENV_FILE"
fi

# Charge les variables sans écraser celles déjà exportées
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    val="${BASH_REMATCH[2]}"
    val="${val#\"}"; val="${val%\"}"; val="${val#\'}"; val="${val%\'}"
    [[ -z "${!key:-}" ]] && export "$key=$val"
  fi
done < "$ENV_FILE"

success "Fichier chargé : $ENV_FILE"

# ---------------------------------------------------------------------------
# Vérification de BACKUP_DATABASE_URL
# ---------------------------------------------------------------------------
if [[ -z "${BACKUP_DATABASE_URL:-}" ]]; then
  error "Variable BACKUP_DATABASE_URL absente de $ENV_FILE"
  echo ""
  echo "  Ajoutez dans $ENV_FILE :"
  echo "    BACKUP_DATABASE_URL=postgresql://user:pass@host:5432/dbname"
  echo ""
  exit 1
fi

DATABASE_URL="$BACKUP_DATABASE_URL"

mask_url() {
  echo "$1" | sed -E 's|(:)([^@/]+)(@)|\1****\3|g'
}

# ---------------------------------------------------------------------------
# Vérification des prérequis
# ---------------------------------------------------------------------------
header "=== Vérification des prérequis ==="

# Détecte la version du serveur PostgreSQL source
detect_server_version() {
  local url="$1"
  PGSSLMODE="$SSL_MODE" PGSSLROOTCERT="" \
    psql --no-psqlrc --tuples-only --no-align \
    -c "SHOW server_version_num;" "$url" 2>/dev/null | tr -d ' ' | head -1
}

# Trouve le pg_dump dont la version majeure >= version serveur
find_pg_dump() {
  local required_major="$1"
  # Cherche dans /usr/lib/postgresql/<version>/bin/pg_dump
  for ver in $(seq 18 -1 "$required_major"); do
    local bin="/usr/lib/postgresql/${ver}/bin/pg_dump"
    if [[ -x "$bin" ]]; then
      echo "$bin"
      return 0
    fi
  done
  # Fallback sur pg_dump système
  echo "pg_dump"
}

if ! command -v psql &>/dev/null; then
  error "psql introuvable. Installez postgresql-client :"
  error "  sudo apt install postgresql-client"
  exit 1
fi
info "psql   : $(psql --version | head -1)"

# Détecte la version du serveur
SERVER_VER_NUM=$(detect_server_version "$DATABASE_URL")
SERVER_MAJOR=$(echo "$SERVER_VER_NUM" | cut -c1-2 | sed 's/^0//')
if [[ -z "$SERVER_MAJOR" || "$SERVER_MAJOR" == "0" ]]; then
  SERVER_MAJOR=15  # fallback conservateur
fi
info "Version serveur PostgreSQL : $SERVER_MAJOR"

# Sélectionne pg_dump >= version serveur
PG_DUMP_BIN=$(find_pg_dump "$SERVER_MAJOR")
if [[ "$PG_DUMP_BIN" == "pg_dump" ]] && ! command -v pg_dump &>/dev/null; then
  error "pg_dump introuvable. Installez postgresql-client-${SERVER_MAJOR} :"
  error "  sudo apt install postgresql-client-${SERVER_MAJOR}"
  exit 1
fi
PG_DUMP_VERSION=$("$PG_DUMP_BIN" --version | head -1)
info "pg_dump : $PG_DUMP_VERSION (bin: $PG_DUMP_BIN)"

# Vérifie compatibilité version
PG_DUMP_MAJOR=$("$PG_DUMP_BIN" --version | grep -oP '\d+' | head -1)
if [[ "$PG_DUMP_MAJOR" -lt "$SERVER_MAJOR" ]]; then
  error "pg_dump v${PG_DUMP_MAJOR} ne peut pas dumper un serveur v${SERVER_MAJOR}."
  error "Installez une version compatible :"
  error "  sudo apt install postgresql-client-${SERVER_MAJOR}"
  exit 1
fi

if [[ "$COMPRESS" == "true" ]] && ! command -v gzip &>/dev/null; then
  warn "gzip introuvable — backup sans compression."
  COMPRESS=false
fi

# ---------------------------------------------------------------------------
# Test de connexion
# ---------------------------------------------------------------------------
info "Test de connexion à $(mask_url "$DATABASE_URL")..."
if ! PGSSLMODE="$SSL_MODE" PGSSLROOTCERT="" \
    psql --no-psqlrc --tuples-only --no-align \
    -c "SELECT 1" "$DATABASE_URL" &>/dev/null; then
  if [[ "$SSL_MODE" == "verify-full" ]]; then
    warn "verify-full échoué, retry avec sslmode=require..."
    SSL_MODE="require"
  fi
  if ! PGSSLMODE="$SSL_MODE" PGSSLROOTCERT="" \
      psql --no-psqlrc --tuples-only --no-align \
      -c "SELECT 1" "$DATABASE_URL" &>/dev/null; then
    error "Impossible de se connecter à la base de données."
    error "Vérifiez BACKUP_DATABASE_URL dans $ENV_FILE"
    exit 1
  fi
fi
success "Connexion établie."

# ---------------------------------------------------------------------------
# Préparation du répertoire et du nom de fichier
# ---------------------------------------------------------------------------
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/(.*?)(\?.*)?$|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^/:]+).*|\1|' | cut -d'.' -f1)

SCHEMAS_SLUG=""
if [[ -n "$SCHEMAS_ARG" ]]; then
  SCHEMAS_SLUG="_$(echo "$SCHEMAS_ARG" | tr ',' '-')"
fi

BASE_NAME="backup_${DB_HOST}_${DB_NAME}${SCHEMAS_SLUG}_${TIMESTAMP}"
SQL_FILE="$OUTPUT_DIR/${BASE_NAME}.sql"
FINAL_FILE="$SQL_FILE"
[[ "$COMPRESS" == "true" ]] && FINAL_FILE="${SQL_FILE}.gz"

# ---------------------------------------------------------------------------
# Résumé
# ---------------------------------------------------------------------------
header "=== Paramètres du backup ==="
info "DB source   : $(mask_url "$DATABASE_URL")"
info "SSL mode    : $SSL_MODE"
[[ -n "$SCHEMAS_ARG" ]] && info "Schémas     : $SCHEMAS_ARG" || info "Schémas     : tous"
info "Destination : $FINAL_FILE"
info "Compression : $([[ "$COMPRESS" == 'true' ]] && echo 'gzip (.sql.gz)' || echo 'non (.sql)')"

# ---------------------------------------------------------------------------
# Construction des flags pg_dump
# ---------------------------------------------------------------------------
PG_DUMP_FLAGS=(
  --no-owner        # portable : pas de SET ROLE/OWNER
  --no-acl          # portable : pas de GRANT/REVOKE
  --inserts         # INSERT INTO plutôt que COPY (compatible tout client SQL)
  --column-inserts  # INSERT INTO table (col1, col2) → résistant aux réordering
  # pas de --verbose : les logs stderr de pg_dump pollueraient la sortie
)

if [[ -n "$SCHEMAS_ARG" ]]; then
  IFS=',' read -ra SCHEMA_LIST <<< "$SCHEMAS_ARG"
  for s in "${SCHEMA_LIST[@]}"; do
    PG_DUMP_FLAGS+=("--schema=${s// /}")
  done
fi

# ---------------------------------------------------------------------------
# Lancement du dump
# ---------------------------------------------------------------------------
header "=== Sauvegarde en cours ==="
info "Dump en cours... (ne pas interrompre)"

START_TIME=$(date +%s)

# pg_dump écrit toujours d'abord en .sql (stdout → fichier, stderr → terminal)
# La compression éventuelle se fait après, une fois le dump validé.
PGSSLMODE="$SSL_MODE" PGSSLROOTCERT="" \
  "$PG_DUMP_BIN" "${PG_DUMP_FLAGS[@]}" "$DATABASE_URL" > "$SQL_FILE"
DUMP_EXIT=$?

if [[ $DUMP_EXIT -ne 0 ]]; then
  error "pg_dump a échoué (code $DUMP_EXIT)."
  rm -f "$SQL_FILE"
  exit 1
fi

# Vérifie que le fichier n'est pas vide
if [[ ! -s "$SQL_FILE" ]]; then
  error "Le fichier de backup est vide — pg_dump a échoué silencieusement."
  rm -f "$SQL_FILE"
  exit 1
fi

# Compression après validation
if [[ "$COMPRESS" == "true" ]]; then
  info "Compression en cours..."
  gzip -f "$SQL_FILE"
  FINAL_FILE="${SQL_FILE}.gz"
else
  FINAL_FILE="$SQL_FILE"
fi

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
success "Dump terminé en ${ELAPSED}s."

# ---------------------------------------------------------------------------
# Patch des séquences : setval(MAX + 1)
#
# pg_dump inclut setval() avec la valeur courante de la séquence au moment
# du dump. Ce patch les complète avec un setval(MAX(pk)+1) calculé depuis
# les données réelles, pour garantir qu'après restauration les prochains
# INSERTs ne collisionnent pas avec des IDs insérés hors séquence.
# ---------------------------------------------------------------------------
header "=== Patch des séquences (setval MAX+1) ==="

PATCH_SCRIPT=$(mktemp /tmp/backup-db-seqpatch-XXXXXX.sql)
trap 'rm -f "$PATCH_SCRIPT"' EXIT

PGSSLMODE="$SSL_MODE" PGSSLROOTCERT="" \
psql --no-psqlrc --tuples-only --no-align "$DATABASE_URL" -c "
SELECT
  'SELECT setval(' ||
  quote_literal(quote_ident(n.nspname) || '.' || quote_ident(s.relname)) ||
  ', COALESCE((SELECT MAX(' || quote_ident(a.attname) || ') FROM ' ||
  quote_ident(n.nspname) || '.' || quote_ident(c.relname) || '), 0) + 1, false);'
FROM pg_class s
JOIN pg_depend d    ON d.objid = s.oid AND d.deptype = 'a'
JOIN pg_class c     ON c.oid = d.refobjid
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.refobjsubid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE s.relkind = 'S'
ORDER BY n.nspname, s.relname;
" 2>/dev/null > "$PATCH_SCRIPT" || true

SEQ_COUNT=$(grep -c "setval" "$PATCH_SCRIPT" 2>/dev/null || echo 0)

if [[ "$SEQ_COUNT" -gt 0 ]]; then
  info "$SEQ_COUNT séquence(s) — injection des setval(MAX+1)..."

  PATCH_HEADER=$(mktemp /tmp/backup-db-header-XXXXXX.sql)
  {
    echo ""
    echo "-- ============================================================"
    echo "-- Resynchronisation des séquences au MAX+1"
    echo "-- Généré par backup-db.sh"
    echo "-- Garantit que les prochains INSERT ne collisionnent pas."
    echo "-- ============================================================"
    cat "$PATCH_SCRIPT"
  } > "$PATCH_HEADER"

  if [[ "$COMPRESS" == "true" ]]; then
    TEMP_SQL=$(mktemp /tmp/backup-db-patched-XXXXXX.sql)
    gunzip -c "$FINAL_FILE" > "$TEMP_SQL"
    cat "$PATCH_HEADER" >> "$TEMP_SQL"
    gzip -c "$TEMP_SQL" > "${FINAL_FILE}.new"
    mv "${FINAL_FILE}.new" "$FINAL_FILE"
    rm -f "$TEMP_SQL"
  else
    cat "$PATCH_HEADER" >> "$FINAL_FILE"
  fi

  rm -f "$PATCH_HEADER"
  success "$SEQ_COUNT setval(MAX+1) injectés."
else
  info "Aucune séquence détectée."
fi

# ---------------------------------------------------------------------------
# Rapport final
# ---------------------------------------------------------------------------
if command -v numfmt &>/dev/null; then
  FILE_SIZE=$(numfmt --to=iec-i --suffix=B "$(stat -c%s "$FINAL_FILE")")
else
  FILE_SIZE="$(du -sh "$FINAL_FILE" | cut -f1)"
fi

echo ""
success "Backup terminé en ${ELAPSED}s"
success "Fichier : $FINAL_FILE"
success "Taille  : $FILE_SIZE"
echo ""
echo -e "${DIM}Pour restaurer :"
if [[ "$COMPRESS" == "true" ]]; then
  echo -e "  gunzip -c \"$FINAL_FILE\" | psql \"\$TARGET_DATABASE_URL\""
else
  echo -e "  psql \"\$TARGET_DATABASE_URL\" < \"$FINAL_FILE\""
fi
echo -e "${RESET}"
warn "Ne committez jamais ce fichier dans git (backups/ est dans .gitignore)."
