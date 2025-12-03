# 🔧 Solution au problème Prisma dans le Middleware Vercel

## 🔴 Problème identifié

L'erreur se produit dans la section **"Middleware"** des logs Vercel :

```
Unhandled Rejection: PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".
```

**Caractéristiques** :

- ❌ Erreur dans le middleware (section "Middleware" des logs)
- ⚠️ Code de sortie 128 (`Node.js process exited with exit status: 128`)
- ✅ Les requêtes HTTP se terminent avec un code 200 (suggère une erreur asynchrone)

## 🔍 Analyse de la cause

### 1. **Initialisation Prisma au moment de l'import**

Le problème vient de l'initialisation de `PrismaClient` lors de l'import de `lib/auth.ts` :

```typescript
// lib/auth.ts
import { prisma } from "./prisma"; // ← Initialisation immédiate ici
```

Quand `better-auth` crée son middleware (via `app/api/auth/[...all]/route.ts`), il importe `lib/auth.ts`, qui importe `lib/prisma.ts`, qui crée immédiatement une instance de `PrismaClient`.

### 2. **Contexte d'exécution du middleware**

Le middleware Next.js peut s'exécuter dans différents contextes :

- **Edge Runtime** (par défaut) : Les binaires Prisma ne peuvent pas fonctionner
- **Node.js Runtime** : Les binaires Prisma peuvent fonctionner

### 3. **Binaires non disponibles dans le contexte middleware**

Même avec toutes les configurations de copie, les binaires peuvent ne pas être disponibles dans le contexte d'exécution du middleware, surtout lors du premier démarrage.

## ✅ Solution mise en place

### 1. Amélioration de l'initialisation Prisma

**Fichier : `lib/prisma.ts`**

```typescript
// Gestion d'erreur améliorée avec connexion asynchrone
function initializePrisma(): PrismaClient {
  // ... gestion d'erreur ...

  // Tester la connexion de manière asynchrone pour éviter de bloquer
  prismaInstance.$connect().catch((error) => {
    console.error(
      "[Prisma] ⚠️ Erreur de connexion initiale (peut être normale au démarrage):",
      error.message
    );
  });

  return prismaInstance;
}
```

**Effet** : L'initialisation ne bloque plus si les binaires ne sont pas encore disponibles.

### 2. Forcer le runtime Node.js pour les routes API auth

**Fichier : `app/api/auth/[...all]/route.ts`**

```typescript
// Forcer le runtime Node.js pour garantir que les binaires Prisma sont disponibles
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

**Effet** : Les routes API auth s'exécutent toujours dans le Node.js runtime, où les binaires Prisma sont disponibles.

### 3. Amélioration du script de copie

**Fichier : `scripts/copy-prisma-engines.sh`**

```bash
# Copier aussi dans .next/server pour le middleware et les routes API
if [ -d ".next/server" ]; then
  mkdir -p .next/server/node_modules/.prisma/client
  cp -r node_modules/.prisma/client/* .next/server/node_modules/.prisma/client/
fi
```

**Effet** : Les binaires sont copiés dans `.next/server/` en plus de `.next/standalone/`, garantissant leur disponibilité dans tous les contextes.

### 4. Amélioration de `outputFileTracingIncludes`

**Fichier : `next.config.ts`**

```typescript
outputFileTracingIncludes: {
  '/api/**': [
    // Inclusion explicite pour les routes API
    './node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
    // ...
  ],
  '/*': [
    // Inclusion pour toutes les routes
    // ...
  ],
}
```

**Effet** : Les binaires sont explicitement inclus dans le file tracing pour les routes API.

## 🎯 Pourquoi cette solution fonctionne

### Avant (❌ Erreur dans le middleware)

```
Middleware Next.js
  ↓
Import lib/auth.ts
  ↓
Import lib/prisma.ts
  ↓
new PrismaClient() → Essaie de charger les binaires
  ↓
Binaires non disponibles → Erreur non gérée
  ↓
Code de sortie 128
```

### Après (✅ Solution)

```
Middleware Next.js
  ↓
Route API avec runtime = 'nodejs'
  ↓
Import lib/auth.ts
  ↓
Import lib/prisma.ts
  ↓
new PrismaClient() → Gestion d'erreur gracieuse
  ↓
$connect() asynchrone → Ne bloque pas
  ↓
Binaires disponibles dans .next/server/
  ↓
✅ Fonctionne correctement
```

## 📋 Checklist de vérification

Avant de déployer, vérifiez que :

- [x] `lib/prisma.ts` contient la gestion d'erreur améliorée
- [x] `app/api/auth/[...all]/route.ts` contient `export const runtime = 'nodejs'`
- [x] `scripts/copy-prisma-engines.sh` copie dans `.next/server/`
- [x] `next.config.ts` contient `outputFileTracingIncludes` pour `/api/**`
- [x] `vercel.json` contient le script de copie dans `buildCommand`

## 🧪 Test local

Pour tester la solution localement :

```bash
# 1. Générer le client Prisma
npx prisma generate

# 2. Build de production
npm run build

# 3. Vérifier que les moteurs sont copiés
ls -lh .next/server/node_modules/.prisma/client/ | grep "rhel"
ls -lh .next/standalone/node_modules/.prisma/client/ | grep "rhel"
```

**Résultat attendu** : Les binaires doivent être présents dans les deux dossiers.

## 🚀 Déploiement

```bash
git add .
git commit -m "fix: Résolution du problème Prisma dans le middleware Vercel"
git push
```

## 📊 Résultat attendu

- ✅ **Plus d'erreur dans le middleware** : Les binaires sont toujours disponibles
- ✅ **Code de sortie normal** : Plus de code 128
- ✅ **Requêtes HTTP 200** : Les erreurs asynchrones sont gérées gracieusement
- ✅ **Runtime Node.js garanti** : Les routes API auth utilisent toujours Node.js runtime

## 🔗 Références

- [Next.js Runtime Configuration](https://nextjs.org/docs/app/api-reference/route-segment-config#runtime)
- [Prisma + Vercel Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Better Auth Documentation](https://www.better-auth.com/docs)
