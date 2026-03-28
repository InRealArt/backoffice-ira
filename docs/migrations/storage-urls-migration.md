# Migration des URLs de stockage — Firebase vers Cloudflare R2

**Date**: 2026-03-28
**Statut**: À exécuter manuellement en production (après validation en staging)
**Impact**: Normalise toutes les URLs absolues en chemins relatifs pour centraliser le point d'accès

## Contexte

Le système de stockage d'images a migré de Firebase Storage vers Cloudflare R2. Pour une gestion centralisée des URLs, le code stocke désormais des **chemins relatifs** en base de données au lieu d'URLs absolues. Cette migration nettoie les URLs existantes qui sont encore stockées sous forme absolue.

## Deux types d'URLs legacy à normaliser

### 1. Firebase Storage
Format: `https://firebasestorage.googleapis.com/v0/b/inrealartlanding-3a094.appspot.com/o/backoffice%2Fartist_categories%2Fchoix_inrealart.webp?alt=media&token=bafca2be-4164-4f01-b957-1bc1ed66bb58`

**Extraction du chemin**: `backoffice/artist_categories/choix_inrealart.webp`

### 2. Cloudflare R2 (absolu ou custom domain)
Formats:
- `https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/artists/Gilles Bruno/landing/test-cloudfare-3.webp`
- `https://images.inrealart.com/artists/Gilles Bruno/landing/test-cloudfare-3.webp`

**Extraction du chemin**: `artists/Gilles Bruno/landing/test-cloudfare-3.webp`

## Tables à migrer

### Schéma `public`

#### Artist
- Champs: `imageUrl`, `backgroundImage`, `featuredArtwork`

```sql
-- Normaliser Firebase Storage → chemin relatif
UPDATE "public"."Artist"
SET "imageUrl" = regexp_replace(
  regexp_replace(
    "imageUrl",
    '.*/o/([^?]+)\?.*',  -- Extraire le contenu entre /o/ et ?
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "imageUrl" LIKE 'https://firebasestorage.googleapis.com%';

-- Normaliser R2 public URL → chemin relatif
UPDATE "public"."Artist"
SET "imageUrl" = replace("imageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "imageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

-- Normaliser R2 custom domain → chemin relatif
UPDATE "public"."Artist"
SET "imageUrl" = replace("imageUrl", 'https://images.inrealart.com/', '')
WHERE "imageUrl" LIKE 'https://images.inrealart.com%';

-- Répéter pour backgroundImage
UPDATE "public"."Artist"
SET "backgroundImage" = regexp_replace(
  regexp_replace(
    "backgroundImage",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "backgroundImage" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "public"."Artist"
SET "backgroundImage" = replace("backgroundImage", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "backgroundImage" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "public"."Artist"
SET "backgroundImage" = replace("backgroundImage", 'https://images.inrealart.com/', '')
WHERE "backgroundImage" LIKE 'https://images.inrealart.com%';

-- Répéter pour featuredArtwork
UPDATE "public"."Artist"
SET "featuredArtwork" = regexp_replace(
  regexp_replace(
    "featuredArtwork",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "featuredArtwork" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "public"."Artist"
SET "featuredArtwork" = replace("featuredArtwork", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "featuredArtwork" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "public"."Artist"
SET "featuredArtwork" = replace("featuredArtwork", 'https://images.inrealart.com/', '')
WHERE "featuredArtwork" LIKE 'https://images.inrealart.com%';
```

#### ArtistCategory
- Champs: `imageUrl`, `backgroundImage`, `featuredArtwork`

```sql
-- Firebase → relatif
UPDATE "public"."ArtistCategory"
SET "imageUrl" = regexp_replace(
  regexp_replace(
    "imageUrl",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "imageUrl" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "public"."ArtistCategory"
SET "imageUrl" = replace("imageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "imageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "public"."ArtistCategory"
SET "imageUrl" = replace("imageUrl", 'https://images.inrealart.com/', '')
WHERE "imageUrl" LIKE 'https://images.inrealart.com%';

-- Répéter pour backgroundImage et featuredArtwork (même pattern)
UPDATE "public"."ArtistCategory"
SET "backgroundImage" = regexp_replace(
  regexp_replace(
    "backgroundImage",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "backgroundImage" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "public"."ArtistCategory"
SET "backgroundImage" = replace("backgroundImage", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "backgroundImage" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "public"."ArtistCategory"
SET "backgroundImage" = replace("backgroundImage", 'https://images.inrealart.com/', '')
WHERE "backgroundImage" LIKE 'https://images.inrealart.com%';

UPDATE "public"."ArtistCategory"
SET "featuredArtwork" = regexp_replace(
  regexp_replace(
    "featuredArtwork",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "featuredArtwork" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "public"."ArtistCategory"
SET "featuredArtwork" = replace("featuredArtwork", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "featuredArtwork" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "public"."ArtistCategory"
SET "featuredArtwork" = replace("featuredArtwork", 'https://images.inrealart.com/', '')
WHERE "featuredArtwork" LIKE 'https://images.inrealart.com%';
```

### Schéma `landing`

#### Exhibition
- Champ: `imageUrl`

```sql
UPDATE "landing"."Exhibition"
SET "imageUrl" = regexp_replace(
  regexp_replace(
    "imageUrl",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "imageUrl" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."Exhibition"
SET "imageUrl" = replace("imageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "imageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."Exhibition"
SET "imageUrl" = replace("imageUrl", 'https://images.inrealart.com/', '')
WHERE "imageUrl" LIKE 'https://images.inrealart.com%';
```

#### LandingArtist
- Champs: `imageUrl`, `secondaryImageUrl`, `imageArtistStudio`

```sql
-- Firebase → relatif pour imageUrl
UPDATE "landing"."LandingArtist"
SET "imageUrl" = regexp_replace(
  regexp_replace(
    "imageUrl",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "imageUrl" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."LandingArtist"
SET "imageUrl" = replace("imageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "imageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."LandingArtist"
SET "imageUrl" = replace("imageUrl", 'https://images.inrealart.com/', '')
WHERE "imageUrl" LIKE 'https://images.inrealart.com%';

-- Même pattern pour secondaryImageUrl
UPDATE "landing"."LandingArtist"
SET "secondaryImageUrl" = regexp_replace(
  regexp_replace(
    "secondaryImageUrl",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "secondaryImageUrl" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."LandingArtist"
SET "secondaryImageUrl" = replace("secondaryImageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "secondaryImageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."LandingArtist"
SET "secondaryImageUrl" = replace("secondaryImageUrl", 'https://images.inrealart.com/', '')
WHERE "secondaryImageUrl" LIKE 'https://images.inrealart.com%';

-- Même pattern pour imageArtistStudio
UPDATE "landing"."LandingArtist"
SET "imageArtistStudio" = regexp_replace(
  regexp_replace(
    "imageArtistStudio",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "imageArtistStudio" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."LandingArtist"
SET "imageArtistStudio" = replace("imageArtistStudio", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "imageArtistStudio" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."LandingArtist"
SET "imageArtistStudio" = replace("imageArtistStudio", 'https://images.inrealart.com/', '')
WHERE "imageArtistStudio" LIKE 'https://images.inrealart.com%';
```

#### PresaleArtwork
- Champs: `imageUrl`, `mockupUrls` (JSON), `imageArtistStudio`

```sql
-- imageUrl
UPDATE "landing"."PresaleArtwork"
SET "imageUrl" = regexp_replace(
  regexp_replace(
    "imageUrl",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "imageUrl" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."PresaleArtwork"
SET "imageUrl" = replace("imageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "imageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."PresaleArtwork"
SET "imageUrl" = replace("imageUrl", 'https://images.inrealart.com/', '')
WHERE "imageUrl" LIKE 'https://images.inrealart.com%';

-- imageArtistStudio (même pattern)
UPDATE "landing"."PresaleArtwork"
SET "imageArtistStudio" = regexp_replace(
  regexp_replace(
    "imageArtistStudio",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "imageArtistStudio" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."PresaleArtwork"
SET "imageArtistStudio" = replace("imageArtistStudio", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "imageArtistStudio" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."PresaleArtwork"
SET "imageArtistStudio" = replace("imageArtistStudio", 'https://images.inrealart.com/', '')
WHERE "imageArtistStudio" LIKE 'https://images.inrealart.com%';

-- mockupUrls (JSON avec array d'objets { name, url })
-- ⚠️ Cette requête nécessite une fonction PostgreSQL custom pour parser/re-sérialiser le JSON
-- Voir section "Migration du JSON mockupUrls" ci-dessous
```

#### SeoPost
- Champ: `mainImageUrl`

```sql
UPDATE "landing"."SeoPost"
SET "mainImageUrl" = regexp_replace(
  regexp_replace(
    "mainImageUrl",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "mainImageUrl" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."SeoPost"
SET "mainImageUrl" = replace("mainImageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "mainImageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."SeoPost"
SET "mainImageUrl" = replace("mainImageUrl", 'https://images.inrealart.com/', '')
WHERE "mainImageUrl" LIKE 'https://images.inrealart.com%';
```

#### Team
- Champs: `photoUrl1`, `photoUrl2`

```sql
-- photoUrl1
UPDATE "landing"."Team"
SET "photoUrl1" = regexp_replace(
  regexp_replace(
    "photoUrl1",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "photoUrl1" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."Team"
SET "photoUrl1" = replace("photoUrl1", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "photoUrl1" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."Team"
SET "photoUrl1" = replace("photoUrl1", 'https://images.inrealart.com/', '')
WHERE "photoUrl1" LIKE 'https://images.inrealart.com%';

-- photoUrl2 (même pattern)
UPDATE "landing"."Team"
SET "photoUrl2" = regexp_replace(
  regexp_replace(
    "photoUrl2",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "photoUrl2" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landing"."Team"
SET "photoUrl2" = replace("photoUrl2", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "photoUrl2" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landing"."Team"
SET "photoUrl2" = replace("photoUrl2", 'https://images.inrealart.com/', '')
WHERE "photoUrl2" LIKE 'https://images.inrealart.com%';
```

### Schéma `landingUgc`

#### LandingUgcArtistProfile
- Champs: `profileImageUrl`, `mediaUrls` (JSON array)

```sql
-- profileImageUrl
UPDATE "landingUgc"."LandingUgcArtistProfile"
SET "profileImageUrl" = regexp_replace(
  regexp_replace(
    "profileImageUrl",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "profileImageUrl" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "landingUgc"."LandingUgcArtistProfile"
SET "profileImageUrl" = replace("profileImageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "profileImageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "landingUgc"."LandingUgcArtistProfile"
SET "profileImageUrl" = replace("profileImageUrl", 'https://images.inrealart.com/', '')
WHERE "profileImageUrl" LIKE 'https://images.inrealart.com%';

-- mediaUrls (JSON array de strings)
-- ⚠️ Nécessite une fonction PostgreSQL custom
-- Voir section "Migration du JSON mediaUrls" ci-dessous
```

### Schéma `backoffice`

#### PhysicalItemImage
- Champ: `imageUrl`

```sql
UPDATE "backoffice"."PhysicalItemImage"
SET "imageUrl" = regexp_replace(
  regexp_replace(
    "imageUrl",
    '.*/o/([^?]+)\?.*',
    '\1'
  ),
  '%2F',
  '/',
  'g'
)
WHERE "imageUrl" LIKE 'https://firebasestorage.googleapis.com%';

UPDATE "backoffice"."PhysicalItemImage"
SET "imageUrl" = replace("imageUrl", 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', '')
WHERE "imageUrl" LIKE 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev%';

UPDATE "backoffice"."PhysicalItemImage"
SET "imageUrl" = replace("imageUrl", 'https://images.inrealart.com/', '')
WHERE "imageUrl" LIKE 'https://images.inrealart.com%';
```

## Migration du JSON — mockupUrls et mediaUrls

Certains champs stockent des URLs dans des structures JSON imbriquées. La migration SQL pure est limitée pour ces cas.

### Option 1: Script Node.js (Recommandé)

Créer un script `scripts/migrate-storage-urls.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { toRelativePath } from '@/lib/r2/url'

async function migrateStorageUrls() {
  console.log('🚀 Démarrage de la migration des URLs de stockage...')

  try {
    // Migration des mockupUrls dans PresaleArtwork
    const presaleArtworks = await prisma.presaleArtwork.findMany()
    for (const artwork of presaleArtworks) {
      if (artwork.mockupUrls) {
        try {
          const mockups = JSON.parse(artwork.mockupUrls)
          const normalizedMockups = mockups.map((m: any) => ({
            ...m,
            url: toRelativePath(m.url) ?? m.url
          }))
          await prisma.presaleArtwork.update({
            where: { id: artwork.id },
            data: { mockupUrls: JSON.stringify(normalizedMockups) }
          })
        } catch (e) {
          console.warn(`⚠️ Erreur parsing mockupUrls pour artwork ${artwork.id}:`, e)
        }
      }
    }
    console.log(`✅ ${presaleArtworks.length} PresaleArtwork normalisés`)

    // Migration des mediaUrls dans LandingUgcArtistProfile
    const ugcProfiles = await prisma.landingUgcArtistProfile.findMany()
    for (const profile of ugcProfiles) {
      if (profile.mediaUrls) {
        try {
          const mediaUrls = JSON.parse(profile.mediaUrls)
          const normalizedMediaUrls = Array.isArray(mediaUrls)
            ? mediaUrls.map(url => toRelativePath(url) ?? url)
            : mediaUrls
          await prisma.landingUgcArtistProfile.update({
            where: { id: profile.id },
            data: { mediaUrls: JSON.stringify(normalizedMediaUrls) }
          })
        } catch (e) {
          console.warn(`⚠️ Erreur parsing mediaUrls pour profile ${profile.id}:`, e)
        }
      }
    }
    console.log(`✅ ${ugcProfiles.length} LandingUgcArtistProfile normalisés`)

    console.log('✅ Migration complète!')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateStorageUrls()
```

Exécution:
```bash
npx tsx scripts/migrate-storage-urls.ts
```

### Option 2: Fonction PostgreSQL (Avancé)

```sql
-- Créer une fonction pour normaliser les URLs dans un JSON object
CREATE OR REPLACE FUNCTION normalize_json_urls(json_data JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB := json_data;
  item JSONB;
BEGIN
  -- Remplacer les Firebase URLs par des chemins relatifs
  result := jsonb_set(result, '{url}',
    to_jsonb(regexp_replace(
      regexp_replace(
        result->>'url',
        '.*/o/([^?]+)\?.*',
        '\1'
      ),
      '%2F',
      '/',
      'g'
    ))
  );

  -- Puis les R2 URLs
  result := jsonb_set(result, '{url}',
    to_jsonb(replace(result->>'url', 'https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/', ''))
  );

  result := jsonb_set(result, '{url}',
    to_jsonb(replace(result->>'url', 'https://images.inrealart.com/', ''))
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Appliquer la fonction
UPDATE "landing"."PresaleArtwork"
SET "mockupUrls" = jsonb_set("mockupUrls", '{0}', normalize_json_urls("mockupUrls"->0))
WHERE "mockupUrls" LIKE '%firebasestorage%'
   OR "mockupUrls" LIKE '%r2.dev%'
   OR "mockupUrls" LIKE '%images.inrealart.com%';
```

## Plan d'exécution (Recommandé)

1. **Staging**: Exécuter les requêtes SQL simples (non-JSON) sur la BD de staging
2. **Validation**: Vérifier les URLs avec `SELECT * FROM "public"."Artist" WHERE "imageUrl" LIKE 'https://%'`
3. **Production**: Exécuter dans une transaction avec ROLLBACK en cas d'erreur

```sql
BEGIN;
  -- Exécuter tous les UPDATEs ici
COMMIT;
-- Si erreur: ROLLBACK;
```

4. **Script Node.js** pour les champs JSON (mockupUrls, mediaUrls)

## Vérification post-migration

```sql
-- Vérifier qu'il ne reste plus d'URLs absolues
SELECT COUNT(*) FROM "public"."Artist"
WHERE "imageUrl" LIKE 'https://%'
   OR "backgroundImage" LIKE 'https://%'
   OR "featuredArtwork" LIKE 'https://%';

-- Devrait retourner: 0

-- Vérifier un exemple de chemin relatif
SELECT "imageUrl" FROM "public"."Artist"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" != ''
LIMIT 1;

-- Devrait retourner quelque chose comme: artists/Jean Dupont/profile.webp
```

## Notes importantes

- ⚠️ **Ne pas exécuter en production sans d'abord tester en staging**
- ⚠️ **Faire une sauvegarde complète avant migration**
- ⚠️ Le `regexp_replace` avec `%2F` remplace les URL-encoded forward slashes. Vérifier les résultats.
- ✅ Les URLs relatives en DB seront automatiquement converties vers R2 à l'affichage via `getImageUrl()`
- ✅ La rétrocompatibilité est assurée — les anciennes URLs absolues en DB continuent à fonctionner
