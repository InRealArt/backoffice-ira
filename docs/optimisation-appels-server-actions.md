# Optimisation des Appels Server Actions - Solution Pérenne

## Problème Identifié

La page d'accueil et d'autres composants effectuaient de nombreux appels POST répétés à `checkAuthorizedUser`, causant:

- Des dizaines d'appels simultanés pour la même vérification
- Des re-renders infinis dus à des dépendances instables dans `useEffect`
- Pas de cache côté client
- Pas de déduplication des appels

## Solution Implémentée

### 1. Hook Personnalisé `useAuthorization`

Un hook réutilisable (`app/hooks/useAuthorization.ts`) qui:

- ✅ **Cache côté client** : Évite les appels répétés pour le même email (durée: 5 minutes)
- ✅ **Déduplication** : Évite les appels simultanés multiples pour le même email
- ✅ **Optimisation des re-renders** : Utilise `useRef` pour les callbacks instables
- ✅ **Gestion automatique des redirections** : Configurable par options
- ✅ **Nettoyage automatique** : Nettoie le cache expiré périodiquement

### 2. Optimisations Appliquées

#### `app/page.tsx`

- ✅ Utilise `useAuthorization` au lieu d'appels directs
- ✅ Suppression de `router` des dépendances `useEffect`
- ✅ Utilisation de `useMemo` pour optimiser les calculs

#### `app/components/Auth/AuthObserver.tsx`

- ✅ Utilise `useAuthorization` avec cache partagé
- ✅ Suppression des appels redondants
- ✅ Utilisation de `useRef` pour les callbacks

#### `app/components/SideMenu/useSideMenuLogic.ts`

- ✅ Utilise `useAuthorization` pour l'autorisation
- ✅ Appel à `checkIsAdmin` seulement si autorisé
- ✅ Réduction des appels inutiles

## Utilisation du Hook

### Exemple Basique

```typescript
import { useAuthorization } from "@/app/hooks/useAuthorization";

function MyComponent() {
  const { isAuthorized, isLoading, error } = useAuthorization();

  if (isLoading) return <div>Chargement...</div>;
  if (isAuthorized === false) return <div>Non autorisé</div>;

  return <div>Contenu autorisé</div>;
}
```

### Avec Redirection Automatique

```typescript
const { isAuthorized } = useAuthorization({
  redirectIfAuthorized: true, // Redirige vers /dashboard si autorisé
  redirectPath: "/dashboard", // Chemin personnalisé
});
```

### Avec Redirection si Non Autorisé

```typescript
const { isAuthorized } = useAuthorization({
  redirectIfUnauthorized: true, // Redirige vers / si non autorisé
});
```

### Forcer une Nouvelle Vérification

```typescript
const { isAuthorized, recheck } = useAuthorization();

// Forcer une nouvelle vérification (ignore le cache)
await recheck();
```

## Avantages de la Solution

1. **Performance** : Réduction drastique des appels serveur
2. **Réutilisable** : Peut être utilisé dans n'importe quel composant
3. **Type-safe** : Entièrement typé avec TypeScript
4. **Conforme Next.js 16** : Suit les meilleures pratiques officielles
5. **Maintenable** : Code centralisé et documenté

## Architecture Technique

### Cache Global

- Map partagée entre tous les composants utilisant le hook
- Clé: email normalisé (lowercase)
- Durée: 5 minutes (configurable)

### Déduplication

- Map des promesses en cours
- Évite les appels simultanés multiples
- Nettoyage automatique après résolution

### Optimisation React

- `useRef` pour les callbacks instables (router, etc.)
- `useMemo` pour les valeurs calculées
- `useCallback` pour les fonctions stables
- Dépendances `useEffect` optimisées

## Migration d'Ancien Code

### Avant

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const result = await checkAuthorizedUser(email);
    setIsAuthorized(result.authorized);
  };
  checkAuth();
}, [email, router]); // ❌ router cause des re-renders infinis
```

### Après

```typescript
const { isAuthorized } = useAuthorization({
  redirectIfAuthorized: true,
}); // ✅ Pas de dépendances instables, cache automatique
```

## Bonnes Pratiques

1. **Ne pas appeler `checkAuthorizedUser` directement** dans les composants clients
2. **Utiliser `useAuthorization`** pour toutes les vérifications d'autorisation
3. **Configurer les redirections** selon les besoins de chaque page
4. **Utiliser `recheck()`** seulement si nécessaire (changement de rôle, etc.)

## Tests Recommandés

1. Vérifier que les appels sont réduits dans les logs
2. Tester la redirection automatique
3. Vérifier le cache (même email = 1 seul appel)
4. Tester la déconnexion/reconnexion

## Maintenance Future

- Le cache peut être ajusté via `CACHE_DURATION` dans le hook
- Les options peuvent être étendues selon les besoins
- Le hook peut être étendu pour inclure d'autres vérifications (admin, etc.)
