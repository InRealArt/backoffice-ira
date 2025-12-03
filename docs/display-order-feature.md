# Feature : Ordre d'affichage (Display Order)

## Vue d'ensemble

Cette fonctionnalité permet de réordonner les œuvres d'art pour un affichage personnalisé sur une autre application. Elle utilise un champ `displayOrder` distinct du champ `order` existant, permettant ainsi deux ordres différents pour des usages différents.

## Architecture

### Base de données

- **Nouveau champ** : `displayOrder` (Int, nullable) dans le modèle `PresaleArtwork`
- **Index** : Un index a été ajouté sur `displayOrder` pour optimiser les requêtes
- **Schéma** : `landing`

### Composants

1. **SortableList** (`app/components/SortableList/SortableList.tsx`)

   - Composant générique et réutilisable pour toute liste triable
   - Utilise `@dnd-kit` pour le drag & drop
   - Gère les animations et les états de drag

2. **SortableArtworkItem** (`app/components/SortableList/SortableArtworkItem.tsx`)

   - Composant spécifique pour afficher une œuvre d'art dans la liste triable
   - Affiche l'image, le nom, les dimensions, le prix et l'ordre actuel

3. **DisplayOrderManager** (`app/(protected)/art/my-artworks/DisplayOrderManager.tsx`)
   - Composant de gestion de l'ordre d'affichage
   - Intégré dans la page `my-artworks`
   - Permet de réordonner et réinitialiser l'ordre

### Actions serveur

**Fichier** : `lib/actions/display-order-actions.ts`

- `updateDisplayOrder()` : Met à jour l'ordre d'affichage d'une liste d'entités (générique)
- `getMaxDisplayOrderByArtist()` : Récupère le displayOrder maximum pour un artiste
- `resetDisplayOrderForArtist()` : Réinitialise l'ordre d'affichage pour un artiste

## Installation

### 1. Migration de la base de données

Exécutez la migration Prisma pour ajouter le champ `displayOrder` :

```bash
npx prisma migrate dev --name add_display_order_to_presale_artwork
```

### 2. Génération du client Prisma

```bash
npx prisma generate
```

## Utilisation

### Pour l'artiste

1. Accédez à la page `/art/my-artworks`
2. Une section "Ordre d'affichage" apparaît en haut de la page
3. Glissez-déposez les œuvres pour les réordonner
4. L'ordre est automatiquement sauvegardé
5. Utilisez le bouton "Réinitialiser" pour revenir à l'ordre par défaut

### Pour les développeurs

#### Réutiliser SortableList pour d'autres listes

```tsx
import { SortableList, type SortableItem } from "@/app/components/SortableList";

interface MyItem extends SortableItem {
  id: number;
  name: string;
  // ... autres propriétés
}

function MyComponent() {
  const [items, setItems] = useState<MyItem[]>([]);

  const handleReorder = async (reorderedItems: SortableItem[]) => {
    // Mettre à jour l'ordre dans la base de données
    await updateDisplayOrder("presaleArtwork", updates, ["/my-route"]);
    setItems(reorderedItems as MyItem[]);
  };

  return (
    <SortableList
      items={items}
      onReorder={handleReorder}
      renderItem={(item, index, isDragging) => (
        <MyCustomItem item={item} isDragging={isDragging} />
      )}
    />
  );
}
```

#### Utiliser les actions serveur

```typescript
import {
  updateDisplayOrder,
  resetDisplayOrderForArtist,
} from "@/lib/actions/display-order-actions";

// Mettre à jour l'ordre
const updates = [
  { id: 1, displayOrder: 1 },
  { id: 2, displayOrder: 2 },
  { id: 3, displayOrder: 3 },
];

await updateDisplayOrder("presaleArtwork", updates, ["/art/my-artworks"]);

// Réinitialiser l'ordre
await resetDisplayOrderForArtist(artistId, ["/art/my-artworks"]);
```

## Design et UX

### Caractéristiques

- **Drag & Drop intuitif** : Glissez-déposez avec un délai d'activation de 8px pour éviter les drags accidentels
- **Feedback visuel** : Animation pendant le drag, opacité réduite pour l'élément déplacé
- **Indicateur d'ordre** : Badge affichant l'ordre actuel de chaque œuvre
- **Sauvegarde automatique** : L'ordre est sauvegardé automatiquement après chaque réordonnancement
- **Réinitialisation** : Bouton pour réinitialiser l'ordre à l'ordre par défaut
- **Responsive** : Interface adaptée aux écrans mobiles

### Accessibilité

- Support du clavier pour le drag & drop
- Indicateurs visuels clairs pour l'état de drag
- Messages d'erreur et de succès via Toast

## Extensibilité

Cette solution est conçue pour être générique et réutilisable :

1. **SortableList** peut être utilisé pour n'importe quel type de liste
2. **display-order-actions** peut être étendu pour supporter d'autres types d'entités
3. Le système peut être facilement adapté pour d'autres pages (ex: collections, catégories, etc.)

## Notes techniques

- Le champ `displayOrder` est nullable pour permettre une migration progressive
- L'ordre par défaut est basé sur le champ `order` existant, puis par `id`
- Les mises à jour sont effectuées dans une transaction pour garantir l'atomicité
- Les chemins sont revalidés après chaque mise à jour pour rafraîchir le cache Next.js
