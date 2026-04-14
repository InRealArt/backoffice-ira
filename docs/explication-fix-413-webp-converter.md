# Explication du bug 413 — `FUNCTION_PAYLOAD_TOO_LARGE` et sa correction

> **Document pédagogique** — Ce fichier explique en détail un bug rencontré en production sur le backoffice InRealArt, déployé sur Vercel. Il s'adresse à un développeur débutant qui connaît les bases du web (navigateur, serveur, HTTP) mais n'est pas encore familier avec les fonctions serverless, le stockage cloud, ou les limites de Vercel.

---

## Table des matières

1. [Introduction — De quoi parle-t-on ?](#1-introduction)
2. [C'est quoi Vercel et les Serverless Functions ?](#2-vercel-et-serverless-functions)
3. [C'est quoi Cloudflare R2 ?](#3-cloudflare-r2)
4. [Le problème — l'ancienne architecture](#4-lancienne-architecture)
5. [La limite de 4,5 MB — pourquoi elle existe](#5-la-limite-de-45-mb)
6. [La solution — la nouvelle architecture](#6-la-nouvelle-architecture)
7. [Le code — avant et après](#7-le-code-avant-et-après)
8. [Ce qui n'a PAS changé](#8-ce-qui-na-pas-changé)
9. [Leçons à retenir](#9-leçons-à-retenir)

---

## 1. Introduction

Le backoffice InRealArt permet d'uploader des images d'artistes vers le cloud. Une fonctionnalité particulière concerne les images "landing" : l'image de présentation d'un artiste sur sa page d'accueil. Ces images sont uploadées par un administrateur depuis un formulaire dans le navigateur, puis stockées sur **Cloudflare R2** (un service de stockage cloud) au format **WebP** (un format d'image optimisé pour le web).

En production (sur Vercel), cette fonctionnalité plantait systématiquement avec l'erreur suivante :

```
413 - Request Entity Too Large
FUNCTION_PAYLOAD_TOO_LARGE
```

Ce document explique :
- **pourquoi** ce bug se produisait,
- **comment** il a été corrigé,
- et **quels principes généraux** il faut retenir pour éviter ce genre de problème à l'avenir.

---

## 2. C'est quoi Vercel et les Serverless Functions ?

### Un serveur "classique" vs. une fonction serverless

Quand tu déploies un site web sur un hébergement traditionnel, il tourne sur **un serveur physique ou virtuel** qui reste allumé en permanence, attend les requêtes, et y répond. C'est comme un restaurant qui est toujours ouvert, avec des cuisiniers qui attendent que des clients arrivent.

**Vercel fonctionne différemment.** Vercel utilise un modèle appelé **serverless** (sans serveur, même si ce nom est trompeur — il y a bien un serveur, mais tu n'en gères pas un toi-même). Voici comment ça marche :

1. Quand une requête HTTP arrive sur ton application Next.js déployée sur Vercel (par exemple, quelqu'un appelle `/api/tools/webp-converter`), Vercel **instancie une fonction** à la volée pour traiter cette requête.
2. Cette fonction s'exécute, retourne une réponse, puis **se termine et disparaît**. Elle ne reste pas en vie en attendant la prochaine requête.
3. La prochaine requête crée une **nouvelle instance** de cette fonction.

C'est comme un restaurant où, au lieu d'avoir des cuisiniers en permanence, tu envoies un SMS pour dire que tu veux manger, et une brigade de cuisiniers apparaît magiquement, prépare ton plat, te l'apporte, puis disparaît.

### Les conséquences du modèle serverless

Ce modèle a des avantages (scalabilité automatique, pas de serveur à maintenir), mais aussi des **contraintes importantes** :

| Contrainte | Valeur sur Vercel (plan gratuit/pro) | Pourquoi ? |
|---|---|---|
| Durée d'exécution maximale | 10 à 60 secondes selon le plan | Les fonctions ne sont pas conçues pour des traitements longs |
| Taille maximale de la requête entrante | **4,5 MB** | Elles ne sont pas conçues pour recevoir de gros fichiers |
| Taille maximale de la réponse sortante | **4,5 MB** | Elles ne sont pas conçues pour envoyer de gros fichiers |
| Mémoire disponible | 1024 MB max | Limitée par rapport à un serveur dédié |

> ⚠️ **La limite de 4,5 MB s'applique AUSSI BIEN à la requête qu'à la réponse.** C'est cette limite qui a causé notre bug.

### Les Route Handlers et Server Actions dans Next.js

Dans une application Next.js déployée sur Vercel, deux types de code s'exécutent côté serveur (dans des Serverless Functions) :

- **Les Route Handlers** (fichiers `route.ts`) : ce sont des endpoints HTTP classiques. Ils reçoivent une requête HTTP et retournent une réponse HTTP. C'est l'équivalent d'un endpoint d'API REST.
- **Les Server Actions** (fonctions marquées `'use server'`) : ce sont des fonctions TypeScript normales qui s'exécutent côté serveur, mais qui peuvent être appelées directement depuis le code client comme si c'était des fonctions locales. Next.js gère la communication HTTP sous le capot. Ce qui compte, c'est que la réponse retournée au navigateur est **le résultat de la fonction** (un objet, une chaîne de caractères), pas un fichier binaire.

---

## 3. C'est quoi Cloudflare R2 ?

### Le stockage objet, c'est quoi ?

Imagine que tu as besoin de stocker des fichiers (images, vidéos, documents PDF) de façon à ce qu'ils soient accessibles depuis n'importe où sur Internet. Tu ne peux pas les stocker dans ta base de données relationnelle (PostgreSQL est fait pour des données structurées comme du texte et des nombres, pas pour des fichiers binaires volumineux). Et tu ne peux pas les stocker dans ton application Next.js (le serveur Vercel ne persiste pas les fichiers entre les requêtes).

La solution, c'est le **stockage objet** (object storage). C'est une sorte de **gros disque dur dans le cloud**, accessible via des URLs HTTP. Chaque fichier a une **clé** (un chemin comme `artists/Jean Dupont/landing/portrait.webp`) et un contenu binaire. Tu peux :

- **Lire** un fichier en faisant un GET HTTP sur son URL publique
- **Écrire** un fichier en faisant un PUT HTTP avec le contenu binaire
- **Supprimer** un fichier en faisant un DELETE HTTP

Les services les plus connus sont :
- **AWS S3** (Amazon)
- **Google Cloud Storage** (Google)
- **Cloudflare R2** (Cloudflare) — c'est ce qu'on utilise sur ce projet

### Cloudflare R2 en particulier

R2 est le service de stockage objet de Cloudflare. Son avantage principal par rapport à S3 : **pas de frais de sortie de données** (egress fees). Chez AWS, chaque Go de données téléchargé par tes utilisateurs te coûte de l'argent. Chez Cloudflare R2, c'est gratuit.

R2 est **compatible avec l'API S3** d'Amazon : on peut utiliser les mêmes outils, les mêmes bibliothèques (comme `@aws-sdk/client-s3`), en changeant juste l'URL de l'endpoint.

### Les presigned URLs

Un concept clé pour comprendre la correction du bug : les **presigned URLs** (URLs pré-signées).

Par défaut, un bucket R2 peut être configuré pour que ses objets soient publics (n'importe qui peut lire) ou privés (seuls les accès authentifiés sont acceptés). Pour les **écritures** (upload de fichiers), on veut toujours une authentification : on ne veut pas que n'importe qui puisse uploader n'importe quoi dans notre bucket.

Mais comment permettre au navigateur d'un utilisateur d'uploader directement vers R2, sans passer par notre serveur, tout en restant sécurisé ?

La réponse : une **presigned URL**. C'est une URL temporaire, **générée par notre serveur** à la demande, qui contient une signature cryptographique. Cette URL autorise **une seule opération précise** (par exemple, un PUT sur la clé `temp/abc-123/photo.jpg`) pendant une durée limitée (par exemple, 15 minutes). Après ce délai, l'URL expire et n'est plus valide.

Le navigateur peut alors utiliser cette URL pour uploader directement vers R2, **sans que les données passent par Vercel**. C'est exactement la solution à notre problème.

---

## 4. Le problème — l'ancienne architecture

### Le flux d'upload de l'image landing (ancienne version)

Voici ce qui se passait quand un administrateur uploadait une image landing dans le formulaire d'artiste :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANCIENNE ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────┐          ┌─────────────────────────────┐          ┌─────────┐
 │   Navigateur  │          │   Vercel Serverless Function │          │   R2    │
 │  (le client)  │          │  /api/tools/webp-converter   │          │ (cloud) │
 └──────┬───────┘          └──────────────┬──────────────┘          └────┬────┘
        │                                 │                               │
        │  1. L'admin sélectionne         │                               │
        │     une image JPG/PNG (10 MB)   │                               │
        │                                 │                               │
        │  2. POST multipart/form-data    │                               │
        │     (l'image brute, ~10 MB)     │                               │
        │ ──────────────────────────────► │                               │
        │                                 │                               │
        │                 3. Sharp convertit l'image en WebP              │
        │                    (ex: 10 MB JPEG → 3 MB WebP)                 │
        │                                 │                               │
        │                 4. Le buffer WebP est encodé en base64          │
        │                    (3 MB WebP → ~4 MB de texte base64)          │
        │                                 │                               │
        │  5. Réponse JSON avec           │                               │
        │     base64Data à l'intérieur    │                               │
        │     (~4 MB de JSON !)           │                               │
        │ ◄────────────────────────────── │                               │
        │                                 │                               │
        │  6. Le navigateur décode        │                               │
        │     le base64 en File object    │                               │
        │                                 │                               │
        │  7. PUT vers R2 via presigned URL (image WebP)                  │
        │ ────────────────────────────────────────────────────────────►   │
        │                                 │                               │
        │                                 │            8. 200 OK          │
        │ ◄──────────────────────────────────────────────────────────     │
```

**Points de défaillance identifiés :**

- **Étape 2** : L'image JPEG de 10 MB est envoyée à Vercel via `multipart/form-data`. Vercel rejette immédiatement avec un **413 Request Entity Too Large** car la limite est de 4,5 MB.
- **Étape 5** : Même avec une image plus petite, la réponse JSON contenant le WebP encodé en base64 peut dépasser 4,5 MB (un WebP de 3 MB devient ~4 MB en base64).

### C'est quoi le base64 ?

Pour comprendre le bug, il faut comprendre ce qu'est le **base64**.

Les fichiers images sont des **données binaires** : une suite d'octets (0 et 1) qui représente les pixels, la compression, les métadonnées. JSON, lui, ne peut contenir que du **texte** (de l'Unicode). On ne peut pas mettre des données binaires brutes dans un JSON.

Pour contourner ça, on **encode** les données binaires en texte avec un algorithme appelé **base64**. L'idée : on prend 3 octets (24 bits) de données binaires et on les représente par 4 caractères ASCII. Résultat : le texte base64 est toujours **environ 33% plus grand** que les données binaires originales.

**Exemple concret :**
```
Données binaires :  FF D8 FF E0 00 10 4A 46  (8 octets)
En base64 :         /9j/4AAQSkZJRg==         (12 caractères = 50% plus grand ici)
```

Donc, une image WebP de 3 MB encodée en base64 dans un JSON = **~4 MB de texte**. On approche dangereusement de la limite de 4,5 MB imposée par Vercel.

**Analogie :** C'est comme si, pour transporter un camion d'un côté à l'autre d'une ville, tu devais d'abord le démonter pièce par pièce, noter chaque pièce dans un carnet (c'est l'encodage base64), faire passer le carnet par une porte de maison, puis remonter le camion de l'autre côté. Non seulement c'est inefficace, mais la porte de maison a une limite de hauteur — si ton carnet est trop épais, ça ne passe plus.

### Le code fautif

Voici la fonction `convertToWebPIfNeeded` dans `lib/utils/webp-converter.ts` qui était appelée par `uploadImageToLandingFolder` :

```typescript
// lib/utils/webp-converter.ts (ANCIEN CODE — ne plus utiliser pour les uploads)

export async function convertToWebPIfNeeded(file: File): Promise<ConversionResult> {
    // ...
    const formData = new FormData()
    formData.append('images', file)

    // ❌ On envoie l'image brute à Vercel via multipart/form-data
    // Si l'image > 4,5 MB → Vercel rejette avec 413 AVANT même d'exécuter le code
    const response = await fetch('/api/tools/webp-converter', {
        method: 'POST',
        body: formData   // <-- l'image brute, potentiellement 10 MB
    })

    const result = await response.json()

    // ❌ La réponse JSON contient le WebP encodé en base64
    // Si le WebP converti > ~3,4 MB → le JSON de réponse dépasse 4,5 MB → 413
    const base64Data = result.convertedImages[0].base64Data
    const byteCharacters = atob(base64Data)
    // ... décodage du base64 en File object ...
}
```

Et l'ancienne version de `uploadImageToLandingFolder` dans `lib/r2/storage.ts` :

```typescript
// lib/r2/storage.ts (ANCIENNE version de uploadImageToLandingFolder)

export async function uploadImageToLandingFolder(
    imageFile: File,
    folderName: string,
    fileName: string,
    // ...
): Promise<string> {
    // ❌ Appel à convertToWebPIfNeeded qui passe par /api/tools/webp-converter
    // → envoie l'image brute à Vercel (risque 413 à la requête)
    // → reçoit le WebP en base64 dans la réponse JSON (risque 413 à la réponse)
    const conversionResult = await convertToWebPIfNeeded(imageFile)
    // ...
    const imageUrl = await uploadFileToR2(conversionResult.file, storagePath)
    return imageUrl
}
```

---

## 5. La limite de 4,5 MB — pourquoi elle existe

### Les Serverless Functions ne sont pas des serveurs de fichiers

Vercel impose une limite de **4,5 MB** sur les payloads de requête et de réponse pour les Serverless Functions. Cette limite n'est pas arbitraire : elle reflète la **philosophie du serverless**.

Les Serverless Functions sont conçues pour :
- Traiter de la **logique métier** (authentification, validation, calculs)
- Interroger une **base de données** et retourner des résultats JSON
- Appeler des **APIs externes** et transférer leurs réponses
- Gérer des **formulaires** avec des données textuelles

Elles ne sont **pas** conçues pour :
- Servir de proxy pour des fichiers volumineux
- Streamer des vidéos
- Retourner des images brutes de plusieurs mégaoctets

### Comparaison avec un vrai serveur HTTP

Sur un serveur dédié (ex: un serveur Node.js sur un VPS), il n'y a pas de limite artificielle de payload (hormis la mémoire disponible et la bande passante). Un serveur Express peut parfaitement recevoir un fichier de 500 MB si tu le configures ainsi.

Mais Vercel fait tourner plusieurs milliers de fonctions en parallèle sur des machines partagées. Si chaque fonction pouvait recevoir et retourner des fichiers de 100 MB, le système serait saturé en quelques minutes. La limite de 4,5 MB est un **garde-fou** pour maintenir la performance et la stabilité de la plateforme.

### Le message d'erreur exact

L'erreur `FUNCTION_PAYLOAD_TOO_LARGE` avec le code HTTP **413** signifie :

> "La charge utile (payload) de ta requête ou de ta réponse dépasse la taille maximale autorisée pour une Serverless Function."

Le code 413 est un code HTTP standard qui signifie "Request Entity Too Large" (l'entité de la requête est trop grande). Sur Vercel, il s'applique aussi aux réponses trop volumineuses.

### Illustration chiffrée

```
Image JPEG sélectionnée par l'admin : 8 MB
─────────────────────────────────────────────────────────────

ÉTAPE 2 (requête vers Vercel) :
  Image brute en multipart/form-data : ~8,1 MB
  Limite Vercel                       : 4,5 MB
  Résultat                            : ❌ 413 FUNCTION_PAYLOAD_TOO_LARGE
  (La fonction ne s'exécute même pas)

Si l'image faisait 3 MB (sous la limite de 4,5 MB) :
  Requête : ~3,1 MB ✅
  WebP après Sharp : ~1,5 MB
  Base64 de 1,5 MB WebP : ~2 MB → réponse JSON : ~2 MB ✅ (passe)

Si l'image faisait 4 MB :
  Requête : ~4,1 MB ✅ (juste sous la limite)
  WebP après Sharp : ~2 MB
  Base64 de 2 MB WebP : ~2,7 MB → réponse JSON : ~2,7 MB ✅ (passe)

Si l'image faisait 5 MB :
  Requête : ~5,1 MB ❌ 413 à l'entrée

Si l'image faisait 4 MB mais compressait moins bien (ex: JPEG déjà compressé) :
  Requête : ~4,1 MB ✅
  WebP après Sharp : ~3,5 MB (peu de gain)
  Base64 de 3,5 MB WebP : ~4,7 MB → réponse JSON : ~4,7 MB ❌ 413 à la sortie
```

**Conclusion : l'ancienne architecture ne fonctionnait de façon fiable que pour des images de moins de ~3 MB, ce qui était insuffisant pour un usage réel (un photographe fournit facilement des JPEG de 6-10 MB).**

---

## 6. La solution — la nouvelle architecture

### Le principe fondamental

La correction repose sur une idée simple : **les données binaires volumineuses ne doivent jamais passer par une Serverless Function Vercel comme payload HTTP**. Ni à l'entrée (requête), ni à la sortie (réponse).

À la place :
- Le navigateur **uploade l'image directement vers R2** via une presigned URL (Vercel n'est pas dans la boucle)
- Le serveur Vercel **lit l'image depuis R2, la convertit, et la réécrit sur R2** sans jamais la retourner au navigateur

### Le nouveau flux

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NOUVELLE ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

 ┌──────────────┐    ┌──────────────────────────┐    ┌───────────────────────┐
 │  Navigateur   │    │  Vercel (Route Handler   │    │   Cloudflare R2       │
 │  (le client)  │    │  ou Server Action)       │    │   (stockage cloud)    │
 └──────┬───────┘    └────────────┬─────────────┘    └───────────┬───────────┘
        │                         │                               │
        │  1. POST /api/r2/presign│                               │
        │     { storagePath:      │                               │
        │       "temp/uuid/img.jpg│                               │
        │       contentType: ... }│                               │
        │ ───────────────────────►│                               │
        │                         │  (génère une URL signée       │
        │                         │   pour écrire sur R2)         │
        │  2. { uploadUrl, relativePath }                         │
        │ ◄───────────────────────│                               │
        │                         │                               │
        │  3. PUT l'image brute directement vers R2               │
        │     (8 MB, passe directement — Vercel n'est PAS là)     │
        │ ────────────────────────────────────────────────────►   │
        │                         │                               │
        │                         │              4. 200 OK        │
        │ ◄──────────────────────────────────────────────────     │
        │                         │                               │
        │  5. Appel Server Action │                               │
        │  convertAndFinalize(    │                               │
        │    tempKey, finalKey)   │                               │
        │ ───────────────────────►│                               │
        │                         │                               │
        │                         │  6. GetObject tempKey         │
        │                         │ ─────────────────────────────►│
        │                         │                               │
        │                         │  7. Buffer brut (8 MB)        │
        │                         │ ◄─────────────────────────────│
        │                         │ (serveur→serveur, pas de      │
        │                         │  limite de payload navigateur)│
        │                         │                               │
        │                         │  8. sharp(buffer).webp()      │
        │                         │     → webpBuffer (2 MB)       │
        │                         │                               │
        │                         │  9. PutObject finalKey        │
        │                         │     (webpBuffer) ────────────►│
        │                         │                               │
        │                         │  10. DeleteObject tempKey ───►│
        │                         │                               │
        │  11. { relativePath:    │                               │
        │       "artists/.../img.webp" }                          │
        │  (tiny JSON, quelques octets)                           │
        │ ◄───────────────────────│                               │
```

### Pourquoi cette architecture ne souffre plus de la limite 4,5 MB

**Étape 1** : La requête vers `/api/r2/presign` ne contient qu'un JSON avec un nom de fichier et un type MIME. Quelques dizaines d'octets. Aucun risque.

**Étape 3** : L'image brute va **directement** du navigateur vers R2, en utilisant l'URL pré-signée. Vercel n'est **pas du tout impliqué** dans ce transfert. R2 accepte des fichiers de plusieurs gigaoctets. Pas de limite de 4,5 MB ici.

**Étapes 6 à 10** : Le Server Action tourne sur Vercel, mais il communique avec R2 en **serveur à serveur**. Vercel lit les bytes depuis R2 via le SDK S3, les convertit avec Sharp, et réécrit sur R2 via le SDK S3. Ce trafic binaire ne passe **jamais dans la réponse HTTP retournée au navigateur**. Donc la limite de 4,5 MB ne s'applique pas à ce trafic interne.

**Étape 11** : La réponse retournée au navigateur est juste `{ relativePath: "artists/Jean Dupont/landing/portrait.webp" }`. Quelques dizaines d'octets. Pas de risque.

### C'est quoi un Server Action, concrètement ?

Un **Server Action** est une fonction TypeScript marquée avec la directive `'use server'` en tête de fichier. Cette directive dit à Next.js : "cette fonction doit toujours s'exécuter sur le serveur, jamais dans le navigateur".

Quand le code client appelle un Server Action, Next.js :
1. Sérialise les arguments en JSON (ici, juste deux chaînes de caractères : `tempKey` et `finalKey`)
2. Envoie ces arguments au serveur Vercel via une requête HTTP POST interne
3. Exécute la fonction sur le serveur
4. Sérialise la valeur de retour en JSON (ici, `{ relativePath: "..." }`)
5. Retourne ce JSON au client

Le point clé : **la valeur de retour est le résultat typé de la fonction, pas un fichier binaire**. Next.js gère la sérialisation. Comme notre fonction retourne juste `{ relativePath: string }`, le JSON de retour est minuscule.

---

## 7. Le code — avant et après

### Avant : `uploadImageToLandingFolder` (version cassée)

```typescript
// lib/r2/storage.ts — ANCIENNE VERSION (ne plus utiliser)

export async function uploadImageToLandingFolder(
    imageFile: File,
    folderName: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        // ❌ PROBLÈME ICI :
        // convertToWebPIfNeeded envoie l'image BRUTE à /api/tools/webp-converter
        // via multipart/form-data, puis reçoit le WebP converti encodé en base64
        // dans la réponse JSON.
        // → Si imageFile > 4,5 MB : 413 sur la requête
        // → Si le WebP converti > ~3,4 MB : 413 sur la réponse
        onConversionStatus?.('in-progress')
        const conversionResult = await convertToWebPIfNeeded(imageFile)

        if (!conversionResult.success) {
            onConversionStatus?.('error', conversionResult.error)
            throw new Error(conversionResult.error)
        }

        onConversionStatus?.('completed')

        // Upload du fichier WebP (converti côté client) vers R2 via presigned URL
        onUploadStatus?.('in-progress')
        const storagePath = `artists/${folderName}/landing/${fileName}.webp`
        const imageUrl = await uploadFileToR2(conversionResult.file, storagePath)
        onUploadStatus?.('completed')

        return imageUrl
    } catch (error) {
        // ...gestion d'erreur...
    }
}
```

**Ce qui se passe ligne par ligne :**

- `convertToWebPIfNeeded(imageFile)` — Cette fonction crée un `FormData` avec l'image brute dedans, et fait un `fetch('/api/tools/webp-converter', { method: 'POST', body: formData })`. L'image brute est envoyée à Vercel. Si elle dépasse 4,5 MB, Vercel la rejette avec 413 avant même d'exécuter le moindre code.

- Si la requête passe, l'API retourne `{ convertedImages: [{ base64Data: "...(énorme chaîne base64)...", ... }] }`. Cette chaîne base64 est la représentation textuelle du fichier WebP. Pour un WebP de 3 MB, c'est environ 4 MB de texte. Si ça dépasse 4,5 MB au total avec les autres champs JSON, Vercel rejette la réponse avec 413.

- `conversionResult.file` — Le résultat est un `File` objet reconstruit côté navigateur en décodant le base64. On a donc fait un aller-retour Vercel complet juste pour convertir l'image, avec deux risques de 413.

### Après : `uploadImageToLandingFolder` (version corrigée)

```typescript
// lib/r2/storage.ts — NOUVELLE VERSION (correcte)

export async function uploadImageToLandingFolder(
    imageFile: File,
    folderName: string,
    fileName: string,
    onConversionStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void,
    onUploadStatus?: (status: 'in-progress' | 'completed' | 'error', error?: string) => void
): Promise<string> {
    try {
        // ÉTAPE 1 : Générer une clé temporaire unique avec un UUID
        // "temp/550e8400-e29b-41d4-a716-446655440000/photo.jpg"
        // Le UUID garantit qu'on ne va pas écraser un autre fichier en cours d'upload
        onConversionStatus?.('in-progress')
        const { v4: uuidv4 } = await import('uuid')
        const tempKey = `temp/${uuidv4()}/${imageFile.name}`

        // ÉTAPE 2 : Demander à notre serveur une presigned PUT URL pour cette clé temporaire
        // getPresignedUploadUrl appelle /api/r2/presign qui génère l'URL signée
        // La requête ne contient que du JSON léger (le chemin et le type MIME)
        const { uploadUrl: tempUploadUrl } = await getPresignedUploadUrl(tempKey, imageFile.type)

        // ÉTAPE 3 : Uploader l'image BRUTE directement vers R2 via la presigned URL
        // ✅ Vercel n'est PAS dans la boucle ici. Le navigateur parle directement à R2.
        // R2 accepte des fichiers de n'importe quelle taille. Pas de limite de 4,5 MB.
        const rawUploadResponse = await fetch(tempUploadUrl, {
            method: 'PUT',
            body: imageFile,                          // l'image brute, même 10 MB
            headers: { 'Content-Type': imageFile.type },
        })

        if (!rawUploadResponse.ok) {
            const errorMessage = `Échec de l'upload brut vers R2 temp: HTTP ${rawUploadResponse.status}`
            onConversionStatus?.('error', errorMessage)
            throw new Error(errorMessage)
        }

        onConversionStatus?.('completed')

        // ÉTAPE 4 : Construire la clé finale (là où le WebP converti sera stocké)
        // "artists/Jean Dupont/landing/portrait.webp"
        onUploadStatus?.('in-progress')
        const finalKey = `artists/${folderName}/landing/${fileName}.webp`

        // ÉTAPE 5 : Appeler le Server Action convertAndFinalize
        // Ce Server Action s'exécute sur Vercel, mais :
        //   - les arguments envoyés au serveur = juste deux strings (tempKey, finalKey) → tiny JSON
        //   - la réponse retournée au navigateur = { relativePath: "..." } → tiny JSON
        //   - les données binaires restent dans la mémoire de la Serverless Function
        //     et ne transitent jamais vers le navigateur
        const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
        const result = await convertAndFinalize(tempKey, finalKey)

        onUploadStatus?.('completed')

        // ÉTAPE 6 : Retourner le chemin relatif pour stockage en base de données
        // Ex: "artists/Jean Dupont/landing/portrait.webp"
        return result.relativePath
    } catch (error) {
        // ...gestion d'erreur...
    }
}
```

### Le Server Action `convertAndFinalize`

```typescript
// lib/r2/actions/convert-and-finalize.ts

'use server'  // ← Directive Next.js : cette fonction s'exécute TOUJOURS côté serveur

import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2/client'

export async function convertAndFinalize(
    tempKey: string,   // "temp/uuid/photo.jpg"
    finalKey: string   // "artists/Jean Dupont/landing/portrait.webp"
): Promise<{ success: true; relativePath: string }> {

    // ÉTAPE A : Récupérer l'image brute depuis R2 (serveur → R2, pas de limite de payload navigateur)
    const getCommand = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: tempKey })
    const getResponse = await r2Client.send(getCommand)
    // getResponse.Body est un stream Node.js — on le lit en mémoire dans un Buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of getResponse.Body) {
        chunks.push(chunk)
    }
    const rawBuffer = Buffer.concat(chunks)
    // ✅ Le buffer (8 MB) est en mémoire DANS la Serverless Function.
    // Il ne sera JAMAIS envoyé au navigateur.

    // ÉTAPE B : Convertir en WebP avec Sharp (bibliothèque de traitement d'image)
    const webpBuffer = await sharp(rawBuffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4, smartSubsample: true, lossless: false })
        .toBuffer()
    // webpBuffer est maintenant un Buffer de ~2 MB en mémoire. Toujours pas envoyé au navigateur.

    // ÉTAPE C : Écrire le WebP sur R2 à la clé finale (serveur → R2, pas de limite navigateur)
    await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: finalKey,
        Body: webpBuffer,             // le buffer WebP, envoyé directement de Vercel à R2
        ContentType: 'image/webp',
        ContentLength: webpBuffer.length,
    }))

    // ÉTAPE D : Supprimer la clé temporaire pour ne pas laisser de fichiers orphelins
    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: tempKey }))

    // ÉTAPE E : Retourner juste le chemin relatif au navigateur
    // ✅ "artists/Jean Dupont/landing/portrait.webp" = ~50 octets de JSON
    // AUCUNE donnée binaire dans la réponse.
    return { success: true, relativePath: finalKey }
}
```

**Ce qui se passe ligne par ligne :**

- `'use server'` — Directive Next.js obligatoire pour déclarer un Server Action. Next.js refuse d'exécuter ce code dans le navigateur.

- `GetObjectCommand` — On demande à R2 (via le SDK S3 compatible) de nous envoyer le fichier à la clé `tempKey`. R2 répond avec un stream de bytes. Ce transfert est **de serveur à serveur** (Vercel ↔ R2), pas de serveur à navigateur. La limite de 4,5 MB ne s'applique pas ici.

- `for await (const chunk of getResponse.Body)` — On lit le stream par morceaux et on les accumule dans un tableau. Puis `Buffer.concat(chunks)` les fusionne en un seul buffer. On a maintenant l'image brute complète en mémoire (ex: 8 MB).

- `sharp(rawBuffer).webp(...)` — La bibliothèque Sharp convertit le buffer brut en WebP. Cette opération est entièrement en mémoire sur le serveur Vercel. Elle produit un nouveau buffer WebP.

- `PutObjectCommand` — On envoie le buffer WebP directement de Vercel vers R2. Encore une fois, transfert serveur à serveur, pas vers le navigateur.

- `DeleteObjectCommand` — On supprime le fichier temporaire. Bonne pratique : ne pas laisser trainer des fichiers `temp/` dans le bucket.

- `return { success: true, relativePath: finalKey }` — Le navigateur reçoit juste cette petite structure JSON. Pas d'image, pas de base64, pas de données binaires.

---

## 8. Ce qui n'a PAS changé

Il est important de noter que **la Route Handler `/api/tools/webp-converter` n'a pas été supprimée**. Elle est toujours présente dans le codebase et est toujours utilisée.

### Pourquoi ?

Il existe une autre fonctionnalité dans l'application : un **outil de conversion WebP** accessible via la page `/tools/webp-converter`. Cet outil permet à un administrateur de :
1. Sélectionner plusieurs images JPEG/PNG
2. Les convertir en WebP
3. **Télécharger** les fichiers WebP convertis sur son ordinateur (pas les uploader vers R2)

Pour ce cas d'usage, la Route Handler `/api/tools/webp-converter` est parfaitement adaptée :
- L'admin utilise cet outil avec des images raisonnables (généralement < 4 MB)
- L'objectif est d'avoir les fichiers WebP **localement** (pour les inspecter, les partager, etc.), pas de les stocker sur R2

La fonction `convertMultipleToWebP` dans `lib/utils/webp-converter.ts` appelle toujours cette Route Handler pour ce flux-là. Elle n'a pas été modifiée.

### Résumé de ce qui a changé vs. ce qui est resté

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ÉTAT DU CODE APRÈS LE FIX                        │
├─────────────────────────────────┬────────────────────────────────────────┤
│ CHANGÉ                          │ PAS CHANGÉ                             │
├─────────────────────────────────┼────────────────────────────────────────┤
│ uploadImageToLandingFolder      │ /api/tools/webp-converter/route.ts     │
│ (lib/r2/storage.ts)             │ (encore utilisé par l'outil WebP)      │
│ → n'appelle plus                │                                        │
│   convertToWebPIfNeeded         │ convertMultipleToWebP                  │
│ → utilise presigned PUT +       │ (lib/utils/webp-converter.ts)          │
│   Server Action à la place      │ → appelle toujours la Route Handler    │
├─────────────────────────────────┼────────────────────────────────────────┤
│ NOUVEAU                         │                                        │
├─────────────────────────────────┤                                        │
│ lib/r2/actions/                 │                                        │
│   convert-and-finalize.ts       │                                        │
│ (Server Action tout neuf)       │                                        │
└─────────────────────────────────┴────────────────────────────────────────┘
```

> ⚠️ **Important :** Ne PAS supprimer `/api/tools/webp-converter/route.ts` ni `convertMultipleToWebP` tant que la page `/tools/webp-converter` existe. La note en tête du fichier `lib/utils/webp-converter.ts` le rappelle explicitement.

---

## 9. Leçons à retenir

Voici les grands enseignements de ce bug, applicables à tout projet Next.js déployé sur Vercel (ou sur toute plateforme serverless) :

### Ne jamais faire transiter des données binaires volumineuses par une Serverless Function

> Si tu as besoin de déplacer un fichier de plusieurs mégaoctets, fais-le sans passer par Vercel. Utilise des presigned URLs pour que le navigateur parle directement au stockage cloud.

**Mauvais pattern :**
```
Navigateur → (fichier 10 MB) → Vercel → R2
```

**Bon pattern :**
```
Navigateur → (JSON: "donne-moi une URL") → Vercel → (URL signée) → Navigateur
Navigateur → (fichier 10 MB) → R2 directement
```

### Le base64-dans-JSON est un antipattern pour les fichiers > quelques dizaines de kB

> Le base64 augmente la taille des données de ~33%. Pour des petites images (thumbnails, avatars < 100 kB), c'est acceptable. Pour des photos haute résolution de plusieurs mégaoctets, c'est une bombe à retardement.

Le base64 dans un JSON peut avoir du sens pour :
- Des petites icônes inline (`data:image/png;base64,...` dans du CSS)
- Des thumbnails de prévisualisation dans une interface (< 100 kB)

Il ne devrait jamais être utilisé pour :
- Transporter des images haute résolution
- Transporter des vidéos ou des fichiers audio
- N'importe quel fichier > 500 kB dans un contexte serverless

### Les Server Actions sont la bonne solution pour la logique de transformation serveur

> Quand tu as besoin de traiter des données côté serveur (convertir, redimensionner, compresser) et de stocker le résultat directement dans un service tiers, un Server Action est parfait. Il peut manipuler des données volumineuses en mémoire sans jamais les exposer dans une réponse HTTP vers le navigateur.

```typescript
'use server'
// ✅ Ce code s'exécute sur Vercel
// ✅ Il peut lire/écrire des données volumineuses vers R2 en serveur-à-serveur
// ✅ La réponse retournée au navigateur est juste du JSON léger
export async function convertAndFinalize(tempKey: string, finalKey: string) {
    // ... lire depuis R2, traiter avec sharp, écrire sur R2 ...
    return { relativePath: finalKey }  // tiny JSON
}
```

### Les presigned URLs sont le pattern standard pour les uploads de fichiers

> C'est le pattern utilisé par toutes les grandes plateformes (AWS, Google Cloud, Cloudflare, Supabase Storage) pour permettre aux clients d'uploader directement vers le stockage, sans passer par l'application backend.

Le flux est toujours le même :
1. Le client demande une URL temporaire et signée à ton backend
2. Ton backend génère cette URL avec le SDK cloud (elle expire dans 15 min, par exemple)
3. Le client utilise cette URL pour uploader directement vers le stockage
4. Ton backend est notifié (via callback, webhook, ou appel explicite du client) que l'upload est terminé

### Connaître les limites de ta plateforme avant d'architecturer

> Avant de concevoir un flux d'upload, de traitement d'image, ou de transfert de fichiers, consulte la documentation de ta plateforme de déploiement. Les limites de payload Vercel (4,5 MB) sont documentées. Les ignorer mène exactement au type de bug décrit dans ce document.

**Pour Vercel en 2024/2025 :**
- Payload max requête/réponse (Serverless Functions) : **4,5 MB**
- Durée d'exécution max (Hobby) : **10 secondes**
- Durée d'exécution max (Pro) : **60 secondes** (configurable jusqu'à 900s sur certains plans)
- Mémoire max (Serverless) : **1024 MB**

Si ton cas d'usage dépasse ces limites, la réponse n'est jamais "augmenter la limite" (c'est souvent impossible ou coûteux), mais **redesigner l'architecture** pour ne pas passer par Vercel pour les opérations lourdes.

---

## Résumé en une phrase

> Le bug venait du fait qu'on faisait passer une image de plusieurs mégaoctets **à travers** une Serverless Function Vercel (en entrée comme en sortie), alors qu'on aurait dû la faire uploader **directement** depuis le navigateur vers R2, et laisser le serveur Vercel faire uniquement la conversion en coulisses — sans jamais retourner les données binaires au navigateur.

---

*Document rédigé lors du fix du bug 413 FUNCTION_PAYLOAD_TOO_LARGE sur la fonctionnalité d'upload d'image landing — Backoffice InRealArt — Avril 2026.*
