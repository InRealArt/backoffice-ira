# backup-db — Sauvegarde PostgreSQL

Script de sauvegarde complète d'une base PostgreSQL vers un fichier SQL horodaté.
Les credentials ne sont **jamais** passés en argument CLI — ils sont lus depuis un fichier `.env` dédié.

---

## Prérequis

| Outil | Rôle | Installation |
|---|---|---|
| `pg_dump` + `psql` | Dump et connexion | `apt install postgresql-client` |
| `gzip` | Compression (optionnel) | pré-installé sur la plupart des systèmes |

---

## Configuration des credentials

### 1. Créer le fichier `.env.backup`

```bash
touch .env.backup
chmod 600 .env.backup   # lecture réservée à votre user
```

Contenu minimal :

```env
BACKUP_DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Le script accepte n'importe quel nom de fichier `.env` — un fichier par base si besoin :

```
.env.backup          ← DB source par défaut
.env.backup.source   ← alias explicite source
.env.backup.target   ← DB cible (NeonDB, etc.)
.env.migration       ← réutilise le fichier de migration (contient SOURCE_DATABASE_URL)
```

> Le script lit `BACKUP_DATABASE_URL` dans le fichier spécifié.
> Si vous pointez vers `.env.migration`, renommez ou ajoutez la variable :
> ```env
> BACKUP_DATABASE_URL=postgresql://...   # = votre SOURCE ou TARGET
> ```

### 2. Vérifier que `.env.backup` est dans `.gitignore`

```bash
echo ".env.backup*" >> .gitignore
```

---

## Utilisation

### Backup complet (tous schémas)

```bash
./scripts/backup-db.sh
# Utilise .env.backup par défaut
```

### Backup avec un fichier .env spécifique

```bash
./scripts/backup-db.sh --env=.env.backup.source
./scripts/backup-db.sh --env=.env.migration
```

### Backup de schémas spécifiques

```bash
./scripts/backup-db.sh --schemas=public,marketplace,backoffice
```

### Backup sans compression (fichier .sql lisible directement)

```bash
./scripts/backup-db.sh --no-compress
```

### Backup vers un répertoire spécifique

```bash
./scripts/backup-db.sh --output=/mnt/backups
./scripts/backup-db.sh --output=~/Desktop
```

---

## Options disponibles

| Option | Valeur | Défaut | Description |
|---|---|---|---|
| `--env` | chemin fichier | `.env.backup` | Fichier contenant `BACKUP_DATABASE_URL` |
| `--schemas` | `public,landing,...` | tous | Restreindre à certains schémas |
| `--output` | répertoire | `./backups` | Destination du fichier |
| `--no-compress` | — | off | Fichier `.sql` au lieu de `.sql.gz` |
| `--sslmode` | `require` / `verify-full` / `disable` | `require` | Mode SSL |
| `--help` | — | — | Affiche l'aide |

---

## Objets sauvegardés

`pg_dump` capture **tous** les objets de la base :

| Objet | Inclus |
|---|---|
| Tables et colonnes | ✅ |
| Types (enum, composite, domaines) | ✅ |
| Index (simples, uniques, partiels) | ✅ |
| Contraintes (PK, FK, UNIQUE, CHECK) | ✅ |
| Séquences (`CREATE SEQUENCE`) | ✅ |
| Vues et vues matérialisées | ✅ |
| Fonctions et procédures stockées | ✅ |
| Triggers et règles | ✅ |
| Extensions (`CREATE EXTENSION`) | ✅ |
| Données (toutes les tables) | ✅ |
| **setval(MAX+1) pour autoincrement** | ✅ (patch injecté en fin de fichier) |

Le dump utilise `INSERT INTO table (col1, col2) VALUES (...)` — plus portable que `COPY`, compatible avec tout client SQL.

---

## Séquences et autoincrement

Après restauration, les séquences PostgreSQL doivent pointer **au-delà du MAX existant** pour éviter les collisions d'ID. Le script injecte automatiquement en fin de fichier :

```sql
-- Resynchronisation des séquences au MAX+1
SELECT setval('public.Artist_id_seq', COALESCE((SELECT MAX(id) FROM public."Artist"), 0) + 1, false);
SELECT setval('marketplace.Order_id_seq', COALESCE((SELECT MAX(id) FROM marketplace."Order"), 0) + 1, false);
-- ... une ligne par séquence détectée
```

Ces `setval` s'exécutent **après** l'insertion de toutes les données, donc la valeur calculée est correcte.

---

## Procédure recommandée avant une migration

```bash
# 1. Sauvegarder la source
./scripts/backup-db.sh --env=.env.backup \
  --schemas=backoffice,landing,landingUgc,landingUi,marketplace,public,statistics

# 2. Vérifier que le fichier est bien créé
ls -lh backups/

# 3. Lancer la migration
./scripts/migrate-db.sh \
  --schemas=backoffice,landing,landingUgc,landingUi,marketplace,public,statistics
```

---

## Restaurer un backup

```bash
# Fichier compressé (.sql.gz)
gunzip -c backups/backup_host_db_20260401_143022.sql.gz | psql "$TARGET_DATABASE_URL"

# Fichier non compressé (.sql)
psql "$TARGET_DATABASE_URL" < backups/backup_host_db_20260401_143022.sql
```

---

## Sécurité

- **Ne committez jamais** `.env.backup` ni les fichiers `backups/*.sql.gz`
- Vérifiez que les deux sont dans `.gitignore` :
  ```
  .env.backup*
  backups/
  ```
- Permissions recommandées sur le fichier `.env` :
  ```bash
  chmod 600 .env.backup
  ```
- Le script avertit si les permissions sont trop ouvertes (différentes de `600`/`400`)
