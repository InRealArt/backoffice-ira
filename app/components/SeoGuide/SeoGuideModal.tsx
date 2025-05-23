'use client'

import { useState, useEffect } from 'react'
import Modal from '../Common/Modal'
import Tabs, { TabItem } from '../Tabs/Tabs'
import styles from './SeoGuideModal.module.scss'

interface SeoGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SeoGuideModal({ isOpen, onClose }: SeoGuideModalProps) {
  // State pour stocker l'URL de l'image extraite du code HTML
  const [imageUrl, setImageUrl] = useState<string>('https://via.placeholder.com/800x500')
  const [imageCaption, setImageCaption] = useState<string>('Légende explicative de l\'image qui ajoute du contexte')
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true)

  // Exemple de code HTML optimisé pour le SEO
  const seoHtmlExample = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Balises SEO essentielles -->
  <title>Titre Optimisé pour les Mots-Clés Principaux | Nom de Marque</title>
  <meta name="description" content="Description concise et attrayante contenant les principaux mots-clés. Idéalement entre 150-160 caractères pour s'afficher complètement dans les SERP.">
  
  <!-- Balises Open Graph pour les partages sur réseaux sociaux -->
  <meta property="og:title" content="Titre pour Partage Social (peut être différent du titre principal)">
  <meta property="og:description" content="Description spécifique pour les partages sociaux">
  <meta property="og:image" content="https://example.com/image-partage-social.jpg">
  <meta property="og:url" content="https://example.com/page-url">
  <meta property="og:type" content="article">
  
  <!-- Balises Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Titre pour Twitter">
  <meta name="twitter:description" content="Description pour Twitter">
  <meta name="twitter:image" content="https://example.com/image-twitter.jpg">
  
  <!-- Autres balises méta importantes -->
  <meta name="author" content="Nom de l'Auteur">
  <link rel="canonical" href="https://example.com/url-canonique">
</head>
<body>
  <header>
    <!-- Logo et navigation avec des liens textuels descriptifs -->
  </header>
  
  <main>
    <article>
      <!-- Structure hiérarchique correcte des titres -->
      <h1>Titre Principal avec Mot-Clé Principal</h1>
      
      <!-- Métadonnées de l'article -->
      <div class="meta">
        <img src="chemin/photo-auteur.jpg" alt="Nom de l'auteur">
        <span class="author">Par <a href="lien-profil">Nom de l'Auteur</a></span>
        <time datetime="2023-05-15">15 Mai 2023</time>
        <span class="read-time">Temps de lecture: 5 min</span>
      </div>
      
      <!-- Image principale avec attributs alt pertinents -->
      <figure>
        <img src="https://crypto-economy.com/wp-content/uploads/2024/03/RWA-featured-1-1024x576.jpg" alt="Description détaillée de l'image avec mot-clé si pertinent" width="800" height="500">
        <figcaption>Légende explicative de l'image qui ajoute du contexte</figcaption>
      </figure>
      
      <!-- Introduction avec mots-clés principaux dans les premiers paragraphes -->
      <p>Introduction qui engage le lecteur et contient naturellement les mots-clés principaux. L'introduction doit captiver l'attention et expliquer clairement le sujet de l'article.</p>
      
      <!-- Corps de l'article bien structuré -->
      <section>
        <h2>Première Section avec Mot-Clé Secondaire</h2>
        <p>Contenu détaillé avec des paragraphes courts et faciles à lire. Inclure des mots-clés de manière naturelle, sans suroptimisation.</p>
        
        <h3>Sous-Section Détaillée</h3>
        <p>Plus de contenu informatif. Utiliser des phrases variées en longueur pour maintenir l'intérêt.</p>
        
        <!-- Liste à puces pour améliorer la lisibilité -->
        <ul>
          <li>Premier point important à retenir</li>
          <li>Deuxième élément avec un mot-clé pertinent</li>
          <li>Troisième élément qui complète l'information</li>
        </ul>
      </section>
      
      <section>
        <h2>Deuxième Section Importante</h2>
        <p>Continuation du contenu avec des liens internes pertinents vers d'autres pages de votre site.</p>
        
        <!-- Exemple d'intégration multimédia avec accessibilité -->
        <figure>
          <img src="chemin/image-secondaire.jpg" alt="Description détaillée" width="600" height="400">
          <figcaption>Légende informative de l'image</figcaption>
        </figure>
      </section>
      
      <!-- Exemple d'Accordéon FAQ pour améliorer le SEO -->
      <section class="faq">
        <h2>Questions Fréquentes</h2>
        
        <div class="accordion">
          <div class="accordion-item">
            <h3 class="accordion-header">Question 1 incluant un mot-clé important ?</h3>
            <div class="accordion-content">
              <p>Réponse détaillée et utile qui répond directement à la question...</p>
            </div>
          </div>
          
          <div class="accordion-item">
            <h3 class="accordion-header">Question 2 sur un aspect connexe ?</h3>
            <div class="accordion-content">
              <p>Explication complète avec des informations pertinentes...</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Conclusion qui récapitule les points clés -->
      <section class="conclusion">
        <h2>Conclusion</h2>
        <p>Résumé des points principaux abordés dans l'article, avec une réaffirmation naturelle des mots-clés principaux. Terminer par un appel à l'action clair.</p>
      </section>
    </article>
  </main>
  
  <!-- Liens vers d'autres articles connexes -->
  <aside>
    <h2>Articles Connexes</h2>
    <ul>
      <li><a href="/lien-article-1">Titre d'article connexe avec mot-clé pertinent</a></li>
      <li><a href="/lien-article-2">Autre article sur un sujet similaire</a></li>
    </ul>
  </aside>
  
  <footer>
    <!-- Pied de page avec liens de navigation et informations de copyright -->
  </footer>
</body>
</html>`

  // Extraire l'URL de l'image et la légende du code HTML
  useEffect(() => {
    // Expression régulière pour extraire l'URL de l'image principale
    const imgRegex = /<figure>\s*<img src="([^"]+)"[^>]*>/;
    const captionRegex = /<figcaption>([^<]+)<\/figcaption>/;
    
    const imgMatch = seoHtmlExample.match(imgRegex);
    const captionMatch = seoHtmlExample.match(captionRegex);
    
    if (imgMatch && imgMatch[1]) {
      setImageUrl(imgMatch[1]);
    }
    
    if (captionMatch && captionMatch[1]) {
      setImageCaption(captionMatch[1]);
    }
  }, [seoHtmlExample]);

  const tabs: TabItem[] = [
    {
      id: 'html-structure',
      label: 'HTML Structure',
      content: (
        <pre className={styles.codeBlock}>{seoHtmlExample}</pre>
      )
    },
    {
      id: 'preview',
      label: 'Preview',
      content: (
        <div className={styles.previewContainer}>
          <h1 className={styles.previewTitle}>Titre Principal avec Mot-Clé Principal</h1>
          
          <div className={styles.previewMeta}>
            <div className={styles.previewAuthor}>
              <div className={styles.previewAuthorImg}></div>
              <span>Par <a href="#">Nom de l'Auteur</a> • 15 Mai 2023</span>
            </div>
            <span>Temps de lecture: 5 min</span>
          </div>
          
          <div className={styles.previewContent}>
            <div className={`${styles.previewImageContainer} ${isImageLoading ? styles.previewImageLoading : ''}`}>
              <img 
                src={imageUrl}
                alt="Image d'illustration" 
                className={styles.previewImage}
                onLoad={() => setIsImageLoading(false)}
                onError={(e) => {
                  // Fallback vers une image placeholder en cas d'erreur de chargement
                  e.currentTarget.src = "https://via.placeholder.com/800x500";
                  setIsImageLoading(false);
                }}
              />
            </div>
            <p className={styles.previewFigCaption}>{imageCaption}</p>
            
            <p className={styles.previewParagraph}>
              Introduction qui engage le lecteur et contient naturellement les mots-clés principaux. 
              L'introduction doit captiver l'attention et expliquer clairement le sujet de l'article.
            </p>
            
            <div className={styles.previewSection}>
              <h2 className={styles.previewH2}>Première Section avec Mot-Clé Secondaire</h2>
              <p className={styles.previewParagraph}>
                Contenu détaillé avec des paragraphes courts et faciles à lire. 
                Inclure des mots-clés de manière naturelle, sans suroptimisation.
              </p>
              
              <h3 className={styles.previewH3}>Sous-Section Détaillée</h3>
              <p className={styles.previewParagraph}>
                Plus de contenu informatif. Utiliser des phrases variées en longueur pour maintenir l'intérêt.
              </p>
              
              <ul className={styles.previewList}>
                <li className={styles.previewListItem}>Premier point important à retenir</li>
                <li className={styles.previewListItem}>Deuxième élément avec un mot-clé pertinent</li>
                <li className={styles.previewListItem}>Troisième élément qui complète l'information</li>
              </ul>
            </div>
            
            <div className={styles.previewSection}>
              <h2 className={styles.previewH2}>Questions Fréquentes</h2>
              
              <div className={styles.previewAccordion}>
                <div className={styles.previewAccordionHeader}>
                  Question 1 incluant un mot-clé important ?
                  <span>▼</span>
                </div>
                <div className={styles.previewAccordionContent}>
                  <p>Réponse détaillée et utile qui répond directement à la question...</p>
                </div>
              </div>
              
              <div className={styles.previewAccordion}>
                <div className={styles.previewAccordionHeader}>
                  Question 2 sur un aspect connexe ?
                  <span>▼</span>
                </div>
                <div className={styles.previewAccordionContent}>
                  <p>Explication complète avec des informations pertinentes...</p>
                </div>
              </div>
            </div>
            
            <div className={styles.previewSection}>
              <h2 className={styles.previewH2}>Conclusion</h2>
              <p className={styles.previewParagraph}>
                Résumé des points principaux abordés dans l'article, avec une réaffirmation 
                naturelle des mots-clés principaux. Terminer par un appel à l'action clair.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ]
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Optimal HTML Structure for SEO">
      <p className={styles.modalDescription}>
        Use this structure as a guide to create blog posts optimized for search engines.
      </p>
      <Tabs tabs={tabs} />
    </Modal>
  )
} 