# Scripts du projet

## 📦 Scripts de build

### `copy-prisma-engines.sh`

**Objectif** : Copie les moteurs Prisma dans le build standalone pour le déploiement sur Vercel.

**Utilisation** :


```bash
bash scripts/copy-prisma-engines.sh
```

**Quand est-il exécuté ?**

- Automatiquement après `npm run build` sur Vercel (via `vercel.json`)
- Manuellement en local pour tester

**Ce qu'il fait** :

1. Vérifie que `.next/standalone/` existe
2. Crée le dossier `.next/standalone/node_modules/.prisma/client/`
3. Copie tous les moteurs Prisma depuis `node_modules/.prisma/client/`
4. Copie aussi `@prisma/client`
5. Affiche la liste des fichiers copiés

**Pourquoi c'est nécessaire ?**

Next.js 16 avec `output: 'standalone'` ne copie pas automatiquement les binaires Prisma dans le build standalone. Sans ce script, Vercel Lambda ne trouve pas les moteurs et Prisma échoue avec :

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

### `postinstall.sh`

**Objectif** : Génère le client Prisma après l'installation des dépendances.

**Utilisation** :

```bash
bash scripts/postinstall.sh
```

**Quand est-il exécuté ?**

- Automatiquement après `npm install` (hook `postinstall` dans `package.json`)

**Ce qu'il fait** :

```bash
npx prisma generate
```

## 🧪 Scripts de test

### `test-google-translation.ts`

Test du service de traduction Google.

### `test-html-translation.ts`

Test de la traduction de contenu HTML.

### `test-complete-translation.ts`

Test du système de traduction complet.

### `test-complete-translation-standalone.ts`

Test de la traduction en mode standalone.

### `test-reading-time.ts`

Test du calcul du temps de lecture.

### `test-seo-post-update.ts`

Test de la mise à jour des posts SEO.

### `test-bulk-add.ts`

Test de l'ajout en masse de données.

## 🛠️ Scripts d'analyse

### `analyze-css.js`

Analyse l'utilisation du CSS dans le projet.

**Utilisation** :

```bash
npm run analyze-css
```

## 📝 Notes

- Tous les scripts bash doivent avoir les permissions d'exécution : `chmod +x scripts/*.sh`
- Les scripts TypeScript utilisent `tsx` pour l'exécution
- Les scripts sont exécutés depuis la racine du projet
