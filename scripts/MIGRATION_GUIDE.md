# Guide de Migration : Google Cloud Storage → Cloudflare R2

Ce guide explique comment exécuter le script de migration d'images de Google Cloud Storage vers Cloudflare R2.

## 📋 Prérequis

- Node.js 18+ installé
- Accès aux credentials Google Cloud Service Account
- Accès aux credentials Cloudflare R2
- Les dépendances du projet installées (`npm install`)

## 🔐 Étape 1 : Préparer les Credentials

### Créer le fichier `.env.migration`

```bash
cp .env.migration.example .env.migration
```

### Remplir les variables d'environnement

Ouvre `.env.migration` et remplis les valeurs :

#### 🔵 Google Cloud Storage

```env
GOOGLE_PROJECT_ID=votre-projet-gcp
GOOGLE_CLIENT_EMAIL=service-account@votre-projet.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET=votre-bucket-gcs
```

**Où trouver ces infos :**
1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer ou sélectionner un **Service Account**
3. Générer une **clé JSON**
4. Copier les valeurs depuis le JSON téléchargé

**⚠️ Important pour `GOOGLE_PRIVATE_KEY` :**
- Remplacer les retours à la ligne réels par `\n` littéral
- Garder les guillemets autour de la clé complète
- Exemple : `"-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"`

#### 🟠 Cloudflare R2

```env
R2_ACCOUNT_ID=votre-account-id
R2_ACCESS_KEY_ID=votre-access-key
R2_SECRET_ACCESS_KEY=votre-secret-key
R2_BUCKET=votre-bucket-r2
```

**Où trouver ces infos :**
1. Aller sur [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Aller à **R2** → **Buckets**
3. Cliquer sur le bucket cible
4. Aller à **Settings** → **API tokens**
5. Générer un **R2 API token** avec accès lecture/écriture
6. Copier les credentials

#### Autres options (optionnelles)

```env
# Fichier d'entrée (défaut: scripts/migration-images.json)
# Accepte une liste simple JSON ou un rapport Cloudflare R2
MIGRATION_LIST=migration_CloudFareR2/migration-48efa137af871c86b8c98c689240c0fbd422604401a3d00a90c51f7d1caa08b4.json

# Skip les fichiers existants dans R2 (défaut: false)
# Recommandé pour éviter les écrasements accidentels
SKIP_EXISTING=true
```

## 📊 Étape 2 : Préparer la Liste d'Images

Le script accepte **deux formats** :

### Format 1 : Liste simple JSON

Créer `scripts/migration-images.json` :

```json
[
  "artworks/artist-123/image-1.jpg",
  "artworks/artist-456/image-2.webp",
  "presales/presale-789/cover.jpg"
]
```

### Format 2 : Rapport Cloudflare R2 (depuis un import échoué)

Utiliser directement le fichier rapport :

```json
[
  {
    "job": "48efa137af871c86b8c98c689240c0fbd422604401a3d00a90c51f7d1caa08b4",
    "logType": "importErrorRetryExhaustion",
    "objectKey": "presale/dropPanel/mockups/artist1.9/1.jpeg",
    "message": "Failed to import object",
    "createdAt": "2026-03-19T15:46:20.000Z"
  }
]
```

Le script extrait automatiquement les chemins des entrées `importErrorRetryExhaustion`.

## 🚀 Étape 3 : Exécuter la Migration

### Option A : Avec variables d'environnement personnalisées

```bash
# Charger les variables du fichier .env.migration
source .env.migration

# Lancer la migration
npm exec tsx scripts/migrate-gcs-to-r2.ts
```

### Option B : Avec un fichier de rapport R2 spécifique

```bash
source .env.migration

# Migrer uniquement les fichiers échoués depuis un rapport
MIGRATION_LIST=migration_CloudFareR2/migration-48efa137af871c86b8c98c689240c0fbd422604401a3d00a90c51f7d1caa08b4.json \
npm exec tsx scripts/migrate-gcs-to-r2.ts
```

### Option C : Avec protection contre les écrasements

```bash
source .env.migration

# Skip les fichiers qui existent déjà dans R2
SKIP_EXISTING=true npm exec tsx scripts/migrate-gcs-to-r2.ts
```

## 📈 Interpréter les Résultats

Le script affiche une barre de progression en temps réel :

```
[██████████████████░░] 70% - ✅ artworks/image-1.jpg
[██████████████████░░] 71% - ⏭️  artworks/image-2.jpg (déjà existant, skippé)
[██████████████████░░] 72% - ❌ artworks/image-3.jpg - Access denied
```

À la fin, vous verrez un résumé :

```
📈 Résumé de la migration:
  ✅ Succès: 145/150
  ⏭️  Skippés (existants): 3/150
  ❌ Échecs: 2/150

⚠️  Images échouées:
  - artists/unknown/photo.jpg: Not found in GCS
  - presale/draft/image.webp: Access denied

📄 Rapport sauvegardé: migration-report.json
```

## 📄 Fichier Rapport

Un fichier `migration-report.json` est généré après chaque exécution avec le détail complet :

```json
{
  "total": 150,
  "success": 145,
  "failed": 2,
  "results": [
    {
      "path": "artworks/image-1.jpg",
      "success": true,
      "attempt": 1
    },
    {
      "path": "artworks/image-2.jpg",
      "success": true,
      "skipped": true,
      "attempt": 0
    },
    {
      "path": "artists/unknown/photo.jpg",
      "success": false,
      "error": "Not found in GCS",
      "attempt": 3
    }
  ]
}
```

## ⚙️ Comportement du Script

### Retry automatique
- **3 tentatives** par fichier en cas d'erreur
- **Backoff exponentiel** : 1s → 2s → 4s entre les tentatives

### Parallélisation
- **5 uploads simultanés** (configurable dans le code)
- Optimal pour une vitesse de migration sans surcharger

### Protection des données

#### `SKIP_EXISTING=false` (défaut)
- ✅ Migrer les fichiers manquants
- ⚠️ **Écraser les fichiers existants** avec la version de GCS

#### `SKIP_EXISTING=true` (recommandé)
- ✅ Migrer les fichiers manquants
- ⏭️ **Skipper les fichiers existants** (pas d'écrasement)

## 🔧 Dépannage

### Erreur : "Variables d'environnement manquantes"

```bash
# Vérifier que toutes les variables sont définies
source .env.migration
env | grep -E "GOOGLE_|R2_|GCS_|MIGRATION_"
```

### Erreur : "Access denied" (Google Cloud)

- Vérifier que la **Service Account** a accès au bucket GCS
- Vérifier les permissions : `Storage Object Viewer` minimum

### Erreur : "Access denied" (Cloudflare R2)

- Vérifier que le **R2 API token** a les permissions `s3:PutObject`
- Vérifier que le bucket R2 existe et est accessible

### Erreur : "Not found in GCS"

- Vérifier le chemin exact du fichier (sensible à la casse)
- Vérifier que le bucket `GCS_BUCKET` est correct

### Erreur : "Service account key is invalid"

- Vérifier le format de `GOOGLE_PRIVATE_KEY`
- Les retours à la ligne doivent être `\n` littéral, pas des vrais retours à la ligne
- Exemple correct : `"-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"`

## 🛡️ Bonnes Pratiques

1. **Toujours utiliser `SKIP_EXISTING=true`** lors du retry d'une migration partielle
2. **Conserver le fichier `migration-report.json`** pour tracer les migrations
3. **Tester avec quelques fichiers** avant de lancer la migration complète
4. **Ne pas stocker `.env.migration` dans Git** (contient des secrets)
5. **Vérifier les chemins** : S'assurer que les chemins relatifs sont identiques dans GCS et R2

## 📝 Exemples Complets

### Migration complète avec protection

```bash
cp .env.migration.example .env.migration
# Éditer .env.migration avec tes credentials

SKIP_EXISTING=true source .env.migration && npm exec tsx scripts/migrate-gcs-to-r2.ts
```

### Retry des fichiers échoués

```bash
source .env.migration

# Extraire les fichiers échoués du rapport
MIGRATION_LIST=migration-report.json \
SKIP_EXISTING=true \
npm exec tsx scripts/migrate-gcs-to-r2.ts
```

### Migration partielle (certains répertoires)

Créer `scripts/partial-migration.json` :

```json
[
  "artists/CategoryA/photo.jpg",
  "presales/offer1/image.webp"
]
```

Puis lancer :

```bash
source .env.migration

MIGRATION_LIST=scripts/partial-migration.json \
npm exec tsx scripts/migrate-gcs-to-r2.ts
```

## 📞 Support

En cas de problème, consulter :
- Les logs dans le terminal (détail de chaque erreur)
- Le fichier `migration-report.json` (récapitulatif complet)
- Les credentials dans `.env.migration` (vérifier format et validité)
