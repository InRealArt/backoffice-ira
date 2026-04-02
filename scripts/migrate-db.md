# migrate-db — Migration PostgreSQL vers PostgreSQL

Script de copie complète d'une base PostgreSQL source vers une base cible en mode **upsert uniquement**.
**Crée automatiquement le schéma DDL** (tables, types, index, contraintes) en cible si nécessaire via `pg_dump --schema-only`.
Le mode truncate n'existe pas — aucune donnée existante en cible ne sera jamais supprimée.

---

## Prérequis

| Outil | Rôle | Installation |
|---|---|---|
| Node.js 18+ | Exécution du script TS | — |
| `tsx` | Runner TypeScript | `npm install -g tsx` |
| `pg` (npm) | Driver PostgreSQL | `npm install pg` |
| `pg_dump` + `psql` | Création du schéma DDL en cible | `apt install postgresql-client` |

> `pg_dump` et `psql` sont optionnels. S'ils sont absents, l'étape DDL est ignorée et **les tables doivent exister en cible** (`--skip-schema` implicite).

---

## Configuration des credentials

Créer un fichier `.env.migration` à la racine du projet (jamais committé) :

```env
SOURCE_DATABASE_URL=postgresql://user:password@source-host:5432/db_source
TARGET_DATABASE_URL=postgresql://user:password@target-host:5432/db_target
```

Ou les exporter directement dans le shell :

```bash
export SOURCE_DATABASE_URL="postgresql://user:password@source-host:5432/db_source"
export TARGET_DATABASE_URL="postgresql://user:password@target-host:5432/db_target"
```

> `.env.local` est aussi lu en fallback si les variables ne sont pas encore définies.

---

## Déroulement d'une migration complète

Le script s'exécute en trois étapes :

```
Étape 0 — Vérification des extensions (Supabase → NeonDB)
  Compare pg_extension source vs cible
  Signale les extensions manquantes ou incompatibles avec NeonDB
  Demande confirmation si des extensions sont absentes en cible

Étape 1/2 — Application du schéma DDL en cible
  pg_dump --schema-only source → DDL.sql filtré → psql target
  (tables, types enum, index, contraintes, séquences créés en cible)
  Les extensions gérées nativement par NeonDB sont retirées du DDL

Étape 2/2 — Migration des données (upsert)
  Lecture source par batch → INSERT ON CONFLICT DO UPDATE en cible
  Réinitialisation des séquences
```

Si les tables existent déjà en cible (migration incrémentale), utiliser `--skip-schema` pour passer directement à l'étape 2 (la vérification des extensions est toujours effectuée).

---

## Dry-run — Vérifier avant de migrer

Le mode `--dry-run` se connecte à la DB **source uniquement**, liste toutes les tables dans l'ordre de migration (tri topologique FK) et affiche le nombre de lignes. **Rien n'est écrit en cible, le DDL n'est pas appliqué.**

```bash
./scripts/migrate-db.sh --dry-run
```

Exemple de sortie :

```
=== DRY-RUN — Résumé des tables à migrer ===
Aucune donnée ne sera écrite en cible.

   #  Table                              Lignes source  Colonnes  FKs
----  ---------------------------------  -------------  --------  ----
   1  "public"."BackofficeUser"                    12        14     0
   2  "public"."Artist"                           347        22     1
   3  "auth"."Session"                            891         8     1
   4  "marketplace"."Artwork"                   1 204        31     3
  ...
----  ---------------------------------  -------------  --------  ----
TOTAL  87 tables                              124 389     1 842

(Dry-run: aucune donnée écrite — relancez sans --dry-run pour migrer)
```

Dry-run sur des schémas spécifiques :

```bash
./scripts/migrate-db.sh --dry-run --schemas=public,marketplace
```

---

## Migration réelle

Le script utilise exclusivement le mode **upsert** :
- Les lignes source sont insérées en cible
- Si une ligne existe déjà (même PK), elle est mise à jour
- Les données cible absentes de la source sont **conservées**
- Aucune donnée n'est jamais supprimée

```bash
./scripts/migrate-db.sh
```

---

## Options disponibles

| Option | Valeur | Défaut | Description |
|---|---|---|---|
| `--schemas` | `public,landing,...` | tous les schémas | Restreindre à certains schémas |
| `--exclude-tables` | `schema.table,...` | aucune | Exclure des tables spécifiques (DDL + données) |
| `--batch` | entier | `500` | Nombre de lignes lues par batch |
| `--dry-run` | — | off | Affiche les tables sans écrire (pas de DDL) |
| `--skip-schema` | — | off | Saute l'étape DDL (tables supposées présentes) |
| `--help` | — | — | Affiche l'aide |

---

## Schémas gérés

Les schémas suivants sont inclus par défaut (définis dans `prisma/schema.prisma`) :

- `public`
- `auth`
- `landing`
- `marketplace`
- `blockchain`
- `landingUi`
- `landingUgc`
- `backoffice`
- `statistics`

Pour migrer seulement certains schémas (DDL + données) :

```bash
./scripts/migrate-db.sh --schemas=public,auth
```

---

## Exemples complets

```bash
# 1. Vérifier ce qui sera migré (dry-run global)
./scripts/migrate-db.sh --dry-run

# 2. Dry-run sur le schéma marketplace seulement
./scripts/migrate-db.sh --dry-run --schemas=marketplace

# 3. Migration complète depuis zéro (crée le schéma DDL + copie les données)
./scripts/migrate-db.sh

# 4. Migration avec tables déjà présentes en cible (saute l'étape DDL)
./scripts/migrate-db.sh --skip-schema

# 5. Migration d'un sous-ensemble de schémas
./scripts/migrate-db.sh --schemas=public,auth,marketplace

# 6. Migration avec gros batch (serveurs puissants)
./scripts/migrate-db.sh --batch=2000

# 7. Exclure des tables spécifiques (ex: logs, sessions, données volumineuses)
./scripts/migrate-db.sh --exclude-tables=public.AuditLog,auth.sessions

# 8. Combiner exclusions et restriction de schémas
./scripts/migrate-db.sh --schemas=public,marketplace --exclude-tables=public.SpatialRefSys

# 9. Passer les URLs directement sans fichier .env.migration
SOURCE_DATABASE_URL="postgresql://..." TARGET_DATABASE_URL="postgresql://..." \
  ./scripts/migrate-db.sh --dry-run

# 10. Ré-appliquer uniquement le DDL sans migrer les données (debug schéma)
SOURCE_DATABASE_URL="postgresql://..." TARGET_DATABASE_URL="postgresql://..." \
  pg_dump --schema-only --no-owner --no-acl --clean --if-exists "$SOURCE_DATABASE_URL" \
  | psql "$TARGET_DATABASE_URL"
```

---

## Comportement technique

- **Vérification extensions** : compare `pg_extension` source vs cible, identifie les extensions manquantes et indique si elles sont disponibles sur NeonDB ou non. Demande confirmation avant de continuer si des extensions sont absentes.
- **Étape DDL** : `pg_dump --schema-only --no-owner --no-acl --clean --if-exists` extrait la structure complète. Le DDL est ensuite **filtré** pour retirer les `CREATE/DROP EXTENSION` des extensions gérées nativement par NeonDB (`plpgsql`, `neon`, `pg_stat_statements`, etc.) qui échoueraient avec une erreur de permission.
- **Ordre de migration** : tri topologique des dépendances FK (tables référencées insérées en premier)
- **Cycles FK** : tables avec dépendances circulaires migrées en dernier (avertissement affiché)
- **Séquences** : resynchronisées au `MAX` de chaque colonne après migration
- **Batching** : données lues par chunks de `--batch` lignes pour ne pas saturer la RAM
- **Mots de passe** : masqués dans tous les logs (`****`)

## Spécificités Supabase → NeonDB

| Sujet | Comportement |
|---|---|
| Extensions `neon`, `neon_utils` | Retirées du DDL automatiquement (inexistantes sur Supabase, ignorées) |
| Extensions `plpgsql`, `pg_stat_statements` | Retirées du DDL (pré-installées sur NeonDB, non recrëables) |
| Extensions `uuid-ossp`, `pgcrypto`, `pg_trgm`, `unaccent` | Disponibles sur NeonDB — créées si manquantes (commande affichée) |
| Schéma `auth` (Supabase Auth) | Migré si inclus dans `--schemas` — vérifier la compatibilité avec l'auth NeonDB |
| Rôles Supabase (`anon`, `authenticated`, `service_role`) | Non migrés (`--no-acl`) — à recréer manuellement si utilisés dans des RLS |

---

## Sécurité

- Ne commitez jamais `.env.migration` — ajoutez-le à `.gitignore`
- Le mode `truncate` est **irréversible** — sauvegardez d'abord :
  ```bash
  pg_dump "$TARGET_DATABASE_URL" > backup-$(date +%Y%m%d-%H%M).sql
  ```
- Le dry-run ne se connecte **jamais** à la DB cible
- L'étape DDL utilise `--no-owner` et `--no-acl` — les droits existants en cible sont préservés
