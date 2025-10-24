# Configuration Prisma pour Next.js 16 sur Vercel

## Problème rencontré

Avec Next.js 16.0.0 déployé sur Vercel, l'erreur suivante apparaissait :

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

## Solution mise en place

### 1. Configuration Prisma (`prisma/schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
  engineType      = "binary"
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]
}
```

**Important :**

- `engineType = "binary"` : Utilise le moteur binaire natif
- `binaryTargets = ["native", "rhel-openssl-3.0.x"]` : Spécifie le moteur pour Vercel

### 2. Configuration Next.js 16 (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "@prisma/engines"],
  // ...
};
```

**Important :**

- `output: 'standalone'` : Mode de build optimisé pour Vercel
- `serverExternalPackages` : Empêche le bundling de Prisma (nouvelle syntaxe Next.js 16)

### 3. Script postinstall (`scripts/postinstall.sh`)

Un script bash qui génère automatiquement le client Prisma après l'installation des dépendances.

### 4. Configuration Vercel (`vercel.json`)

```json
{
  "installCommand": "npm install --legacy-peer-deps"
}
```

### 5. Package.json

```json
{
  "scripts": {
    "postinstall": "bash scripts/postinstall.sh",
    "build": "npx prisma generate && next build"
  }
}
```

## Déploiement

1. Committez les changements :

   ```bash
   git add .
   git commit -m "Fix Prisma configuration for Next.js 16 on Vercel"
   ```

2. Pushez vers votre branche :

   ```bash
   git push origin main
   ```

3. Vercel déploiera automatiquement avec la nouvelle configuration !

## Vérification

Après le déploiement, vérifiez que :

- Le build Vercel se termine avec succès
- Les API routes utilisant Prisma fonctionnent correctement
- Aucune erreur de moteur de requête n'apparaît dans les logs

## Notes

- Cette configuration est spécifique à Next.js 16 et Vercel
- Le mode `standalone` est requis pour le bon fonctionnement de Prisma sur Vercel
- Les moteurs Prisma sont automatiquement inclus dans le déploiement
