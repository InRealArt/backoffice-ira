# InRealArt Backoffice - Documentation des composants

## Système de notifications Toast

Le système de notifications Toast permet d'afficher des messages temporaires à l'utilisateur de manière cohérente dans toute l'application.

### Utilisation du hook useToast

Pour utiliser les toast notifications dans vos composants :

```tsx
"use client";

import { useToast } from "@/app/components/Toast/ToastContext";

export default function MonComposant() {
  const toast = useToast();

  const handleClick = () => {
    // Afficher différents types de toast
    toast.success("Opération réussie !");
    toast.error("Une erreur est survenue");
    toast.warning("Attention, cette action est irréversible");
    toast.info("Information importante");

    // Avec des options personnalisées
    toast.success("Message personnalisé", {
      duration: 5000, // durée en ms
      position: "bottom-right",
    });

    // Fermer tous les toasts
    toast.dismiss();
  };

  return <button onClick={handleClick}>Déclencher un toast</button>;
}
```

### Types de notifications disponibles

| Méthode           | Description                  | Style                     |
| ----------------- | ---------------------------- | ------------------------- |
| `toast.success()` | Pour les opérations réussies | Toast vert avec icône ✓   |
| `toast.error()`   | Pour les erreurs             | Toast rouge avec icône ✗  |
| `toast.warning()` | Pour les avertissements      | Toast orange avec icône ⚠ |
| `toast.info()`    | Pour les informations        | Toast bleu avec icône ℹ   |
| `toast.dismiss()` | Ferme tous les toasts actifs | -                         |

### Options disponibles

```typescript
interface ToastOptions {
  duration?: number; // Durée d'affichage en ms (défaut: 3000)
  position?:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left"; // Position (défaut: 'top-center')
  icon?: React.ReactNode; // Icône personnalisée
}
```
