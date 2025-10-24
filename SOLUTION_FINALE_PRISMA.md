# ✅ SOLUTION FINALE - Prisma sur Vercel avec Next.js 16

## 🔴 Le problème

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
libquery_engine-rhel-openssl-3.0.x.so.node not found in /var/task/node_modules/.prisma/client
```

### Contexte

- **Next.js 16.0.0** sur **Vercel**
- **Server Actions** appelées depuis des composants client
- Les Server Actions s'exécutent sur **AWS Lambda** (`/var/task/`)
- Lambda ne contient pas les moteurs Prisma par défaut

### La vraie cause

**Next.js avec `output: 'standalone'`** ne trace PAS automatiquement les binaires natifs de Prisma dans le build. Les fichiers `.so.node` et exécutables du moteur Prisma ne sont donc pas inclus dans le bundle Lambda sur Vercel.

## ✅ La solution (3 configurations simples)

### 1. Configurer le schéma Prisma

**`prisma/schema.prisma`** :

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]
}
```

**Important** :

- ✅ Inclure `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
- ❌ **NE PAS** ajouter `engineType` (cause des erreurs)

### 2. Configurer Next.js avec outputFileTracingIncludes

**`next.config.ts`** :

```typescript
import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  // Output standalone pour Vercel
  output: "standalone",

  // Configurer les fichiers externes pour Prisma
  serverExternalPackages: ["@prisma/client", "@prisma/engines"],

  // ⭐ SOLUTION CLÉ : Inclure les moteurs Prisma dans le file tracing
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/.prisma/client/**/*",
      "node_modules/@prisma/client/**/*",
    ],
  },

  // Plugin webpack pour copie supplémentaire
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
```

### 3. Configurer Vercel

**`vercel.json`** :

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npx prisma generate && npm run build",
  "installCommand": "npm install --legacy-peer-deps"
}
```

### 4. Installer le plugin Prisma

```bash
npm install --save-dev @prisma/nextjs-monorepo-workaround-plugin
```

### 5. Créer le fichier de types TypeScript

**`types/prisma-plugin.d.ts`** :

```typescript
declare module "@prisma/nextjs-monorepo-workaround-plugin" {
  import { Compiler } from "webpack";

  export class PrismaPlugin {
    constructor();
    apply(compiler: Compiler): void;
  }
}
```

## 📋 Fichiers modifiés (récapitulatif)

| Fichier                    | Action                            | Raison                                             |
| -------------------------- | --------------------------------- | -------------------------------------------------- |
| `prisma/schema.prisma`     | Ajout `binaryTargets`             | Génère le moteur rhel-openssl-3.0.x                |
| `next.config.ts`           | Ajout `outputFileTracingIncludes` | **CLÉ** : Force l'inclusion des moteurs dans build |
| `next.config.ts`           | Ajout `output: 'standalone'`      | Build standalone pour Lambda                       |
| `next.config.ts`           | Ajout `PrismaPlugin`              | Copie supplémentaire webpack                       |
| `package.json`             | Installation du plugin            | Permet la copie webpack                            |
| `vercel.json`              | `buildCommand` personnalisé       | Génère Prisma puis build                           |
| `types/prisma-plugin.d.ts` | Déclaration TypeScript            | Compatibilité TypeScript                           |

## 🧪 Vérification locale

```bash
# 1. Générer le client Prisma
npx prisma generate

# 2. Build de production
npm run build

# 3. Vérifier que les moteurs sont inclus dans standalone
ls -lh .next/standalone/node_modules/.prisma/client/ | grep "rhel"
```

**Résultat attendu** :

```
libquery_engine-rhel-openssl-3.0.x.so.node  (17M)
query-engine-rhel-openssl-3.0.x             (18M)
```

## 🚀 Déploiement sur Vercel

```bash
git add .
git commit -m "fix: Prisma engines avec outputFileTracingIncludes"
git push
```

Vercel va :

1. Installer les dépendances (`npm install --legacy-peer-deps`)
2. Générer le client Prisma (`npx prisma generate`)
3. Builder l'application (`npm run build`)
4. **`outputFileTracingIncludes` copie automatiquement les moteurs dans standalone** ✅
5. Déployer avec les moteurs inclus ✅

## 🔍 Pourquoi cette solution fonctionne ?

### Le problème technique

- **Next.js 16** avec `output: 'standalone'` utilise le "file tracing" pour minimiser la taille du build
- **Par défaut**, Next.js ne trace que les fichiers `.js`, `.json`, etc.
- **Les binaires natifs** (`.so.node`, exécutables) de Prisma ne sont PAS tracés automatiquement
- **Lambda** ne trouve donc pas `libquery_engine-rhel-openssl-3.0.x.so.node`

### La solution technique

1. **`outputFileTracingIncludes`** : Force Next.js à inclure `node_modules/.prisma/client/**/*` dans le file tracing
2. **Résultat** : Tous les moteurs Prisma sont copiés dans `.next/standalone/node_modules/.prisma/client/`
3. **Vercel** : Package le standalone avec les moteurs → Lambda contient tout ✅

## 📊 Avant / Après

### Avant (❌)

```
Lambda cherche : /var/task/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node
Présent : NON (file tracing ne l'a pas inclus)
Résultat : Prisma Client could not locate the Query Engine
```

### Après (✅)

```
Lambda cherche : /var/task/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node
Présent : OUI (outputFileTracingIncludes l'a forcé)
Résultat : ✅ Fonctionne parfaitement
```

## ⚠️ Points importants

1. **`outputFileTracingIncludes` est LA CLÉ**

   - C'est la configuration qui résout le problème
   - Elle force l'inclusion des binaires Prisma dans le standalone
   - Sans elle, les moteurs ne sont PAS copiés

2. **`output: 'standalone'` est REQUIS**

   - C'est le seul mode où on peut contrôler le file tracing
   - Sans lui, Vercel fait son propre bundling

3. **`serverExternalPackages` est REQUIS**

   - Empêche Next.js de bundler Prisma
   - Permet d'utiliser les binaires natifs

4. **Le `PrismaPlugin` webpack est un bonus**
   - Fournit une copie supplémentaire dans `.next/server/`
   - Mais `outputFileTracingIncludes` est suffisant

## 🎯 Fichiers concernés par l'erreur

- `app/components/Auth/WalletEventListener.tsx` : Composant client
- `lib/actions/dynamic-actions.ts` : Server Action avec Prisma
- `lib/actions/auth-actions.ts` : Server Actions avec Prisma
- Toutes les Server Actions qui utilisent Prisma

## ✅ Checklist de vérification

Avant de déployer, vérifiez que :

- [ ] `prisma/schema.prisma` contient `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
- [ ] `next.config.ts` contient `output: 'standalone'`
- [ ] `next.config.ts` contient `outputFileTracingIncludes` avec Prisma
- [ ] `next.config.ts` contient `serverExternalPackages`
- [ ] `next.config.ts` inclut le `PrismaPlugin` webpack
- [ ] Plugin installé : `@prisma/nextjs-monorepo-workaround-plugin`
- [ ] `types/prisma-plugin.d.ts` existe
- [ ] Build local fonctionne : `npm run build`
- [ ] Moteurs dans standalone : `ls .next/standalone/node_modules/.prisma/client/`

## 📚 Sources et références

- [Next.js outputFileTracingIncludes](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Prisma + Vercel Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next.js 16 Output Standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Prisma Plugin NPM](https://www.npmjs.com/package/@prisma/nextjs-monorepo-workaround-plugin)

## 🎉 Résultat

Cette solution :

- ✅ Fonctionne avec Server Actions appelées depuis le client
- ✅ Fonctionne avec API Routes
- ✅ Fonctionne sur Lambda AWS (Vercel)
- ✅ Compatible Next.js 16
- ✅ Build local et production identiques
- ✅ Pas de service externe requis (pas de Prisma Accelerate)
- ✅ Performance optimale (pas de cold start)
- ✅ **Simple et maintenable** (pas de script de copie manuel)

---

**Le problème Prisma sur Vercel avec Next.js 16 est DÉFINITIVEMENT RÉSOLU avec `outputFileTracingIncludes` ! 🎉**
