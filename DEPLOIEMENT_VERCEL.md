# 🚀 Guide de déploiement Vercel

## ✅ Prérequis

Avant de déployer, assurez-vous que :

1. **Variables d'environnement** sont configurées sur Vercel :

   - `DATABASE_URL`
   - `DIRECT_URL`
   - Toutes les autres variables nécessaires (Firebase, Dynamic, etc.)

2. **Le build local fonctionne** :

   ```bash
   npm run build
   ```

3. **Les moteurs Prisma sont copiés** :
   ```bash
   ls .next/standalone/node_modules/.prisma/client/ | grep rhel
   ```
   Résultat attendu :
   ```
   libquery_engine-rhel-openssl-3.0.x.so.node
   query-engine-rhel-openssl-3.0.x
   ```

## 🔧 Configuration Vercel

### Fichiers de configuration

#### `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npx prisma generate && npm run build && bash scripts/copy-prisma-engines.sh",
  "installCommand": "npm install --legacy-peer-deps"
}
```

**Important** :

- `buildCommand` : Génère Prisma, build Next.js, copie les moteurs
- `installCommand` : `--legacy-peer-deps` nécessaire pour les dépendances

#### `next.config.ts`

```typescript
{
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }
    return config
  }
}
```

## 📦 Processus de déploiement

### 1. Commit et push

```bash
git add .
git commit -m "fix: Prisma engines sur Vercel avec copie standalone"
git push origin main
```

### 2. Vercel détecte le push

Vercel va automatiquement :

1. Cloner le repository
2. Installer les dépendances : `npm install --legacy-peer-deps`
3. Générer le client Prisma : `npx prisma generate`
4. Builder l'application : `npm run build`
5. Copier les moteurs : `bash scripts/copy-prisma-engines.sh`
6. Créer le déploiement

### 3. Vérification du déploiement

Dans les logs Vercel, vous devriez voir :

```
✅ Générer le client Prisma
✅ Build Next.js successful
🔧 Copie des moteurs Prisma dans le build standalone...
✅ Moteurs Prisma copiés avec succès
📦 Fichiers copiés :
  libquery_engine-rhel-openssl-3.0.x.so.node
  query-engine-rhel-openssl-3.0.x
```

## 🐛 Troubleshooting

### Erreur : "Prisma Client could not locate the Query Engine"

**Causes possibles** :

1. **Le script de copie n'a pas été exécuté**

   - Vérifier que `vercel.json` contient le `buildCommand` avec le script
   - Vérifier que le script est exécutable : `chmod +x scripts/copy-prisma-engines.sh`

2. **Le build standalone n'existe pas**

   - Vérifier que `next.config.ts` contient `output: 'standalone'`

3. **Les moteurs n'ont pas été générés**
   - Vérifier que `prisma/schema.prisma` contient `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
   - Exécuter manuellement : `npx prisma generate`

### Erreur : "sh: 1: xport: not found"

**Cause** : Erreur de syntaxe dans un script bash (généralement `export` mal écrit)

**Solution** : Vérifier les scripts bash pour les erreurs de syntaxe

### Erreur : "npm error code 1" pendant postinstall

**Cause** : Le script postinstall échoue

**Solution** :

1. Vérifier `scripts/postinstall.sh`
2. Tester en local : `bash scripts/postinstall.sh`
3. S'assurer que le schema Prisma est valide

### Erreur : "Type 'string | undefined' is not assignable to type 'undefined'"

**Cause** : Configuration TypeScript incorrecte pour Prisma

**Solution** : Ne pas mettre `engineType` dans le PrismaClient, seulement dans `schema.prisma`

## 📊 Vérification post-déploiement

### 1. Tester l'authentification

Connectez-vous avec un wallet et vérifiez dans les logs Vercel :

```
✅ Pas d'erreur Prisma
✅ Les requêtes Prisma fonctionnent
```

### 2. Tester les Server Actions

Les Server Actions suivantes doivent fonctionner :

- `checkAuthorizedUser(email)`
- `checkIsAdmin(email)`
- `updateLinkedWallets(address, wallet)`
- `getLinkedWallets(address)`

### 3. Vérifier les logs

Dans Vercel Dashboard → Votre projet → Logs :

- Pas d'erreur "Query Engine not found"
- Les requêtes Prisma s'exécutent correctement

## 🔄 Redéploiement

Si vous modifiez le schéma Prisma :

```bash
# 1. Générer la migration
npx prisma migrate dev --name description_du_changement

# 2. Commit
git add .
git commit -m "feat: Migration Prisma - description"
git push

# 3. Sur Vercel, exécuter la migration
# (via un script ou manuellement dans le dashboard)
```

## 📝 Checklist avant déploiement

- [ ] Build local fonctionne : `npm run build`
- [ ] Moteurs copiés : `ls .next/standalone/node_modules/.prisma/client/`
- [ ] Variables d'environnement configurées sur Vercel
- [ ] `vercel.json` contient le bon `buildCommand`
- [ ] `next.config.ts` contient `output: 'standalone'`
- [ ] `prisma/schema.prisma` contient les `binaryTargets`
- [ ] Script `copy-prisma-engines.sh` est exécutable
- [ ] Pas d'erreur TypeScript : `npm run lint`

## 🎯 Commandes utiles

```bash
# Build de production local
npm run build

# Tester le script de copie
bash scripts/copy-prisma-engines.sh

# Vérifier les moteurs
ls -lh .next/standalone/node_modules/.prisma/client/ | grep engine

# Lint
npm run lint

# Générer Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev
```

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Prisma + Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next.js Standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Solution détaillée](./SOLUTION_DEFINITIVE_PRISMA.md)

---

**En cas de problème, référez-vous à `SOLUTION_DEFINITIVE_PRISMA.md` pour l'analyse complète.**
