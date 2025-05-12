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
