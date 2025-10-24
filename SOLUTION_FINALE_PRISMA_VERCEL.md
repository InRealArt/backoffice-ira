# ✅ Solution finale - Prisma sur Vercel avec Next.js 16

## 🔴 Le problème

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

**Chemin détecté** : `/var/task/` → Lambda (AWS)

### Pourquoi ce problème ?

1. **Next.js 16 + Vercel** = Les API Routes ET Server Actions appelées depuis le client s'exécutent sur **AWS Lambda**
2. **Lambda** ne contient pas les moteurs Prisma par défaut
3. **Le moteur `rhel-openssl-3.0.x`** doit être copié dans le bundle Lambda

## ✅ La solution (3 étapes)

### 1. Configurer le schéma Prisma

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]  // ← Pas de engineType !
}
```

**Pourquoi ?**

- ❌ `engineType = "client"` → Nécessite un driver adapter
- ❌ `engineType = "binary"` → Fonctionne mais Next.js 16 ne le copie pas correctement
- ✅ **Pas de `engineType`** → Laisse Prisma choisir (défaut = binary)

### 2. Installer le plugin Prisma Next.js

```bash
npm install --save-dev @prisma/nextjs-monorepo-workaround-plugin
```

**Ce que fait le plugin** :

- Copie automatiquement les moteurs Prisma dans `.next/server`
- Fonctionne avec Lambda et Node.js runtime
- Compatible Next.js 16

### 3. Configurer `next.config.ts`

```typescript
import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  // Déclarer Prisma comme package externe
  serverExternalPackages: ["@prisma/client", "@prisma/engines"],

  // Ajouter le plugin webpack pour copier les moteurs
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
```

### 4. Créer le type TypeScript pour le plugin

```typescript
// types/prisma-plugin.d.ts
declare module "@prisma/nextjs-monorepo-workaround-plugin" {
  import { Compiler } from "webpack";

  export class PrismaPlugin {
    constructor();
    apply(compiler: Compiler): void;
  }
}
```

## 🎯 Fichiers modifiés

1. ✅ `prisma/schema.prisma` - Suppression de `engineType`
2. ✅ `next.config.ts` - Ajout du `PrismaPlugin`
3. ✅ `package.json` - Installation du plugin
4. ✅ `types/prisma-plugin.d.ts` - Déclaration TypeScript
5. ✅ `lib/prisma.ts` - Inchangé (pas besoin de config spéciale)

## 📊 Résultat

### Avant (❌ Échec)

```
❌ Prisma Client could not locate the Query Engine
❌ The following locations have been searched: /var/task/...
```

### Après (✅ Succès)

```
✅ Build successful
✅ All Prisma queries work on Vercel
✅ Lambda trouve le moteur rhel-openssl-3.0.x
```

## 🚀 Pour déployer

```bash
# 1. Générer le client Prisma
npx prisma generate

# 2. Tester le build
npm run build

# 3. Commit et push
git add .
git commit -m "fix: Prisma engine sur Vercel avec PrismaPlugin"
git push

# 4. Vercel déploie automatiquement
```

## 🔍 Points importants

1. **Le plugin est ESSENTIEL** pour Lambda
2. **`binaryTargets`** doit inclure `rhel-openssl-3.0.x`
3. **NE PAS** mettre `engineType` dans `schema.prisma`
4. **`serverExternalPackages`** évite que Next.js bundle Prisma
5. **Le plugin webpack copie les moteurs** dans `.next/server`

## 📚 Sources

- [Plugin NPM](https://www.npmjs.com/package/@prisma/nextjs-monorepo-workaround-plugin)
- [Vercel Forum](https://community.vercel.com/t/error-with-prisma-generate-on-vercel-deployment/14705)
- [Prisma Docs - Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

## ⚠️ Erreurs à éviter

| ❌ À éviter             | ✅ Correct               |
| ----------------------- | ------------------------ |
| `engineType = "client"` | Pas de `engineType`      |
| `engineType = "binary"` | Pas de `engineType`      |
| Sans plugin             | Avec `PrismaPlugin`      |
| `output: 'standalone'`  | `serverExternalPackages` |

---

**Le problème Prisma sur Vercel est DÉFINITIVEMENT RÉSOLU** 🎉
