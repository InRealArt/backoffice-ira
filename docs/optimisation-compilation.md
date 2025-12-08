# 🚀 Optimisation de la Compilation Next.js

## 🔴 Problème identifié

La compilation prend énormément de temps lors du démarrage du serveur de développement.

## 📊 Causes principales

### 1. **Turbopack en mode développement**

- Turbopack peut être plus lent lors de la première compilation
- Avec des configurations complexes (Prisma, webpack plugins), il peut avoir des problèmes de cache

### 2. **Configuration Prisma complexe**

- Plugin webpack personnalisé pour Prisma
- Beaucoup de configurations de file tracing
- Traitement des binaires Prisma

### 3. **Volume de fichiers**

- **360 fichiers TypeScript/TSX** à compiler
- Beaucoup de dépendances lourdes (Three.js, Firebase, Wagmi, etc.)

### 4. **Providers lourds au démarrage**

- `DynamicContextProvider` (blockchain)
- `WagmiProvider` (Web3)
- `QueryClientProvider` (React Query)
- Tous chargés dans le layout racine

### 5. **TypeScript strict mode**

- Vérifications strictes sur tous les fichiers
- Peut ralentir la compilation initiale

## ✅ Solutions appliquées

### 1. Optimisation TypeScript (`tsconfig.json`)

**Exclusions ajoutées** :

```json
"exclude": [
  "node_modules",
  ".next",
  "out",
  "dist",
  "build",
  "scripts",
  "migrations"
]
```

**Bénéfices** :

- Réduction du nombre de fichiers à analyser
- Exclusion des dossiers non nécessaires à la compilation

### 2. Optimisation Next.js (`next.config.ts`)

**Optimisation des imports de packages** :

```typescript
experimental: {
  optimizePackageImports: [
    '@radix-ui/react-icons',
    'lucide-react',
    '@tanstack/react-query',
    'date-fns',
  ],
}
```

**Bénéfices** :

- Tree-shaking amélioré
- Imports sélectifs au lieu d'importer tout le package
- Réduction de la taille du bundle

### 3. Script alternatif sans Turbopack

**Nouveau script** : `npm run dev:webpack`

Permet de tester si Turbopack est la cause du problème.

## 🔧 Solutions supplémentaires recommandées

### 1. Tester sans Turbopack

```bash
npm run dev:webpack
```

Si c'est plus rapide, le problème vient de Turbopack avec votre configuration.

### 2. Nettoyer le cache

```bash
rm -rf .next
npm run dev
```

### 3. Vérifier les imports lourds

Éviter d'importer des bibliothèques lourdes dans le layout racine si elles ne sont pas utilisées partout :

```typescript
// ❌ Mauvais : import dans le layout racine
import { Canvas } from "@react-three/fiber";

// ✅ Bon : import dynamique dans le composant qui l'utilise
const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  {
    ssr: false,
  }
);
```

### 4. Optimiser les providers

Si certains providers ne sont pas nécessaires sur toutes les pages, les déplacer vers des layouts spécifiques :

```typescript
// Layout racine : providers essentiels uniquement
// Layout blockchain : providers Web3 uniquement
```

### 5. Utiliser le cache TypeScript

Le cache TypeScript est déjà activé avec `"incremental": true`. Vérifier que le fichier `.tsbuildinfo` est présent et à jour.

## 📈 Mesures de performance

### Avant optimisation

- Compilation initiale : ~30-60 secondes (selon la machine)
- Recompilation : ~5-15 secondes

### Après optimisation (attendu)

- Compilation initiale : ~20-40 secondes
- Recompilation : ~3-10 secondes

## 🎯 Actions immédiates

1. **Tester sans Turbopack** :

   ```bash
   npm run dev:webpack
   ```

2. **Nettoyer le cache** :

   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Observer les temps de compilation** :

   - Notez le temps de compilation initial
   - Notez le temps de recompilation après un changement

4. **Si toujours lent** :
   - Vérifier les imports dans `lib/providers.tsx`
   - Considérer le lazy loading des providers non essentiels
   - Vérifier s'il y a des imports circulaires

## 📝 Notes

- La première compilation sera toujours plus lente (génération des types, cache, etc.)
- Les recompilations suivantes devraient être beaucoup plus rapides grâce au cache
- Turbopack est encore en développement et peut avoir des problèmes avec certaines configurations complexes
