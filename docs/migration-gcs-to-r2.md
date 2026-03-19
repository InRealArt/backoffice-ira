# Migration Firebase Storage → Cloudflare R2

**Projet :** backoffice-shopify (InRealArt)
**Bucket source :** `inrealartlanding-3a094.appspot.com`
**Date de rédaction :** 2026-03-19

---

## Vue d'ensemble

### Objectif

Remplacer Firebase Storage (Google Cloud Storage sous-jacent) par Cloudflare R2 comme service de stockage d'images pour le backoffice InRealArt.

### Pourquoi migrer

| Critère | Firebase Storage | Cloudflare R2 |
|---|---|---|
| URLs d'accès | Tokens expirables (`?alt=media&token=...`) | URLs stables et permanentes |
| Credentials client-side | 7 variables `NEXT_PUBLIC_FIREBASE_*` dans le bundle JS | Aucune credential côté client |
| Coût egress | Facturé par GCP | Gratuit (0 $ d'egress) |
| Auth anonyme requise | Oui (`signInAnonymously` avant chaque upload) | Non |
| Intégration Next.js | Client-only SDK, force `"use client"` | Presigned URLs depuis Server Actions |
| CDN | Via Firebase Hosting ou CDN tiers | CDN Cloudflare natif (anycast mondial) |

### Périmètre des fichiers concernés

**Côté stockage :**
- `lib/firebase/config.ts` — initialisation Firebase app + storage + auth
- `lib/firebase/storage.ts` — 11 fonctions d'upload/suppression

**Côté consommateurs (~14 composants) :**
```
app/(admin)/landing/presaleArtworks/PresaleArtworksClient.tsx
app/(admin)/landing/presaleArtworks/bulk-add/BulkAddForm.tsx
app/(admin)/landing/ugc/artist-profiles/_components/UgcArtistProfileForm.tsx
app/(admin)/landing/landingArtists/[id]/edit/LandingArtistEditForm.tsx
app/(admin)/landing/landingArtists/create/CreateLandingArtistForm.tsx
app/(admin)/dataAdministration/artists/[id]/edit/ArtistEditForm.tsx
app/(admin)/dataAdministration/artists/create/CreateArtistForm.tsx
app/components/PresaleArtworkForm/PresaleArtworkForm.tsx
app/components/art/ArtworkForm/components/FirebaseImageUpload.tsx
app/components/art/ArtworkForm/useArtworkForm.ts
app/[locale]/(protected)/art/components/ArtworkForm/components/FirebaseImageUpload.tsx
app/[locale]/(protected)/art/components/ArtworkForm/useArtworkForm.ts
app/[locale]/(protected)/art/edit-artist-profile/EditArtistProfileForm.tsx
app/[locale]/(protected)/art/create-artist-profile/CreateArtistProfileForm.tsx
```

**Structure de paths dans le bucket (à conserver à l'identique dans R2) :**
```
artists/{Prenom Nom}/profile.webp
artists/{Prenom Nom}/{Prenom Nom}.webp
artists/{Prenom Nom}/{Prenom Nom}_secondary.webp
artists/{Prenom Nom}/{Prenom Nom}_studio.webp
artists/{Prenom Nom}/landing/{nom-oeuvre}.webp
artists/{Prenom Nom}/marketplace/{type}/{fichier}-{timestamp}.webp
artists/{Prenom Nom}/mockups/{fichier}.webp
artistsUGC/{folderName}/{fileName}.webp
marketplace/{artistPath}/{itemPath}/{prefix}-{fichier}
```

---

## Phase 1 — Préparer le Service Account GCP

Cloudflare R2 "Migrate files" attend un fichier JSON Service Account GCP standard (contenant `private_key`). Ce n'est **pas** des HMAC keys.

### Étapes

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Sélectionner le projet **`inrealartlanding-3a094`**
3. Navigation : **IAM & Admin** > **Service Accounts**
4. Cliquer **Create Service Account**
   - Nom : `cloudflare-r2-migration`
   - Description : `Migration read-only access for Cloudflare R2 Migrate files`
5. Cliquer **Continue**, puis assigner le rôle :
   - **Storage Object Viewer** (`roles/storage.objectViewer`) — lecture seule sur les objets
6. Cliquer **Done**
7. Dans la liste, cliquer sur le service account créé
8. Onglet **Keys** > **Add Key** > **Create new key**
9. Format : **JSON** — cliquer **Create**
10. Le fichier `.json` se télécharge automatiquement

### Contenu attendu du fichier JSON

```json
{
  "type": "service_account",
  "project_id": "inrealartlanding-3a094",
  "private_key_id": "...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n",
  "client_email": "cloudflare-r2-migration@inrealartlanding-3a094.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

La présence de `private_key` est ce que Cloudflare vérifie. L'erreur *"Could not find private_key in the credentials file"* apparaît si on uploade des HMAC keys ou un fichier mal formé.

> **Securité :** Ce fichier JSON est une credential sensible. Ne jamais le committer dans le repo. Le supprimer après migration.

---

## Phase 2 — Migration Cloudflare R2 (interface "Migrate files")

### Prérequis

- Avoir un compte Cloudflare avec R2 activé
- Avoir le fichier JSON Service Account (Phase 1)

### Étape 1 — Source bucket rules

Dans le dashboard Cloudflare > **R2** > **Migrate files** :

| Champ | Valeur |
|---|---|
| Source Bucket Provider | **Google Cloud Storage** |
| Bucket name | `inrealartlanding-3a094.appspot.com` |
| Credentials | Uploader le fichier JSON Service Account |

**Define rules (optionnel) :** Possibilité de filtrer par prefix pour migrer par lot.

| Prefix | Contenu |
|---|---|
| `artists/` | Profils artistes, images landing, marketplace, mockups |
| `artistsUGC/` | User-generated content artistes |
| `marketplace/` | Images œuvres marketplace (chemin legacy) |

Pour une migration complète, laisser les rules vides (tout migrer).

### Étape 2 — Destination R2 bucket

- Sélectionner un bucket R2 existant **ou** en créer un nouveau
- Nom suggéré : `inrealart-images`
- Region : **EEUR** (Eastern Europe) ou **WEUR** selon la localisation principale des artistes

### Étape 3 — Review and migrate

- Vérifier le résumé (nombre d'objets estimé, règles de filtrage)
- Lancer la migration
- Cloudflare copie les objets en préservant les paths exacts

> La migration ne supprime pas les fichiers source dans GCS. Les deux buckets coexistent pendant la période de transition.

---

## Phase 3 — Configurer l'accès public R2

### Option A — Domaine custom ✅ Recommandé pour la production

**Coût : gratuit** — le domaine `inrealart.com` est chez OVH. Il n'est pas nécessaire de le transférer chez Cloudflare. Il suffit d'ajouter un enregistrement CNAME chez OVH pour déléguer uniquement le sous-domaine `images.inrealart.com` vers R2.

**Étapes :**

1. Dans Cloudflare R2 > bucket `inrealart-images` > **Settings** > **Custom Domains**
2. Ajouter `images.inrealart.com` — Cloudflare affiche l'URL CNAME cible (ex: `inrealart-images.<account-id>.r2.cloudflarestorage.com`)
3. Dans le **Manager OVH** > Domaines > `inrealart.com` > Zone DNS > Ajouter une entrée :

```
Type  : CNAME
Nom   : images
Cible : inrealart-images.<account-id>.r2.cloudflarestorage.com.
TTL   : 3600
```

4. Activer **Public access** sur le bucket dans Cloudflare R2

Propagation DNS : 5-30 minutes. Cloudflare provisionne le certificat SSL automatiquement.

**Ce que tu obtiens sans surcoût :**
- Cloudflare DNS sur le sous-domaine : gratuit
- R2 Custom Domain : inclus dans R2
- Certificat SSL : généré et renouvelé automatiquement par Cloudflare
- CDN Cloudflare (anycast mondial) : inclus

Les URLs auront la forme :
```
https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/artists/Jean Dupont/profile.webp
```

### Option B — Sous-domaine r2.dev (développement/test uniquement)

Dans R2 > bucket > **Settings** > **Public access** > activer `*.r2.dev`.

Les URLs auront la forme :
```
https://pub-<hash>.r2.dev/artists/Jean Dupont/profile.webp
```

> **Ne pas utiliser en production :** pas de cache Cloudflare, pas de SLA, URL peu lisible. Réserver au test local avant de configurer le CNAME OVH.

---

## Phase 4 — Modifications du code Next.js

### 4.1 Variables d'environnement

**Supprimer** les variables Firebase suivantes de `.env.local` et des secrets Vercel :

```bash
# A supprimer
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

**Ajouter** les variables R2 :

```bash
# Cloudflare R2 — server-side uniquement (pas de NEXT_PUBLIC_)
R2_ACCOUNT_ID=                          # Cloudflare Account ID
R2_ACCESS_KEY_ID=                       # R2 API Token > Access Key ID
R2_SECRET_ACCESS_KEY=                   # R2 API Token > Secret Access Key
R2_BUCKET_NAME=inrealart-images

# URL publique du bucket — exposée côté client
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev
```

**Créer les tokens R2 :** Cloudflare Dashboard > R2 > **Manage R2 API Tokens** > Create API Token
- Permissions : **Object Read & Write** sur le bucket `inrealart-images`

### 4.2 Nouveau client R2

Créer `lib/r2/client.ts` :

```typescript
import { S3Client } from "@aws-sdk/client-s3"

if (!process.env.R2_ACCOUNT_ID) throw new Error("R2_ACCOUNT_ID is not set")
if (!process.env.R2_ACCESS_KEY_ID) throw new Error("R2_ACCESS_KEY_ID is not set")
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error("R2_SECRET_ACCESS_KEY is not set")
if (!process.env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not set")

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""
```

Installer les dépendances :

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Désinstaller Firebase :

```bash
npm uninstall firebase
```

### 4.3 Pattern upload via presigned URL

Le changement architectural majeur : les credentials R2 restent **côté serveur**. Le client obtient une presigned PUT URL, uploade directement vers R2, puis appelle un Server Action pour enregistrer l'URL finale.

**Server Action `lib/r2/actions.ts` :**

```typescript
"use server"

import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "./client"

export async function getPresignedUploadUrl(
  storagePath: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storagePath,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 })
  const publicUrl = `${R2_PUBLIC_URL}/${storagePath}`

  return { uploadUrl, publicUrl }
}

export async function deleteFromR2(storagePath: string): Promise<boolean> {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3")
  try {
    await r2Client.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: storagePath })
    )
    return true
  } catch {
    return false
  }
}
```

**Côté client — pattern de remplacement :**

```typescript
// Avant (Firebase — "use client" obligatoire, credentials dans le bundle)
const url = await uploadArtistImageWithWebP(file, { name, surname, imageType: 'profile' })

// Après (R2 — upload direct, credentials serveur uniquement)
async function uploadToR2(file: File, storagePath: string): Promise<string> {
  const webpFile = await convertToWebPIfNeeded(file)
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(storagePath, "image/webp")

  await fetch(uploadUrl, {
    method: "PUT",
    body: webpFile.file,
    headers: { "Content-Type": "image/webp" },
  })

  return publicUrl
}
```

### 4.4 Correspondance des fonctions Firebase → R2

| Fonction Firebase (`lib/firebase/storage.ts`) | Équivalent R2 |
|---|---|
| `uploadArtistImageWithWebP` | `getPresignedUploadUrl` + fetch PUT |
| `uploadImageToFirebase` | `getPresignedUploadUrl` + fetch PUT |
| `uploadMultipleImagesToFirebase` | Boucle sur `getPresignedUploadUrl` |
| `uploadArtworkImages` | Boucle sur `getPresignedUploadUrl` |
| `uploadImageToExistingFolder` | `getPresignedUploadUrl` + fetch PUT |
| `uploadImageToLandingFolder` | `getPresignedUploadUrl` + fetch PUT |
| `uploadImageToMarketplaceFolder` | `getPresignedUploadUrl` + fetch PUT |
| `uploadImageToMarketplaceFolderByType` | `getPresignedUploadUrl` + fetch PUT |
| `uploadImageToUgcFolder` | `getPresignedUploadUrl` + fetch PUT |
| `uploadMediaToUgcFolder` | `getPresignedUploadUrl` + fetch PUT (avec content-type vidéo) |
| `uploadMockupToFirebase` | `getPresignedUploadUrl` + fetch PUT |
| `deleteImageFromFirebase` | `deleteFromR2` |
| `deletePresaleArtworkImage` | `deleteFromR2` |
| `checkFolderExists` | Supprimer (R2 n'a pas de notion de dossier vide) |
| `ensureFolderExists` | Supprimer (idem, les paths sont créés à l'upload) |
| `extractFirebaseStoragePath` | Réutiliser pour la Phase 5 (migration BDD) |

### 4.5 Mise à jour `next.config.ts`

**Ajouter** le hostname R2, **garder** Firebase pendant la période de transition :

```typescript
images: {
  remotePatterns: [
    // Garder pendant la transition (URLs existantes en BDD)
    {
      protocol: 'https',
      hostname: 'firebasestorage.googleapis.com',
    },
    // Ajouter R2
    {
      protocol: 'https',
      hostname: 'pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev',
    },
    // ... autres patterns existants
  ],
}
```

Une fois la migration BDD terminée (Phase 5), supprimer la ligne `firebasestorage.googleapis.com`.

---

## Phase 5 — Migration des URLs en base de données

### Problème

Toutes les URLs stockées en BDD ont le format Firebase avec token expirable :
```
https://firebasestorage.googleapis.com/v0/b/inrealartlanding-3a094.appspot.com/o/artists%2FJean%20Dupont%2Fprofile.webp?alt=media&token=abc123
```

Ces URLs doivent devenir :
```
https://pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev/artists/Jean Dupont/profile.webp
```

### Identifier les champs concernés

Lancer une analyse des colonnes contenant des URLs Firebase :

```sql
-- Exemple : lister les tables avec des URLs Firebase
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name ILIKE '%url%' OR column_name ILIKE '%image%' OR column_name ILIKE '%photo%');
```

### Script de migration Prisma

Créer `scripts/migrate-firebase-urls-to-r2.ts` :

```typescript
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://images.inrealart.com"

/**
 * Extrait le chemin de stockage depuis une URL Firebase Storage.
 * Réutilise la logique de lib/firebase/storage.ts extractFirebaseStoragePath()
 */
function extractFirebaseStoragePath(url: string): string | null {
  const match = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)/)
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1])
    } catch {
      return null
    }
  }
  return null
}

function convertUrl(firebaseUrl: string): string | null {
  if (!firebaseUrl.includes("firebasestorage.googleapis.com")) return null
  const path = extractFirebaseStoragePath(firebaseUrl)
  if (!path) return null
  return `${R2_PUBLIC_URL}/${path}`
}

async function migrateField<T extends object>(
  items: T[],
  getUrl: (item: T) => string | null | undefined,
  updateFn: (item: T, newUrl: string) => Promise<void>,
  label: string
) {
  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const item of items) {
    const url = getUrl(item)
    if (!url) { skipped++; continue }

    const newUrl = convertUrl(url)
    if (!newUrl) { skipped++; continue }

    try {
      await updateFn(item, newUrl)
      migrated++
    } catch (err) {
      console.error(`[${label}] Erreur:`, err)
      errors++
    }
  }

  console.log(`[${label}] Migré: ${migrated} | Ignoré: ${skipped} | Erreurs: ${errors}`)
}

async function main() {
  console.log("Démarrage de la migration Firebase → R2...")

  // --- Adapter selon le schema Prisma réel ---

  // Exemple : table Artist, champ profileImageUrl
  const artists = await prisma.artist.findMany({
    where: { profileImageUrl: { contains: "firebasestorage.googleapis.com" } },
  })
  await migrateField(
    artists,
    (a) => a.profileImageUrl,
    (a, newUrl) => prisma.artist.update({ where: { id: a.id }, data: { profileImageUrl: newUrl } }),
    "Artist.profileImageUrl"
  )

  // Exemple : table Artwork, champs mainImageUrl et secondaryImageUrls (tableau JSON)
  // Adapter selon la structure réelle du modèle Prisma

  console.log("Migration terminée.")
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
```

Lancer avec :

```bash
npx tsx scripts/migrate-firebase-urls-to-r2.ts
```

> **Important :** Tester d'abord sur un environnement de staging. Effectuer un dump de la BDD avant d'exécuter en production.

### Stratégie de transition progressive

Pour éviter les URLs cassées pendant la migration :

1. **Semaine 1 :** Migrer les fichiers GCS → R2 (Phase 2). Les deux buckets sont actifs.
2. **Semaine 1-2 :** Déployer le nouveau code R2 (Phase 4). Les nouveaux uploads vont vers R2. Les anciennes URLs Firebase restent valides (tokens non expirés).
3. **Semaine 2 :** Exécuter le script de migration BDD (Phase 5). Vérifier que toutes les images s'affichent.
4. **Semaine 3 :** Supprimer `firebasestorage.googleapis.com` de `remotePatterns`. Désactiver le projet Firebase.

---

## Checklist de migration

### Préparation

- [ ] Créer le Service Account GCP `cloudflare-r2-migration` avec le rôle `Storage Object Viewer`
- [ ] Télécharger le fichier JSON Service Account
- [ ] Créer le bucket R2 `inrealart-images` dans Cloudflare
- [ ] Configurer le domaine custom `images.inrealart.com` (ou décider d'utiliser `*.r2.dev`)
- [ ] Créer les tokens R2 API (Read & Write)

### Migration des fichiers

- [ ] Lancer "Migrate files" dans Cloudflare R2 (Phase 2)
- [ ] Vérifier le nombre d'objets migrés (comparer avec GCS)
- [ ] Vérifier l'accès public à quelques URLs R2 manuellement
- [ ] Supprimer le fichier JSON Service Account après validation

### Code

- [ ] Installer `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner`
- [ ] Créer `lib/r2/client.ts`
- [ ] Créer `lib/r2/actions.ts` (Server Actions presigned URLs)
- [ ] Ajouter les variables d'environnement R2 dans `.env.local` et Vercel
- [ ] Mettre à jour `next.config.ts` (ajouter le hostname R2)
- [ ] Remplacer les imports `lib/firebase/storage` dans les 14 composants
- [ ] Supprimer `lib/firebase/storage.ts`
- [ ] Supprimer `lib/firebase/config.ts`
- [ ] Supprimer les 7 variables `NEXT_PUBLIC_FIREBASE_*` de `.env.local` et Vercel
- [ ] Désinstaller le package `firebase`
- [ ] Vérifier `npx tsc --noEmit` sans erreurs
- [ ] Tester un upload artiste en dev
- [ ] Tester un upload œuvre en dev

### Base de données

- [ ] Identifier tous les champs contenant des URLs Firebase (audit SQL)
- [ ] Dump de la BDD de production avant migration
- [ ] Adapter et tester `scripts/migrate-firebase-urls-to-r2.ts` sur staging
- [ ] Exécuter le script de migration sur la BDD de production
- [ ] Vérifier visuellement 10-20 artistes/œuvres après migration
- [ ] Supprimer `firebasestorage.googleapis.com` de `remotePatterns` dans `next.config.ts`

### Post-migration

- [ ] Déployer en production et vérifier les logs Vercel
- [ ] Vérifier que les images s'affichent sur le front InRealArt
- [ ] Désactiver le projet Firebase (ou a minima Firebase Storage) après une période de rétention
- [ ] Archiver ou supprimer les fichiers du bucket GCS source (optionnel, après validation complète)
