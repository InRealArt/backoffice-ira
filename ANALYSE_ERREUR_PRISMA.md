# 🔍 Analyse approfondie de l'erreur Prisma sur Vercel

## 🔴 L'erreur exacte

```
Échec de l'ajout du wallet Turnkey HD:
Invalid `prisma.backofficeUser.findUnique()` invocation:

Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".
This is likely caused by tooling that has not copied "libquery_engine-rhel-openssl-3.0.x.so.node" to the deployment folder.

The following locations have been searched:
  /var/task/node_modules/.prisma/client
  /var/task/node_modules/@prisma/client
  /vercel/path0/node_modules/@prisma/client
  /tmp/prisma-engines
  /var/task/prisma
```

## 🎯 Origine de l'erreur

### Flux d'exécution

1. **Composant client** : `app/components/Auth/WalletEventListener.tsx` (ligne 46)
2. **Appel Server Action** : `updateLinkedWallets(primaryWallet.address, walletInfo)`
3. **Server Action** : `lib/actions/dynamic-actions.ts` (ligne 18)
4. **Requête Prisma** : `prisma.backofficeUser.findUnique({ where: { walletAddress } })`

### Environnement d'exécution

- ❌ **Lambda AWS** (`/var/task/`)
- ❌ **Pas Node.js runtime**
- ❌ **Les Server Actions appelées depuis le client = Lambda**

## 🧩 Pourquoi le plugin ne fonctionne pas ?

Le `@prisma/nextjs-monorepo-workaround-plugin` copie les moteurs dans `.next/server/`, mais :

1. **Vercel bundle Lambda** ne prend pas tout le contenu de `.next/server/`
2. **Lambda cherche** dans `/var/task/node_modules/.prisma/client`
3. **Next.js 16** ne copie pas automatiquement les binaires Prisma dans les fonctions Lambda

## 💡 Solutions possibles

### Solution 1 : Forcer le runtime Node.js pour les Server Actions ❌

**Impossible** : On ne peut pas définir `export const runtime = 'nodejs'` dans un fichier Server Action qui contient uniquement `'use server'`.

### Solution 2 : Utiliser Prisma Data Proxy / Accelerate ✅

**Avantage** : Pas besoin de moteur local, tout passe par HTTP.

**Inconvénient** : Service payant après le tier gratuit.

### Solution 3 : Configuration Vercel spécifique ✅

Forcer Vercel à inclure les moteurs Prisma dans le bundle Lambda.

### Solution 4 : Utiliser `output: 'standalone'` avec copie manuelle ⚠️

Nécessite un script post-build personnalisé.

### Solution 5 : Migrer vers API Routes avec `runtime = 'nodejs'` ⚠️

Retour en arrière, mais on perd les avantages des Server Actions.
