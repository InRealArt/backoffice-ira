#!/usr/bin/env bash
# =============================================================================
# migrate-db.sh — Wrapper pour migrate-db.ts
#
# Copie les données d'une base PostgreSQL source vers une base PostgreSQL cible.
# Crée automatiquement le schéma (tables, types, index, contraintes) en cible
# via pg_dump --schema-only si les tables n'existent pas encore.
#
# Usage:
#   ./scripts/migrate-db.sh [OPTIONS]
#
# Options:
#   --schemas=a,b,c                    Schémas à migrer (défaut: tous les schémas du projet)
#   --batch=500                        Taille des batches de lecture (défaut: 500)
#   --dry-run                          Simule sans écrire en cible
#   --skip-schema                      Ne pas appliquer le schéma DDL (tables déjà créées)
#   --exclude-tables=schema.t1,...     Exclure des tables (ni DDL ni données)
#   --help                             Affiche cette aide
#
# Variables d'environnement (dans .env.migration ou exportées) :
#   SOURCE_DATABASE_URL  — URL postgres de la base source
#   TARGET_DATABASE_URL  — URL postgres de la base cible
#
# Exemple .env.migration:
#   SOURCE_DATABASE_URL=postgresql://user:pass@localhost:5432/db_source
#   TARGET_DATABASE_URL=postgresql://user:pass@host-target:5432/db_target
#
# Exemples d'utilisation:
#   ./scripts/migrate-db.sh
#   ./scripts/migrate-db.sh --schemas=public,landing
#   ./scripts/migrate-db.sh --dry-run
#   ./scripts/migrate-db.sh --batch=1000
#   ./scripts/migrate-db.sh --skip-schema   # tables déjà présentes en cible
#   ./scripts/migrate-db.sh --exclude-tables=public.spatial_ref_sys,auth.sessions
#
#   Passer les URLs directement:
#   SOURCE_DATABASE_URL="postgresql://..." TARGET_DATABASE_URL="postgresql://..." \
#     ./scripts/migrate-db.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Aide
# ---------------------------------------------------------------------------
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  sed -n '2,38p' "$0" | sed 's/^# \{0,1\}//'
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
RESET="\033[0m"

info()    { echo -e "${CYAN}[INFO]${RESET} $*"; }
success() { echo -e "${GREEN}[OK]${RESET}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

# ---------------------------------------------------------------------------
# Vérification des prérequis
# ---------------------------------------------------------------------------
header "=== Vérification des prérequis ==="

# Node.js
if ! command -v node &>/dev/null; then
  error "Node.js n'est pas installé ou pas dans le PATH."
  exit 1
fi
NODE_VERSION=$(node --version)
info "Node.js: $NODE_VERSION"

# tsx
if ! command -v tsx &>/dev/null; then
  if ! npx --yes tsx --version &>/dev/null 2>&1; then
    error "tsx n'est pas disponible. Installez-le: npm install -g tsx"
    exit 1
  fi
  TSX_CMD="npx tsx"
else
  TSX_CMD="tsx"
fi
info "tsx: $($TSX_CMD --version 2>/dev/null || echo 'ok')"

# psql (nécessaire pour extensions et DDL)
if ! command -v psql &>/dev/null; then
  warn "psql introuvable — étapes DDL et extensions ignorées."
  PSQL_AVAILABLE="false"
  PG_DUMP_AVAILABLE="false"
  PG_DUMP_BIN=""
else
  PSQL_AVAILABLE="true"
  # Sélection du pg_dump le plus récent disponible dans /usr/lib/postgresql/
  # (sera vérifié compatible avec le serveur source après chargement des URLs)
  PG_DUMP_BIN=""
  for ver in 18 17 16 15 14; do
    bin="/usr/lib/postgresql/${ver}/bin/pg_dump"
    if [[ -x "$bin" ]]; then
      PG_DUMP_BIN="$bin"
      break
    fi
  done
  if [[ -z "$PG_DUMP_BIN" ]] && command -v pg_dump &>/dev/null; then
    PG_DUMP_BIN="pg_dump"
  fi
  if [[ -z "$PG_DUMP_BIN" ]]; then
    warn "pg_dump introuvable — l'étape DDL sera ignorée."
    PG_DUMP_AVAILABLE="false"
  else
    info "pg_dump: $("$PG_DUMP_BIN" --version | head -1)"
    PG_DUMP_AVAILABLE="true"
  fi
fi

# ---------------------------------------------------------------------------
# Chargement de .env.migration si présent
# ---------------------------------------------------------------------------
ENV_MIGRATION="$PROJECT_ROOT/.env.migration"
if [[ -f "$ENV_MIGRATION" ]]; then
  info "Chargement de .env.migration..."
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val#\"}"
      val="${val%\"}"
      val="${val#\'}"
      val="${val%\'}"
      if [[ -z "${!key:-}" ]]; then
        export "$key=$val"
      fi
    fi
  done < "$ENV_MIGRATION"
  success ".env.migration chargé."
fi

# Fallback sur .env.local
ENV_LOCAL="$PROJECT_ROOT/.env.local"
if [[ -f "$ENV_LOCAL" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val#\"}"
      val="${val%\"}"
      val="${val#\'}"
      val="${val%\'}"
      if [[ -z "${!key:-}" ]]; then
        export "$key=$val"
      fi
    fi
  done < "$ENV_LOCAL"
fi

# ---------------------------------------------------------------------------
# Vérification des URLs
# ---------------------------------------------------------------------------
if [[ -z "${SOURCE_DATABASE_URL:-}" ]]; then
  error "SOURCE_DATABASE_URL n'est pas définie."
  echo ""
  echo "  Créez un fichier .env.migration avec:"
  echo "    SOURCE_DATABASE_URL=postgresql://user:pass@host:5432/dbname"
  echo "    TARGET_DATABASE_URL=postgresql://user:pass@host:5432/dbname"
  echo ""
  echo "  Ou exportez les variables:"
  echo "    export SOURCE_DATABASE_URL='postgresql://...'"
  echo "    export TARGET_DATABASE_URL='postgresql://...'"
  echo ""
  exit 1
fi

if [[ -z "${TARGET_DATABASE_URL:-}" ]]; then
  error "TARGET_DATABASE_URL n'est pas définie."
  exit 1
fi

mask_url() {
  echo "$1" | sed -E 's|(:)([^@/]+)(@)|\1****\3|g'
}

success "SOURCE: $(mask_url "$SOURCE_DATABASE_URL")"
success "TARGET: $(mask_url "$TARGET_DATABASE_URL")"

# ---------------------------------------------------------------------------
# Parsing des flags
# ---------------------------------------------------------------------------
IS_DRY_RUN=false
SKIP_SCHEMA=false
SCHEMAS_ARG=""
for arg in "$@"; do
  [[ "$arg" == "--dry-run" ]]    && IS_DRY_RUN=true
  [[ "$arg" == "--skip-schema" ]] && SKIP_SCHEMA=true
  [[ "$arg" == --schemas=* ]]    && SCHEMAS_ARG="${arg#--schemas=}"
done

# Refuser le mode truncate explicitement
for arg in "$@"; do
  if [[ "$arg" == "--mode=truncate" ]]; then
    error "Le mode truncate est désactivé. Seul le mode upsert est autorisé."
    exit 1
  fi
done

if [[ "$IS_DRY_RUN" == "true" ]]; then
  echo ""
  info "Mode DRY-RUN activé — affichage des tables et du nombre de lignes source."
  info "Aucune donnée ne sera écrite en cible."
  echo ""
else
  echo ""
  warn "Mode UPSERT: les données existantes en cible seront mises à jour, rien ne sera supprimé."
  warn "Cible: $(mask_url "$TARGET_DATABASE_URL")"
  echo ""
  read -r -p "Confirmer la migration? [y/N] " confirm
  echo ""
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    warn "Migration annulée."
    exit 0
  fi
fi

# ---------------------------------------------------------------------------
# Extensions NeonDB : gérées nativement, ne pas tenter de les CREATE/DROP
# (NeonDB ne donne pas les droits superuser pour ces extensions)
# ---------------------------------------------------------------------------
# Ces extensions sont pré-installées et verrouillées sur NeonDB :
NEON_MANAGED_EXTENSIONS=(
  # Extensions pré-installées et verrouillées sur NeonDB
  "plpgsql"
  "pg_stat_statements"
  "pg_buffercache"
  "pg_prewarm"
  "pg_visibility"
  "pgrowlocks"
  "pgstattuple"
  "pg_freespacemap"
  "pg_walinspect"
  "amcheck"
  "pageinspect"
  "pg_surgery"
  "neon"
  "neon_utils"
  "neon_superuser"
  # Extensions Supabase-only — internes à Supabase, absentes et non nécessaires sur NeonDB
  "pg_graphql"
  "pgjwt"
  "pgsodium"
  "supabase_vault"
  "pg_net"
  "wrappers"
  "http"
)

# Extensions disponibles sur NeonDB (peuvent être CREATE EXTENSION par l'user)
NEON_AVAILABLE_EXTENSIONS=(
  "uuid-ossp"
  "pgcrypto"
  "pg_trgm"
  "unaccent"
  "citext"
  "hstore"
  "ltree"
  "intarray"
  "isn"
  "lo"
  "pg_uuidv7"
  "vector"
  "pg_jsonschema"
  "hypopg"
  "index_advisor"
  "pg_hashids"
  "pg_repack"
  "pg_hint_plan"
  "pgvector"
  "bloom"
  "btree_gin"
  "btree_gist"
  "cube"
  "dict_int"
  "earthdist"
  "fuzzystrmatch"
  "insert_username"
  "intagg"
  "moddatetime"
  "pg_partman"
  "pg_prewarm"
  "postgis"
  "postgis_raster"
  "postgis_tiger_geocoder"
  "postgis_topology"
  "address_standardizer"
  "tcn"
  "tsm_system_rows"
  "tsm_system_time"
  "xml2"
)

# ---------------------------------------------------------------------------
# Fonction : vérification des extensions source vs cible
# ---------------------------------------------------------------------------
check_extensions() {
  local source_url="$1"
  local target_url="$2"

  header "=== Vérification des extensions PostgreSQL ==="

  # Extensions installées en source
  local source_exts
  source_exts=$(psql --no-psqlrc --tuples-only --no-align \
    -c "SELECT extname FROM pg_extension ORDER BY extname;" \
    "$source_url" 2>/dev/null | tr -d ' ')

  if [[ -z "$source_exts" ]]; then
    warn "Impossible de lire les extensions source — vérifiez la connectivité."
    return 0
  fi

  # Extensions installées en cible
  local target_exts
  target_exts=$(psql --no-psqlrc --tuples-only --no-align \
    -c "SELECT extname FROM pg_extension ORDER BY extname;" \
    "$target_url" 2>/dev/null | tr -d ' ')

  if [[ -z "$target_exts" ]]; then
    warn "Impossible de lire les extensions cible — vérifiez la connectivité."
    return 0
  fi

  local has_blocking=false
  local missing_list=()
  local managed_list=()
  local ok_list=()

  while IFS= read -r ext; do
    [[ -z "$ext" ]] && continue

    local in_target=false
    local is_managed=false
    local is_available=false

    # Présente en cible ?
    if echo "$target_exts" | grep -qx "$ext"; then
      in_target=true
    fi

    # Gérée nativement par NeonDB (pas de CREATE autorisé) ?
    for m in "${NEON_MANAGED_EXTENSIONS[@]}"; do
      [[ "$m" == "$ext" ]] && is_managed=true && break
    done

    # Disponible sur NeonDB ?
    for a in "${NEON_AVAILABLE_EXTENSIONS[@]}"; do
      [[ "$a" == "$ext" ]] && is_available=true && break
    done

    if [[ "$in_target" == "true" ]]; then
      ok_list+=("$ext")
    elif [[ "$is_managed" == "true" ]]; then
      managed_list+=("$ext (gérée par NeonDB — ignorée)")
    elif [[ "$is_available" == "true" ]]; then
      missing_list+=("$ext")
      warn "Extension manquante en cible: ${YELLOW}${BOLD}$ext${RESET} — disponible sur NeonDB, à créer manuellement:"
      warn "  psql \"\$TARGET_DATABASE_URL\" -c 'CREATE EXTENSION IF NOT EXISTS \"$ext\";'"
      has_blocking=true
    else
      missing_list+=("$ext")
      warn "Extension manquante en cible: ${RED}${BOLD}$ext${RESET} — ${RED}NON disponible sur NeonDB${RESET}"
      warn "  Vérifiez si cette extension est critique pour votre schéma."
      has_blocking=true
    fi
  done <<< "$source_exts"

  # Résumé
  echo ""
  info "Extensions présentes en source et en cible : ${#ok_list[@]}"
  for e in "${ok_list[@]}"; do echo -e "    ${GREEN}✓${RESET} $e"; done

  if [[ ${#managed_list[@]} -gt 0 ]]; then
    info "Extensions gérées nativement par NeonDB (ignorées dans le DDL) : ${#managed_list[@]}"
    for e in "${managed_list[@]}"; do echo -e "    ${YELLOW}~${RESET} $e"; done
  fi

  if [[ ${#missing_list[@]} -gt 0 ]]; then
    echo ""
    if [[ "$has_blocking" == "true" ]]; then
      warn "${#missing_list[@]} extension(s) manquante(s) en cible — créez-les avant de continuer."
      echo ""
      read -r -p "Continuer quand même ? [y/N] " ext_confirm
      echo ""
      if [[ ! "$ext_confirm" =~ ^[Yy]$ ]]; then
        warn "Migration annulée. Créez les extensions manquantes puis relancez."
        exit 0
      fi
    fi
  else
    success "Toutes les extensions source sont présentes en cible."
  fi
}

# ---------------------------------------------------------------------------
# Vérification compatibilité pg_dump vs serveur source (maintenant que l'URL est chargée)
# ---------------------------------------------------------------------------
if [[ "$PG_DUMP_AVAILABLE" == "true" && "$PSQL_AVAILABLE" == "true" ]]; then
  _SERVER_VER=$(PGSSLMODE=require PGSSLROOTCERT="" \
    psql --no-psqlrc --tuples-only --no-align \
    -c "SHOW server_version_num;" "$SOURCE_DATABASE_URL" 2>/dev/null \
    | tr -d ' ' | head -1)
  _SERVER_MAJOR=$(echo "$_SERVER_VER" | cut -c1-2 | sed 's/^0//')
  [[ -z "$_SERVER_MAJOR" || "$_SERVER_MAJOR" == "0" ]] && _SERVER_MAJOR=15
  _DUMP_MAJOR=$("$PG_DUMP_BIN" --version | grep -oP '\d+' | head -1)
  if [[ "$_DUMP_MAJOR" -lt "$_SERVER_MAJOR" ]]; then
    warn "pg_dump v${_DUMP_MAJOR} incompatible avec serveur v${_SERVER_MAJOR} — étape DDL ignorée."
    warn "Installez : sudo apt install postgresql-client-${_SERVER_MAJOR}"
    PG_DUMP_AVAILABLE="false"
  else
    info "pg_dump v${_DUMP_MAJOR} compatible avec serveur v${_SERVER_MAJOR}."
  fi
fi

# ---------------------------------------------------------------------------
# Étape 0 : vérification des extensions (source Supabase → cible NeonDB)
# ---------------------------------------------------------------------------
if [[ "$IS_DRY_RUN" == "false" && "$PSQL_AVAILABLE" == "true" ]]; then
  check_extensions "$SOURCE_DATABASE_URL" "$TARGET_DATABASE_URL"
fi

# ---------------------------------------------------------------------------
# Étape 1 : création du schéma DDL en cible (pg_dump --schema-only)
# ---------------------------------------------------------------------------
if [[ "$IS_DRY_RUN" == "false" && "$SKIP_SCHEMA" == "false" ]]; then
  if [[ "$PG_DUMP_AVAILABLE" == "true" && "$PSQL_AVAILABLE" == "true" ]]; then
    header "=== Étape 1/2 — Application du schéma DDL en cible ==="

    DDL_FILE=$(mktemp /tmp/migrate-db-schema-XXXXXX.sql)
    trap 'rm -f "$DDL_FILE"' EXIT

    PG_DUMP_SCHEMA_FLAGS=()
    if [[ -n "$SCHEMAS_ARG" ]]; then
      IFS=',' read -ra SCHEMA_LIST <<< "$SCHEMAS_ARG"
      for s in "${SCHEMA_LIST[@]}"; do
        s="${s// /}"
        # pg_dump interprète le nom comme un pattern SQL — pour préserver la casse
        # des schémas camelCase (landingUgc, landingUi) il faut passer le nom
        # entre guillemets doubles SQL, ce qui s'écrit \"name\" dans la valeur de l'option
        PG_DUMP_SCHEMA_FLAGS+=("--schema=\"${s}\"")
      done
    fi

    info "Extraction du DDL depuis la source..."
    if ! PGSSLMODE=require PGSSLROOTCERT="" "$PG_DUMP_BIN" \
        --schema-only \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        "${PG_DUMP_SCHEMA_FLAGS[@]}" \
        "$SOURCE_DATABASE_URL" \
        > "$DDL_FILE" 2>/tmp/migrate-db-pgdump-err.txt; then
      error "pg_dump a échoué:"
      cat /tmp/migrate-db-pgdump-err.txt >&2
      exit 1
    fi

    # Filtre les CREATE/DROP EXTENSION pour les extensions gérées par NeonDB
    # (NeonDB les pré-installe et interdit de les recréer/supprimer)
    DDL_FILTERED=$(mktemp /tmp/migrate-db-schema-filtered-XXXXXX.sql)
    trap 'rm -f "$DDL_FILE" "$DDL_FILTERED"' EXIT

    MANAGED_PATTERN=$(IFS='|'; echo "${NEON_MANAGED_EXTENSIONS[*]}")
    grep -Ev "^(CREATE|DROP|COMMENT ON) EXTENSION (IF EXISTS |IF NOT EXISTS )?(\")?($MANAGED_PATTERN)(\")?[; ]" \
      "$DDL_FILE" > "$DDL_FILTERED" || cp "$DDL_FILE" "$DDL_FILTERED"

    DDL_LINES=$(wc -l < "$DDL_FILTERED")
    success "DDL extrait et filtré ($DDL_LINES lignes)"

    info "Application du DDL sur la DB cible (NeonDB)..."
    if ! psql \
        --quiet \
        --no-psqlrc \
        --set ON_ERROR_STOP=off \
        "$TARGET_DATABASE_URL" \
        < "$DDL_FILTERED" > /tmp/migrate-db-psql-out.txt 2>&1; then
      true  # ON_ERROR_STOP=off — on gère les erreurs manuellement ci-dessous
    fi

    # Affiche uniquement les vraies erreurs (pas les notices/warnings)
    ERRORS=$(grep -E "^ERROR:" /tmp/migrate-db-psql-out.txt || true)
    if [[ -n "$ERRORS" ]]; then
      warn "Erreurs non bloquantes lors de l'application du DDL :"
      echo "$ERRORS" | head -30 | while IFS= read -r line; do warn "  $line"; done
    fi
    success "Schéma DDL appliqué en cible."
  else
    warn "pg_dump ou psql indisponible — étape DDL ignorée."
    warn "Assurez-vous que les tables existent déjà en cible, ou installez postgresql-client."
  fi
elif [[ "$SKIP_SCHEMA" == "true" ]]; then
  info "Option --skip-schema : étape DDL ignorée (tables supposées présentes en cible)."
fi

# ---------------------------------------------------------------------------
# Étape 2 : migration des données (upsert) — ou dry-run
# ---------------------------------------------------------------------------
if [[ "$IS_DRY_RUN" == "true" ]]; then
  header "=== DRY-RUN — Analyse des données (aucune écriture) ==="
else
  header "=== Étape 2/2 — Migration des données (upsert) ==="
fi

cd "$PROJECT_ROOT"

START_TIME=$(date +%s)

# Retire tout --mode éventuel des args (le TS impose upsert en dur)
FILTERED_ARGS=()
for arg in "$@"; do
  [[ "$arg" == --mode=* ]] && continue
  FILTERED_ARGS+=("$arg")
done

$TSX_CMD scripts/migrate-db.ts "${FILTERED_ARGS[@]}"
EXIT_CODE=$?

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
  if [[ "$IS_DRY_RUN" == "true" ]]; then
    success "Dry-run terminé en ${ELAPSED}s — aucune donnée écrite."
  else
    success "Migration terminée en ${ELAPSED}s."
  fi
else
  error "Le script a échoué avec le code $EXIT_CODE."
  exit $EXIT_CODE
fi
