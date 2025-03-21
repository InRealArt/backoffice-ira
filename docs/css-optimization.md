# Optimisation CSS dans le projet

Ce document explique comment nous optimisons les performances CSS dans le projet InRealArt Backoffice.

## Implémentation de PurgeCSS

Nous avons implémenté PurgeCSS pour éliminer automatiquement les classes CSS inutilisées lors du build de production. Cette optimisation permet de réduire significativement la taille des fichiers CSS générés.

### Configuration

La configuration de PurgeCSS se trouve dans `postcss.config.js`. Elle est configurée pour:

1. Analyser tous les fichiers JS/TS/JSX/TSX dans le projet
2. Supprimer les classes CSS qui ne sont pas utilisées
3. Conserver certaines classes importantes via une liste de sauvegarde (safelist)
4. S'exécuter uniquement en mode production

### Liste de sauvegarde (Safelist)

Certaines classes doivent être conservées même si elles ne sont pas détectées comme utilisées:

- Classes générées dynamiquement (ex: `btn-primary`, `status-success`)
- Classes utilisées par des bibliothèques tierces
- Classes utilisées dans des scripts JavaScript

Ces classes sont configurées dans la `safelist` du fichier `postcss.config.js`.

## Scripts utilitaires

Deux scripts ont été créés pour aider à l'optimisation CSS:

### 1. Analyse CSS (`npm run analyze-css`)

Ce script analyse les classes CSS définies et utilisées dans le projet. Il génère un rapport JSON qui répertorie:

- Les classes CSS définies dans les fichiers SCSS
- Les classes utilisées dans les composants JSX/TSX
- Les classes potentiellement inutilisées
- Les classes utilisées mais non définies

Pour exécuter l'analyse:

```bash
npm run analyze-css
```

### 2. Nettoyage manuel (`node scripts/clean-css.js`)

Ce script permet de nettoyer manuellement les classes CSS inutilisées:

- Recherche de classes spécifiques
- Affichage des classes inutilisées avec leur emplacement
- Génération d'un fichier de sauvegarde contenant uniquement les classes utilisées

Pour l'utiliser, exécutez d'abord l'analyse CSS, puis:

```bash
node scripts/clean-css.js
```

## Construction optimisée

Pour générer un build avec l'optimisation CSS:

```bash
npm run build:prod
```

Cette commande garantit que PurgeCSS s'exécute pendant le build et supprime les classes inutilisées.

## Bonnes pratiques

Pour maintenir un CSS optimisé:

1. **Utiliser des noms de classes significatifs** pour faciliter la maintenance
2. **Éviter les classes génériques** qui peuvent être difficiles à suivre
3. **Préférer les classes avec préfixes** (ex: `btn-`, `form-`) pour regrouper les styles liés
4. **Documenter les classes dynamiques** pour qu'elles soient ajoutées à la safelist
5. **Exécuter l'analyse régulièrement** pour identifier les classes inutilisées

## Résultats attendus

L'optimisation des CSS devrait produire:

- Réduction de la taille des fichiers CSS de 20-40%
- Amélioration du temps de chargement des pages
- Diminution du temps d'analyse CSS par le navigateur
- Simplification de la maintenance des styles
