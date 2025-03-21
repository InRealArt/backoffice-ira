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
