'use client'

import { useState, useEffect } from 'react'
import Modal from '../Common/Modal'
import Tabs, { TabItem } from '../Tabs/Tabs'

interface SeoGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SeoGuideModal({ isOpen, onClose }: SeoGuideModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageCaption, setImageCaption] = useState<string>("Légende explicative de l'image qui ajoute du contexte")
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true)

  const seoHtmlExample = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Titre Optimisé pour les Mots-Clés Principaux | Nom de Marque</title>
  <meta name="description" content="Description concise et attrayante contenant les principaux mots-clés. Idéalement entre 150-160 caractères pour s'afficher complètement dans les SERP.">
  <meta property="og:title" content="Titre pour Partage Social (peut être différent du titre principal)">
  <meta property="og:description" content="Description spécifique pour les partages sociaux">
  <meta property="og:image" content="https://example.com/image-partage-social.jpg">
  <meta property="og:url" content="https://example.com/page-url">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Titre pour Twitter">
  <meta name="twitter:description" content="Description pour Twitter">
  <meta name="twitter:image" content="https://example.com/image-twitter.jpg">
  <meta name="author" content="Nom de l'Auteur">
  <link rel="canonical" href="https://example.com/url-canonique">
</head>
<body>
  <header></header>
  <main>
    <article>
      <h1>Titre Principal avec Mot-Clé Principal</h1>
      <div class="meta">
        <img src="chemin/photo-auteur.jpg" alt="Nom de l'auteur">
        <span class="author">Par <a href="lien-profil">Nom de l'Auteur</a></span>
        <time datetime="2023-05-15">15 Mai 2023</time>
        <span class="read-time">Temps de lecture: 5 min</span>
      </div>
      <figure>
        <img src="https://crypto-economy.com/wp-content/uploads/2024/03/RWA-featured-1-1024x576.jpg" alt="Description détaillée de l'image avec mot-clé si pertinent" width="800" height="500">
        <figcaption>Légende explicative de l'image qui ajoute du contexte</figcaption>
      </figure>
      <section>
        <h2>Première Section avec Mot-Clé Secondaire</h2>
        <p>Contenu détaillé avec des paragraphes courts et faciles à lire. Inclure des mots-clés de manière naturelle, sans suroptimisation.</p>
        <h3>Sous-Section Détaillée</h3>
        <p>Plus de contenu informatif. Utiliser des phrases variées en longueur pour maintenir l'intérêt.</p>
        <ul>
          <li>Premier point important à retenir</li>
          <li>Deuxième élément avec un mot-clé pertinent</li>
          <li>Troisième élément qui complète l'information</li>
        </ul>
      </section>
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
      <section class="conclusion">
        <h2>Conclusion</h2>
        <p>Résumé des points principaux abordés dans l'article, avec une réaffirmation naturelle des mots-clés principaux. Terminer par un appel à l'action clair.</p>
      </section>
    </article>
  </main>
  <aside>
    <h2>Articles Connexes</h2>
    <ul>
      <li><a href="/lien-article-1">Titre d'article connexe avec mot-clé pertinent</a></li>
      <li><a href="/lien-article-2">Autre article sur un sujet similaire</a></li>
    </ul>
  </aside>
  <footer></footer>
</body>
</html>`

  useEffect(() => {
    const imgRegex = /<figure>\s*<img src="([^"]+)"[^>]*>/;
    const captionRegex = /<figcaption>([^<]+)<\/figcaption>/;
    const imgMatch = seoHtmlExample.match(imgRegex);
    const captionMatch = seoHtmlExample.match(captionRegex);
    if (imgMatch && imgMatch[1]) setImageUrl(imgMatch[1]);
    if (captionMatch && captionMatch[1]) setImageCaption(captionMatch[1]);
  }, [seoHtmlExample]);

  const tabs: TabItem[] = [
    {
      id: 'html-structure',
      label: 'HTML Structure',
      content: (
        <pre className="font-mono bg-gray-50 p-4 rounded border overflow-auto max-h-[60vh] whitespace-pre leading-6 text-sm">{seoHtmlExample}</pre>
      )
    },
    {
      id: 'preview',
      label: 'Preview',
      content: (
        <div className="p-4 border rounded bg-white max-h-[60vh] overflow-auto">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Titre Principal avec Mot-Clé Principal</h1>
          <div className="flex justify-between mb-6 text-gray-500 text-sm">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 mr-2" />
              <span>Par <a href="#" className="underline">Nom de l'Auteur</a> • 15 Mai 2023</span>
            </div>
            <span>Temps de lecture: 5 min</span>
          </div>
          <div className="leading-relaxed text-gray-700">
            <div className={["relative my-4 text-center bg-gray-50 rounded overflow-hidden", isImageLoading ? 'min-h-[300px] animate-pulse' : ''].join(' ')}>
              <img 
                src={imageUrl}
                alt="Image d'illustration" 
                className="max-w-full h-auto block mx-auto"
                onLoad={() => setIsImageLoading(false)}
                onError={(e) => { e.currentTarget.src = ''; setIsImageLoading(false); }}
              />
            </div>
            <p className="text-center text-gray-500 text-sm mt-2 px-4">{imageCaption}</p>
            <p className="mb-4">
              Introduction qui engage le lecteur et contient naturellement les mots-clés principaux. 
              L'introduction doit captiver l'attention et expliquer clairement le sujet de l'article.
            </p>
            <div className="mb-8">
              <h2 className="text-xl font-semibold my-6 text-gray-900">Première Section avec Mot-Clé Secondaire</h2>
              <p className="mb-4">
                Contenu détaillé avec des paragraphes courts et faciles à lire. 
                Inclure des mots-clés de manière naturelle, sans suroptimisation.
              </p>
              <h3 className="text-lg font-medium my-5 text-gray-800">Sous-Section Détaillée</h3>
              <p className="mb-4">
                Plus de contenu informatif. Utiliser des phrases variées en longueur pour maintenir l'intérêt.
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li className="mb-2">Premier point important à retenir</li>
                <li className="mb-2">Deuxième élément avec un mot-clé pertinent</li>
                <li className="mb-2">Troisième élément qui complète l'information</li>
              </ul>
            </div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold my-6 text-gray-900">Questions Fréquentes</h2>
              <div className="border rounded mb-4 overflow-hidden bg-white shadow">
                <div className="px-4 py-3 font-medium bg-gray-50 cursor-pointer flex justify-between items-center border-b hover:bg-gray-100">Question 1 incluant un mot-clé important ?<span>▼</span></div>
                <div className="p-4 bg-white"><p className="m-0 leading-6">Réponse détaillée et utile qui répond directement à la question...</p></div>
              </div>
              <div className="border rounded mb-4 overflow-hidden bg-white shadow">
                <div className="px-4 py-3 font-medium bg-gray-50 cursor-pointer flex justify-between items-center border-b hover:bg-gray-100">Question 2 sur un aspect connexe ?<span>▼</span></div>
                <div className="p-4 bg-white"><p className="m-0 leading-6">Explication complète avec des informations pertinentes...</p></div>
              </div>
            </div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold my-6 text-gray-900">Conclusion</h2>
              <p className="mb-4">
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
      <p className="text-gray-500 mb-6 text-sm">
        Use this structure as a guide to create blog posts optimized for search engines.
      </p>
      <Tabs tabs={tabs} />
    </Modal>
  )
} 