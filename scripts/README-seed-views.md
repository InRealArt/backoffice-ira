# Scripts de génération de données de test pour les statistiques de vues

Ces scripts permettent de générer des données de test pour les tables `PhysicalArtworkView` et `PhysicalArtworkViewStat`.

## 📋 Description

Les scripts génèrent :

- **Vues individuelles** : Enregistrements dans `PhysicalArtworkView` avec des dates aléatoires sur les 6 derniers mois
- **Agrégations mensuelles** : Statistiques dans `PhysicalArtworkViewStat` regroupées par artwork, année et mois

## 🚀 Utilisation

### Option 1 : Script SQL (recommandé pour PostgreSQL)

```bash
# Via psql directement
psql $DATABASE_URL -f scripts/seed-physical-artwork-views.sql

# Ou via Prisma
npx prisma db execute --file scripts/seed-physical-artwork-views.sql --schema prisma/schema.prisma
```

### Option 2 : Script TypeScript (plus flexible)

```bash
# Avec tsx (si installé)
npx tsx scripts/seed-physical-artwork-views.ts

# Si vous utilisez Supabase avec un pooler, utilisez la connexion directe
USE_DIRECT_PRISMA=1 npx tsx scripts/seed-physical-artwork-views.ts

# Ou avec ts-node
npx ts-node scripts/seed-physical-artwork-views.ts
```

**Note** : Si vous rencontrez des erreurs de connexion avec Supabase, utilisez `USE_DIRECT_PRISMA=1` pour utiliser la connexion directe au lieu du pooler.

## ⚙️ Configuration

### Script SQL

Le script SQL détecte automatiquement les `PhysicalItem` existants. Si aucun n'est trouvé, il crée des données avec des IDs fictifs (1-10).

### Script TypeScript

Vous pouvez modifier les constantes en haut du fichier :

```typescript
const MONTHS_TO_GENERATE = 6; // Nombre de mois de données
const MIN_VIEWS_PER_MONTH = 10; // Minimum de vues par mois
const MAX_VIEWS_PER_MONTH = 200; // Maximum de vues par mois
```

## 📊 Données générées

Pour chaque `PhysicalItem` (ou artwork fictif) :

- **6 mois** de données historiques
- Entre **10 et 200 vues** par mois (aléatoire)
- **Dates aléatoires** réparties sur chaque mois
- **IPs et User-Agents variés** pour simuler des visiteurs réels
- **Agrégations mensuelles** automatiques

## 🔍 Vérification

Après l'exécution, les scripts affichent :

- Nombre total de vues créées
- Nombre d'agrégations mensuelles
- Nombre d'artworks uniques
- Aperçu des agrégations

### Requêtes de vérification manuelle

```sql
-- Nombre total de vues
SELECT COUNT(*) FROM statistics."artworkViews";

-- Nombre d'agrégations
SELECT COUNT(*) FROM statistics."artworkViewStats";

-- Vues par artwork
SELECT
    "artworkId",
    COUNT(*) as total_views
FROM statistics."artworkViews"
GROUP BY "artworkId"
ORDER BY total_views DESC;

-- Statistiques mensuelles par artwork
SELECT
    "artworkId",
    "year",
    "month",
    "viewCount"
FROM statistics."artworkViewStats"
ORDER BY "artworkId", "year" DESC, "month" DESC;
```

## 🧹 Nettoyage

Pour supprimer les données de test :

```sql
-- Supprimer toutes les vues
TRUNCATE TABLE statistics."artworkViews" CASCADE;

-- Supprimer toutes les agrégations
TRUNCATE TABLE statistics."artworkViewStats" CASCADE;
```

## 📝 Notes

- Les scripts utilisent le schéma `statistics` pour les tables de statistiques
- Les `PhysicalItem` doivent être dans le schéma `backoffice`
- Les données sont générées de manière aléatoire mais réaliste
- Les agrégations utilisent `ON CONFLICT` pour éviter les doublons

## ⚠️ Attention

- Les scripts peuvent prendre du temps si vous avez beaucoup de `PhysicalItem`
- Le script SQL limite à 20 items pour éviter la surcharge
- Les données générées sont **purement factices** et ne doivent pas être utilisées en production
