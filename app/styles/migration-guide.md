# Guide de Migration vers le Système de Style Unifié

Ce document explique comment migrer les pages existantes vers le nouveau système de style unifié de l'application InRealArt Backoffice.

## Étapes de Migration

### 1. Supprimer l'importation du fichier CSS/SCSS spécifique au composant

Remplacez :

```jsx
import styles from "./MonComposant.module.scss";
```

Par : (rien, car les styles sont maintenant globaux)

### 2. Remplacer les références aux classes de style

Remplacez les classes spécifiques au module par les classes globales correspondantes.

Exemples courants de conversions :

| Ancien (avec styles module)         | Nouveau (avec styles globaux)           |
| ----------------------------------- | --------------------------------------- |
| `className={styles.container}`      | `className="page-container"`            |
| `className={styles.header}`         | `className="page-header"`               |
| `className={styles.title}`          | `className="page-title"`                |
| `className={styles.contentSection}` | `className="page-content"`              |
| `className={styles.tableContainer}` | `className="table-container"`           |
| `className={styles.table}`          | `className="data-table"`                |
| `className={styles.emptyState}`     | `className="empty-state"`               |
| `className={styles.hiddenMobile}`   | `className="hidden-mobile"`             |
| `className={styles.createButton}`   | `className="btn btn-primary"`           |
| `className={styles.actionButton}`   | `className="btn btn-primary btn-small"` |
| `className={styles.deleteButton}`   | `className="btn btn-danger btn-small"`  |
| `className={styles.badge}`          | `className="info-badge"`                |

### 3. Utiliser les classes utilitaires pour les styles communs

Préférez nos nouvelles classes utilitaires pour les mises en page communes :

```jsx
// Avant
<div className={styles.flexContainer}>
  <div className={styles.flexItem}>...</div>
</div>

// Après
<div className="d-flex gap-md">
  <div>...</div>
</div>
```

### 4. Supprimer le fichier SCSS spécifique au composant

Une fois que vous avez migré toutes les classes, vous pouvez supprimer le fichier `.module.scss` spécifique au composant.

### 5. Tester la compatibilité mobile

Assurez-vous que la page reste responsive après la migration en testant dans différentes tailles d'écran.

## Exemples détaillés

### Exemple: Conversion d'une page de liste

```jsx
// Avant
import styles from './MaListe.module.scss';

export default function MaListeClient({ items }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <h1 className={styles.title}>Ma Liste</h1>
          <button className={styles.createButton}>Créer</button>
        </div>
        <p className={styles.description}>Description de la liste</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          {/* ... */}
        </table>
      </div>
    </div>
  );
}

// Après
export default function MaListeClient({ items }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Ma Liste</h1>
          <button className="btn btn-primary">Créer</button>
        </div>
        <p className="page-subtitle">Description de la liste</p>
      </div>

      <div className="page-content">
        <div className="table-container">
          <table className="data-table">
            {/* ... */}
          </table>
        </div>
      </div>
    </div>
  );
}
```

## Cas particuliers

### Styles spécifiques à un composant

Si vous avez besoin de styles très spécifiques à un composant qui ne sont pas couverts par le système global, vous pouvez :

1. Ajouter ces styles globalement s'ils sont réutilisables (dans `components.scss`)
2. En dernier recours, conserver un fichier `.module.scss` minimal pour ces styles spécifiques

### Compatibilité avec les composants existants

Certains composants comme `LoadingSpinner` et `Modal` utilisent encore leurs propres modules de style pour assurer la compatibilité. Ils seront migrés progressivement.
