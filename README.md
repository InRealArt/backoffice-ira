This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Documentation

- [Guide de migration des styles](/app/styles/migration-guide.md)
- [Optimisation CSS](/docs/css-optimization.md)

# Script d'exécution des tarifs d'expédition Shippo

Ce script permet d'exécuter toutes les combinaisons possibles d'envois entre différentes adresses avec différents types de colis, et de générer un fichier CSV contenant les tarifs proposés par les transporteurs.

## Prérequis

- Node.js installé
- Une clé API Shippo valide

## Installation

1. Installez les dépendances nécessaires :

```bash
npm install axios dotenv
```

2. Créez un fichier `.env` à la racine du projet avec votre clé API Shippo :

```
SHIPPO_API_KEY=votre_clé_api_shippo
```

## Utilisation

Exécutez le script avec la commande :

```bash
node execute-shipment-routes.js
```

Le script va :

1. Exécuter toutes les combinaisons possibles d'envois entre les 5 adresses prédéfinies (IRA, Camille, Martin, Pierre, Sophie)
2. Utiliser les 3 types de colis (petit, moyen, grand)
3. Générer un fichier CSV `shipment-rates.csv` contenant les résultats

## Format du fichier de sortie

Le fichier CSV généré contiendra les colonnes suivantes, séparées par des points-virgules :

- Expéditeur (nom)
- Adresse expéditeur (format court)
- Destinataire (nom)
- Adresse destinataire (format court)
- Dimensions du colis (cm)
- Poids du colis (kg)
- Transporteur
- Service
- Durée estimée (jours)
- Prix
- Devise

## Personnalisation

Vous pouvez facilement modifier le script pour ajouter de nouvelles adresses ou types de colis en modifiant les objets `addresses` et `parcels` dans le code.

# Script de génération des tarifs d'expédition Shippo au format Excel

Ce script permet d'exécuter toutes les combinaisons possibles d'envois entre différentes adresses avec différents types de colis, et de générer un fichier Excel contenant les tarifs proposés par les transporteurs.

## Prérequis

- Node.js installé
- Une clé API Shippo valide

## Installation

1. Installez les dépendances nécessaires :

```bash
npm install axios dotenv exceljs
```

2. Créez un fichier `.env` à la racine du projet avec votre clé API Shippo :

```
SHIPPO_API_KEY=votre_clé_api_shippo
```

## Utilisation

Exécutez le script avec la commande :

```bash
node execute-shipment-routes-excel.js
```

Le script va :

1. Exécuter toutes les combinaisons possibles d'envois entre les 5 adresses prédéfinies (IRA, Camille, Martin, Pierre, Sophie)
2. Utiliser les 3 types de colis (petit, moyen, grand)
3. Générer un fichier Excel `shipment-rates.xlsx` contenant les résultats

## Fonctionnalités du fichier Excel

Le fichier Excel généré inclut :

- Un formatage des en-têtes en gras avec fond gris
- Des largeurs de colonnes optimisées pour la lisibilité
- Des filtres automatiques sur toutes les colonnes
- Un formatage des prix en nombres avec 2 décimales
- Une feuille de calcul complète nommée "Tarifs d'expédition"

## Contenu du fichier Excel

Le fichier Excel contiendra les colonnes suivantes :

- Expéditeur (nom)
- Adresse expéditeur (format court)
- Destinataire (nom)
- Adresse destinataire (format court)
- Dimensions du colis (cm)
- Poids du colis (kg)
- Transporteur
- Service
- Durée estimée (jours)
- Prix
- Devise

## Personnalisation

Vous pouvez facilement modifier le script pour :

- Ajouter de nouvelles adresses en modifiant l'objet `addresses`
- Ajouter de nouveaux types de colis en modifiant l'objet `parcels`
- Personnaliser le formatage du fichier Excel en modifiant les fonctions `initExcelFile` et `addResultsToExcel`

# IRA Backoffice

## Configuration de la traduction automatique

Le système de traduction automatique utilise Google Translate pour une solution gratuite et simple, avec support complet de la traduction HTML.

### Fonctionnalités

#### Traduction des champs textuels

- **Titre, méta-description, mots-clés**
- **Résumé/extrait, tags**
- **Textes alternatifs et légendes des images**

#### Traduction du contenu HTML

- **HTML complet** (`generatedHtml`) - Traduit tous les textes en préservant la structure
- **JSON-LD** (`jsonLd`) - Parse et traduit les données structurées
- **Article HTML** (`generatedArticleHtml`) - Traduit le contenu de l'article

### Éléments traduits dans le HTML

Le système traduit intelligemment :

- ✅ **Contenu des balises** : `<title>`, `<h1>-<h6>`, `<p>`, `<span>`, `<div>`, `<figcaption>`
- ✅ **Attributs meta** : `content`, `og:title`, `og:description`, `twitter:title`, etc.
- ✅ **Attributs d'accessibilité** : `alt`, `title`
- ✅ **Données JSON-LD** : `headline`, `description`, `keywords`, etc.

### Éléments préservés

Le système préserve intelligemment :

- 🔒 **URLs et liens** - Jamais traduits
- 🔒 **Dates et timestamps** - Format préservé
- 🔒 **Structure HTML** - Balises et attributs intacts
- 🔒 **Classes CSS et IDs** - Styles préservés
- 🔒 **Attribut lang** - Automatiquement mis à jour

### Fonctionnement

- **Service principal** : Google Translate (API gratuite)
- **Fallback automatique** : Traduction simple avec préfixe de langue en cas d'erreur
- **Langues supportées** : Anglais, Espagnol, Allemand, Italien, Portugais, Néerlandais, Russe, Japonais, Coréen, Chinois

### Avantages

- ✅ **Gratuit** - Aucun coût d'API
- ✅ **Simple** - Aucune configuration requise
- ✅ **Intelligent** - Préserve la structure HTML
- ✅ **Fiable** - Service stable de Google
- ✅ **Rapide** - Traduction instantanée
- ✅ **Compatible Vercel** - Fonctionne parfaitement en production

### Tests du système

Pour tester la traduction des champs textuels :

```bash
npm run test-translation
```

Pour tester la traduction HTML :

```bash
npm run test-html-translation
```

Pour tester la traduction complète (avec base de données) :

```bash
npm run test-complete-translation
```

Pour tester la traduction complète (sans base de données) :

```bash
npm run test-standalone-translation
```

### Utilisation

Les traductions sont automatiquement créées/mises à jour lors de l'édition d'un article SEO dans l'interface d'administration. Le système traduit :

**Champs textuels :**

- Titre
- Méta-description
- Mots-clés
- Résumé/extrait
- Tags
- Textes alternatifs des images
- Légendes des images

**Champs HTML :**

- HTML complet généré (`generatedHtml`)
- Données structurées JSON-LD (`jsonLd`)
- Contenu d'article HTML (`generatedArticleHtml`)

### Architecture technique

```
lib/services/
├── translation-service.ts          # Service principal
├── html-translation-service.ts     # Service spécialisé HTML
└── scripts/
    ├── test-google-translation.ts  # Tests champs textuels
    └── test-html-translation.ts    # Tests traduction HTML
```

### Gestion des erreurs

En cas de problème avec Google Translate (limite de taux, erreur réseau), le système bascule automatiquement vers une traduction simple avec préfixe de langue pour assurer la continuité du service. Les champs HTML sont retournés intacts en cas d'erreur.

### Exemple de traduction HTML

**Avant (français) :**

```html
<h1>Pourquoi utiliser la blockchain dans l'art ?</h1>
<meta
  name="description"
  content="Les raisons d'utiliser la blockchain dans l'art"
/>
```

**Après (anglais) :**

```html
<h1>Why use the blockchain in art?</h1>
<meta name="description" content="Reasons to use the blockchain in art" />
```

La structure, les attributs et les styles restent parfaitement intacts.
