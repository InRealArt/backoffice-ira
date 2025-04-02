# Générateur de contenu SEO

Ces composants fournissent une interface pour générer du contenu SEO optimisé pour les articles de blog.

## Composants

### `SEOModalGenerator`

Un composant qui affiche un bouton qui, lorsqu'il est cliqué, ouvre une fenêtre modale contenant le générateur de contenu SEO.

#### Props

- `onContentGenerated` (facultatif): Fonction callback appelée avec le HTML généré lorsque l'utilisateur copie le contenu
- `initialData` (facultatif): Données initiales pour pré-remplir le formulaire

#### Exemple d'utilisation

```jsx
import { SEOModalGenerator } from "@/components/SEOGenerator";

export default function BlogForm() {
  const handleContentGenerated = (html) => {
    // Utiliser le HTML généré, par exemple pour le mettre dans un textarea
    document.getElementById("blog-content").value = html;
  };

  return (
    <div className="form-group">
      <label htmlFor="blog-content">Contenu de l'article</label>
      <textarea
        id="blog-content"
        className="form-textarea"
        rows={10}
      ></textarea>

      <div className="mt-2">
        <SEOModalGenerator onContentGenerated={handleContentGenerated} />
      </div>
    </div>
  );
}
```

### `SEOContentGenerator`

Le composant principal utilisé par `SEOModalGenerator` qui contient le formulaire de génération de contenu SEO.

#### Props

- `value`: La valeur actuelle du HTML généré
- `onChange`: Fonction appelée lorsque le contenu change, passe le HTML généré et le nombre de mots
- `initialData` (facultatif): Données initiales pour pré-remplir le formulaire

## Structure du contenu

Le générateur crée du contenu structuré avec:

- Titre principal (H1)
- Image principale avec texte alternatif
- Introduction
- Sections (H2) avec contenu
  - Sous-sections (H3) avec contenu
  - Éléments spéciaux (listes à puces, listes numérotées, citations, images)
- Conclusion
- Tags

## Avantages SEO

- Structure hiérarchique des titres (H1, H2, H3)
- Support des images avec texte alternatif
- Création de listes pour améliorer la lisibilité
- Citations pour renforcer la crédibilité
- Systèmes de tags pour le référencement thématique
- Compteur de mots avec indications sur la longueur optimale

## Maintenance

Pour ajouter de nouveaux types d'éléments, modifiez l'interface `ArticleContent` et mettez à jour:

1. La fonction `generateHtml` pour générer le HTML correspondant
2. L'interface utilisateur pour permettre l'ajout et la modification de ces éléments
