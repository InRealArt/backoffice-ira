# Système de Style Unifié InRealArt Backoffice

Ce dossier contient le système de style unifié pour l'application InRealArt Backoffice. Il fournit une approche cohérente pour la conception et la mise en page dans toute l'application.

## Structure des fichiers

- `variables.scss` : Contient toutes les variables SCSS (couleurs, espacements, typographie, etc.)
- `components.scss` : Définit les styles pour les composants réutilisables et classes d'utilitaires
- `main.scss` : Fichier principal qui importe et compile tous les styles

## Comment utiliser

### Structure de page standard

Pour les pages listant des éléments et permettant d'accéder à des formulaires d'édition :

```jsx
<div className="page-container">
  <div className="page-header">
    <div className="header-top-section">
      <h1 className="page-title">Titre de la Page</h1>
      <button className="btn btn-primary">Action Principale</button>
    </div>
    <p className="page-subtitle">Description de la page</p>
  </div>

  {/* Section de filtres optionnelle */}
  <div className="filter-section">
    <div className="filter-item">
      <label className="filter-label">Label:</label>
      <div className="select-wrapper">
        <select className="filter-select">{/* Options */}</select>
      </div>
    </div>
  </div>

  <div className="page-content">
    {/* Affichage de contenu vide */}
    {items.length === 0 ? (
      <div className="empty-state">
        <p>Aucun élément trouvé</p>
      </div>
    ) : (
      /* Tableau de données */
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>En-tête 1</th>
              <th>En-tête 2</th>
              <th className="hidden-mobile">En-tête (masqué sur mobile)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="clickable-row"
              >
                <td>{item.name}</td>
                <td>{item.value}</td>
                <td className="hidden-mobile">{item.details}</td>
                <td className="actions-cell">
                  <button className="btn btn-danger btn-small">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
</div>
```

### Classes utilitaires disponibles

#### Mise en page

- `.d-flex` : Display flex
- `.flex-column` : Flex direction column
- `.align-items-center` : Alignement vertical centré
- `.align-items-start` : Alignement vertical en haut
- `.justify-content-between` : Espacement égal entre éléments
- `.justify-content-center` : Centrage horizontal

#### Espacement

- `.gap-xs` : Petit espacement (4px)
- `.gap-sm` : Espacement moyen (8px)
- `.gap-md` : Espacement large (12px)
- `.gap-lg` : Espacement très large (16px)

#### Texte

- `.text-primary` : Couleur de texte principale
- `.text-secondary` : Couleur de texte secondaire
- `.text-muted` : Couleur de texte atténuée
- `.text-danger` : Couleur de texte d'erreur

#### Responsive

- `.hidden-mobile` : Cache l'élément sur les écrans mobiles

### Boutons

```jsx
<button className="btn btn-primary">Bouton principal</button>
<button className="btn btn-secondary">Bouton secondaire</button>
<button className="btn btn-danger">Bouton d'action destructive</button>
<button className="btn btn-primary btn-small">Petit bouton</button>
```

### Badges de statut

```jsx
<span className="status-badge active">Actif</span>
<span className="status-badge inactive">Inactif</span>
<span className="info-badge">Information</span>
```

## Variables SCSS disponibles

Consultez le fichier `variables.scss` pour voir toutes les variables disponibles, notamment :

- Couleurs de base
- Tailles de police
- Espacements
- Breakpoints pour les médias queries
- Ombres
- Rayons de bordure

## Directives pour les contributeurs

1. Utilisez toujours les classes CSS existantes avant d'en créer de nouvelles
2. Ajoutez les nouveaux composants communs à `components.scss`
3. Définissez les nouvelles variables dans `variables.scss`
4. Maintenez une nomenclature cohérente pour les classes CSS
5. Préférez les classes utilitaires pour les petits ajustements
6. Suivez les modèles établis pour la structure de page
