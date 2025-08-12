# Cursor Rules for Next.js Development

Ce dossier contient un ensemble complet de règles Cursor pour le développement Next.js, basées sur la documentation officielle et les meilleures pratiques de l'industrie.

## 📁 Structure des Règles

### 1. **nextjs-best-practices.mdc** - Règles générales

- **Portée** : Tous les fichiers TypeScript/JavaScript
- **Type** : Auto Attached
- **Contenu** : Principes fondamentaux, architecture App Router, composants, gestion d'état, etc.

### 2. **nextjs-ui-patterns.mdc** - Patterns UI et composants

- **Portée** : Composants et pages de l'application
- **Type** : Auto Attached
- **Contenu** : Patterns de composants, layouts, gestion d'erreurs, formulaires, etc.

### 3. **nextjs-performance.mdc** - Optimisation des performances

- **Portée** : Tous les fichiers
- **Type** : Auto Attached
- **Contenu** : Stratégies de rendu, optimisation des composants, code splitting, etc.

### 4. **nextjs-security-validation.mdc** - Sécurité et validation

- **Portée** : Tous les fichiers
- **Type** : Auto Attached
- **Contenu** : Validation des données, prévention XSS, protection CSRF, etc.

## 🚀 Comment Utiliser

### Activation Automatique

Les règles sont configurées pour s'appliquer automatiquement aux fichiers correspondants :

- **TypeScript/JavaScript** : Tous les fichiers `.ts`, `.tsx`, `.js`, `.jsx`
- **Composants** : Fichiers dans les dossiers `components/` et `app/`

### Vérification

Pour vérifier que les règles sont actives :

1. Ouvrez Cursor
2. Regardez la barre latérale Agent
3. Les règles actives doivent apparaître dans la liste

### Test des Règles

Posez des questions à l'IA dans Cursor :

- "Comment optimiser les performances de mon composant ?"
- "Quelle est la meilleure façon de valider les données ?"
- "Comment implémenter un Server Component ?"

## 📚 Contenu des Règles

### Architecture App Router

- Server Components vs Client Components
- File-based routing
- Layouts et pages
- Gestion des erreurs

### Performance

- Rendu statique et dynamique
- Code splitting
- Optimisation des images
- Suspense et streaming

### Sécurité

- Validation avec Zod
- Prévention XSS
- Protection CSRF
- Rate limiting
- Headers de sécurité

### Patterns UI

- Composants réutilisables
- Gestion des formulaires
- États de chargement
- Gestion des erreurs

## 🔧 Configuration

### Frontmatter YAML

Chaque règle contient un frontmatter avec :

```yaml
---
description: Description de la règle
globs: ["**/*.{ts,tsx,js,jsx}"]
alwaysApply: false
---
```

### Personnalisation

Vous pouvez modifier les règles selon vos besoins :

- Ajuster les patterns de fichiers
- Ajouter vos conventions spécifiques
- Modifier les exemples de code

## 📖 Références

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Cursor Rules](https://docs.cursor.com/en/context/rules)
- [Zod Documentation](https://zod.dev/)
- [React Documentation](https://react.dev/)

## 🤝 Contribution

Pour améliorer ces règles :

1. Modifiez les fichiers `.mdc` correspondants
2. Testez avec l'IA de Cursor
3. Committez vos changements
4. Partagez avec l'équipe

## 💡 Conseils d'Utilisation

### Pour les Développeurs

- Lisez les règles avant de commencer un nouveau composant
- Utilisez les exemples de code comme référence
- Adaptez les patterns à votre cas d'usage

### Pour l'Équipe

- Standardisez le développement avec ces règles
- Utilisez-les pour les code reviews
- Mettez à jour selon l'évolution de Next.js

### Pour les Nouveaux Projets

- Copiez ces règles dans votre nouveau projet
- Adaptez selon vos besoins spécifiques
- Ajoutez vos propres conventions

## 🔄 Mise à Jour

Ces règles sont basées sur :

- Next.js 15 (dernière version stable)
- React 19 (canary features)
- Meilleures pratiques actuelles

Mettez-les à jour régulièrement pour suivre l'évolution de l'écosystème.
