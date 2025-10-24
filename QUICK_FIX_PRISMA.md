# ⚡ Fix rapide - Prisma sur Vercel

## 🔴 Erreur

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
libquery_engine-rhel-openssl-3.0.x.so.node not found
```

## ✅ Solution en 5 minutes

### 1. `prisma/schema.prisma`

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]  // ← Important
}
```

### 2. `next.config.ts`

```typescript
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  output: "standalone", // ← Important
  serverExternalPackages: ["@prisma/client", "@prisma/engines"],

  // ⭐ LA CLÉ : Force l'inclusion des moteurs Prisma
  outputFileTracingIncludes: {
    "/*": [
      "node_modules/.prisma/client/**/*",
      "node_modules/@prisma/client/**/*",
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};
```

### 3. `vercel.json`

```json
{
  "buildCommand": "npx prisma generate && npm run build",
  "installCommand": "npm install --legacy-peer-deps"
}
```

### 4. `types/prisma-plugin.d.ts` (créer)

```typescript
declare module "@prisma/nextjs-monorepo-workaround-plugin" {
  import { Compiler } from "webpack";

  export class PrismaPlugin {
    constructor();
    apply(compiler: Compiler): void;
  }
}
```

### 5. Installer & déployer

```bash
npm install --save-dev @prisma/nextjs-monorepo-workaround-plugin
git add .
git commit -m "fix: Prisma engines avec outputFileTracingIncludes"
git push
```

## ✅ Vérifier que ça fonctionne

```bash
npm run build
ls .next/standalone/node_modules/.prisma/client/ | grep rhel
# Doit afficher : libquery_engine-rhel-openssl-3.0.x.so.node
```

## 🔑 La clé de la solution

**`outputFileTracingIncludes`** : C'est LA configuration qui résout le problème ! Elle force Next.js à inclure les binaires Prisma dans le build standalone.

## 📖 Documentation complète

Voir `SOLUTION_FINALE_PRISMA.md` pour tous les détails.
