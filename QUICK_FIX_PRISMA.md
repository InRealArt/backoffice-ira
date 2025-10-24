# ⚡ Fix rapide - Prisma sur Vercel

## 🔴 Erreur

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

## ✅ Solution en 3 minutes

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
  "buildCommand": "npx prisma generate && npm run build && bash scripts/copy-prisma-engines.sh",
  "installCommand": "npm install --legacy-peer-deps"
}
```

### 4. `scripts/copy-prisma-engines.sh` (créer)

```bash
#!/bin/bash
mkdir -p .next/standalone/node_modules/.prisma/client
cp -r node_modules/.prisma/client/* .next/standalone/node_modules/.prisma/client/
mkdir -p .next/standalone/node_modules/@prisma
cp -r node_modules/@prisma/client .next/standalone/node_modules/@prisma/
echo "✅ Moteurs Prisma copiés"
```

### 5. Installer & déployer

```bash
npm install --save-dev @prisma/nextjs-monorepo-workaround-plugin
chmod +x scripts/copy-prisma-engines.sh
git add .
git commit -m "fix: Prisma engines sur Vercel"
git push
```

## 📖 Documentation complète

Voir `SOLUTION_DEFINITIVE_PRISMA.md` pour les détails complets.
