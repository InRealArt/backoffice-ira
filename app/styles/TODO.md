# TODO: Système de Style Unifié

Ce document liste les améliorations prévues pour le système de style unifié.

## Priorité Haute

- [ ] Migrer les composants LoadingSpinner et Modal vers le système de style global
- [ ] Ajouter des variantes de boutons (outline, text-only)
- [x] Créer des styles de formulaire cohérents
- [ ] Appliquer le système sur toutes les pages principales
- [ ] Optimiser la gestion des notifications d'erreur en utilisant la classe `toast-notification`
- [ ] Créer une directive pour standardiser les modales dans l'ensemble de l'application

## Priorité Moyenne

- [ ] Créer des composants pour les cartes et tiles
- [ ] Améliorer les styles de navigation et de menu
- [ ] Ajouter une fonctionnalité de thème (clair/sombre)
- [ ] Optimiser les performances CSS (purge des classes non utilisées)
- [ ] Standardiser les styles des tableaux de données avec pagination
- [ ] Créer un composant de filtre réutilisable
- [ ] Ajouter des animations de transition pour les changements d'état

## Priorité Basse

- [ ] Créer des animations réutilisables
- [ ] Implémenter un système de grille personnalisé
- [ ] Documenter toutes les variables et classes avec des exemples
- [ ] Créer une page de styleguide dans l'application
- [ ] Optimiser les styles pour les grands écrans (>1920px)
- [ ] Améliorer le contraste des couleurs pour l'accessibilité
- [ ] Ajouter un mode sombre

## Composants à Standardiser

- [x] Forms et inputs
- [ ] Dropdowns et menus déroulants
- [ ] Notifications et alertes
- [ ] Accordéons et onglets
- [ ] Pagination
- [ ] Breadcrumbs
- [ ] DropdownMenu
- [ ] Modal
- [ ] Tabs
- [ ] Accordéon

## Pages migrées

- [x] blockchain/collections
- [x] blockchain/smartContracts
- [x] blockchain/artists
- [x] blockchain/royalties
- [x] marketplace/nftsToMint
- [x] marketplace/nftsToMint/[id]/edit
- [ ] blockchain/marketplace
- [ ] users/list
- [ ] settings

## Formulaires standardisés

- [x] blockchain/collections/[id]/edit (EditCollectionForm) - sert de modèle pour les autres formulaires d'édition
- [ ] blockchain/artists/[id]/edit
- [x] marketplace/nftsToMint/[id]/edit
- [x] blockchain/smartContracts/[id]/EditSmartContractForm

## Bugs Connus

- [ ] Problèmes d'affichage sur certains navigateurs mobiles
- [ ] Conflit potentiel avec certains styles spécifiques aux composants
- [ ] Les boutons n'ont pas la bonne taille sur les écrans très petits (<375px)
- [ ] Certaines transitions ne fonctionnent pas correctement sur Safari
