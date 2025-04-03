# Composants réutilisables

Ce répertoire contient tous les composants réutilisables qui peuvent être utilisés dans différentes parties de l'application.

## Composants de filtrage

Le système de filtrage comprend plusieurs composants modulaires pour faciliter l'ajout de fonctionnalités de filtrage aux pages de listes:

### `Filters`

Conteneur principal pour les filtres qui gère la disposition et le style global.

```tsx
import { Filters, FilterItem, SearchInput } from "@/app/components/Common";

<Filters>{/* Éléments de filtre ici */}</Filters>;
```

### `FilterItem`

Composant pour un élément de filtre avec un menu déroulant (select).

```tsx
<FilterItem
  id="status-filter"
  label="Filtrer par statut:"
  value={statusFilter}
  onChange={(value) => setStatusFilter(value)}
  options={[
    { value: "all", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "active", label: "Actif" },
  ]}
/>
```

### `SearchInput`

Composant pour un champ de recherche avec icône.

```tsx
<SearchInput
  value={searchTerm}
  onChange={(value) => setSearchTerm(value)}
  placeholder="Rechercher..."
  label="Rechercher:"
  onSearch={() => performSearch()} // Optionnel
/>
```

## Exemple d'utilisation complète

```tsx
import { useState } from "react";
import { Filters, FilterItem, SearchInput } from "@/app/components/Common";

export default function MyListComponent() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Logique de filtrage ici

  return (
    <div className="page-container">
      <Filters>
        <FilterItem
          id="status-filter"
          label="Statut:"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />

        <FilterItem
          id="category-filter"
          label="Catégorie:"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
        />

        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Rechercher un nom..."
          label="Rechercher:"
        />
      </Filters>

      {/* Contenu filtré ici */}
    </div>
  );
}
```

# Composants de Traduction

Ce dossier contient des composants réutilisables pour gérer les traductions dans l'application.

## TranslationIcon

Un composant qui affiche une icône de traduction à côté d'un champ de formulaire, avec un lien vers la page de traduction correspondante.

### Props

- `entityType` (string, obligatoire) : Le type d'entité (ex: "Team", "Faq", etc.)
- `entityId` (number, obligatoire) : L'ID de l'entité
- `field` (string, obligatoire) : Le nom du champ à traduire
- `languageCode` (string, optionnel, défaut = "en") : Le code de la langue cible
- `className` (string, optionnel) : Classes CSS supplémentaires

### Exemple d'utilisation

```jsx
import TranslationIcon from "@/app/components/TranslationIcon";

// Dans votre composant
<label htmlFor="title" className="form-label">
  Titre
  <TranslationIcon entityType="BlogPost" entityId={blogPost.id} field="title" />
</label>;
```

## TranslationField

Un composant qui enveloppe un champ de formulaire et ajoute automatiquement l'icône de traduction.

### Props

- `entityType` (string, obligatoire) : Le type d'entité (ex: "Team", "Faq", etc.)
- `entityId` (number | null, obligatoire) : L'ID de l'entité (peut être null si nouvelle entité)
- `field` (string, obligatoire) : Le nom du champ à traduire
- `label` (string, obligatoire) : Le libellé du champ
- `languageCode` (string, optionnel, défaut = "en") : Le code de la langue cible
- `children` (ReactNode, obligatoire) : Le contenu du champ (input, textarea, etc.)
- `className` (string, optionnel) : Classes CSS supplémentaires
- `errorMessage` (string, optionnel) : Message d'erreur à afficher

### Exemple d'utilisation

```jsx
import TranslationField from "@/app/components/TranslationField";

// Dans votre composant
<TranslationField
  entityType="BlogPost"
  entityId={blogPost.id}
  field="content"
  label="Contenu"
  errorMessage={errors.content?.message}
>
  <textarea
    id="content"
    {...register("content")}
    className={`form-textarea ${errors.content ? "input-error" : ""}`}
    rows={5}
  />
</TranslationField>;
```

## Utilisation avec d'autres formulaires

Pour intégrer ces composants dans d'autres formulaires, suivez les étapes suivantes :

1. Importez `TranslationField` dans votre composant de formulaire
2. Remplacez vos groupes de formulaire avec le composant `TranslationField`
3. Assurez-vous que la fonction `handleEntityTranslations` est appelée lors de la soumission du formulaire pour gérer les traductions

Exemple :

```jsx
// Dans la fonction de soumission
onSubmit = async (data) => {
  // Traitement normal du formulaire...

  // Puis gestion des traductions
  await handleEntityTranslations("EntityType", entityId, {
    field1: data.field1 || null,
    field2: data.field2 || null,
  });
};
```
