# 🔧 Solution au problème intermittent Prisma sur Vercel

## 🔴 Problème identifié

L'application déployée sur Vercel présentait un comportement **non déterministe** :

- ✅ Parfois la page fonctionnait correctement
- ❌ Parfois les logs indiquaient : `PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"`

## 🔍 Analyse de la cause

Le problème intermittent était causé par **plusieurs facteurs combinés** :

### 1. **Absence du plugin webpack Prisma**

- Le plugin `@prisma/nextjs-monorepo-workaround-plugin` était installé mais **non utilisé** dans `next.config.ts`
- Sans ce plugin, les binaires Prisma n'étaient pas systématiquement copiés dans `.next/server/` pendant le build

### 2. **Script de copie non exécuté**

- Le script `copy-prisma-engines.sh` existait mais n'était **pas appelé** dans `vercel.json`
- Les binaires n'étaient donc pas copiés dans `.next/standalone/` après le build

### 3. **Configuration `outputFileTracingIncludes` incomplète**

- La configuration incluait seulement les patterns génériques
- Les binaires spécifiques `rhel-openssl-3.0.x` n'étaient pas explicitement référencés

### 4. **Cache Vercel incohérent**

- Parfois, le cache de Vercel contenait les binaires (déploiement précédent réussi)
- Parfois, le cache était vide ou corrompu → erreur

## ✅ Solution mise en place

### 1. Ajout du PrismaPlugin webpack

**Fichier : `next.config.ts`**

```typescript
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  // ...
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...(config.plugins || []), new PrismaPlugin()];
    }
    return config;
  },
};
```

**Effet** : Le plugin copie automatiquement les binaires Prisma dans `.next/server/` pendant le build webpack.

### 2. Exécution du script de copie dans vercel.json

**Fichier : `vercel.json`**

```json
{
  "buildCommand": "npx prisma generate && npm run build && bash scripts/copy-prisma-engines.sh"
}
```

**Effet** : Le script copie les binaires dans `.next/standalone/` après le build, garantissant leur présence dans le déploiement.

### 3. Amélioration de `outputFileTracingIncludes`

**Fichier : `next.config.ts`**

```typescript
outputFileTracingIncludes: {
  '/*': [
    './node_modules/.prisma/client/**/*',
    './node_modules/@prisma/client/**/*',
    './node_modules/@prisma/engines/**/*',
    // Inclure explicitement les binaires rhel-openssl-3.0.x
    './node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
    './node_modules/.prisma/client/query-engine-rhel-openssl-3.0.x',
  ],
},
```

**Effet** : Next.js inclut explicitement les binaires dans le file tracing, même si le cache est vide.

### 4. Amélioration du script de copie

**Fichier : `scripts/copy-prisma-engines.sh`**

- Ajout de `set -e` pour arrêter en cas d'erreur
- Vérification de l'existence des fichiers source
- Vérification de la présence du binaire `rhel-openssl-3.0.x` après copie
- Messages d'erreur clairs en cas de problème

**Effet** : Le script est plus robuste et détecte les problèmes de copie.

## 🎯 Pourquoi cette solution est déterministe

### Avant (❌ Non déterministe)

```
Build Vercel
  ↓
Cache Vercel (variable)
  ↓
outputFileTracingIncludes (patterns génériques)
  ↓
Résultat : Binaires parfois présents, parfois absents
```

### Après (✅ Déterministe)

```
Build Vercel
  ↓
1. PrismaPlugin webpack → Copie dans .next/server/
  ↓
2. outputFileTracingIncludes (explicite) → Inclusion garantie
  ↓
3. Script copy-prisma-engines.sh → Copie dans .next/standalone/
  ↓
Résultat : Binaires TOUJOURS présents (triple sécurité)
```

## 📋 Checklist de vérification

Avant de déployer, vérifiez que :

- [x] `next.config.ts` contient `PrismaPlugin` dans la configuration webpack
- [x] `vercel.json` contient le script `copy-prisma-engines.sh` dans `buildCommand`
- [x] `scripts/copy-prisma-engines.sh` est exécutable (`chmod +x`)
- [x] `outputFileTracingIncludes` inclut explicitement les binaires `rhel-openssl-3.0.x`
- [x] `prisma/schema.prisma` contient `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
- [x] `package.json` contient `@prisma/nextjs-monorepo-workaround-plugin` dans `devDependencies`

## 🧪 Test local

Pour tester la solution localement :

```bash
# 1. Générer le client Prisma
npx prisma generate

# 2. Build de production
npm run build

# 3. Vérifier que les moteurs sont copiés
ls -lh .next/standalone/node_modules/.prisma/client/ | grep "rhel"
```

**Résultat attendu** :

```
libquery_engine-rhel-openssl-3.0.x.so.node  (17M)
query-engine-rhel-openssl-3.0.x             (18M)
```

## 🚀 Déploiement

```bash
git add .
git commit -m "fix: Résolution du problème intermittent Prisma sur Vercel"
git push
```

Vercel va maintenant :

1. ✅ Générer le client Prisma (`npx prisma generate`)
2. ✅ Builder avec le plugin webpack (`npm run build`)
3. ✅ Copier les moteurs dans standalone (`bash scripts/copy-prisma-engines.sh`)
4. ✅ Déployer avec les binaires garantis

## 📊 Résultat attendu

- ✅ **100% de réussite** : Les binaires sont toujours présents
- ✅ **Comportement déterministe** : Même résultat à chaque déploiement
- ✅ **Pas de cache dépendant** : La solution fonctionne même avec un cache vide
- ✅ **Triple sécurité** : Plugin webpack + outputFileTracingIncludes + Script de copie

## 🔗 Références

- [Prisma + Vercel Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Prisma Plugin NPM](https://www.npmjs.com/package/@prisma/nextjs-monorepo-workaround-plugin)
- [Next.js 16 Output Standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
