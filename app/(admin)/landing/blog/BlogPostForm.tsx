'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import type { BlogPost as PrismaBlogPost } from '@prisma/client'
import { createBlogPost, updateBlogPost } from '@/lib/actions/blog-post-actions'
import RichTextEditor from '@/app/components/Forms/RichTextEditor'
import { TagInput } from '@/app/components/Tag/TagInput'
import { useRichTextEditor } from '@/app/hooks/useRichTextEditor'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { SEOModalGenerator } from '@/app/components/SEOGenerator'
import { ArticleContent } from '@/app/components/SEOGenerator'
import Modal from '@/app/components/Common/Modal'
import { HelpCircle } from 'lucide-react'

// Étendre le type BlogPost pour inclure les champs manquants
interface BlogPostWithAdditionalFields extends Omit<PrismaBlogPost, 'tags' | 'metaKeywords' | 'relatedArticles'> {
  imageWidth: number | null
  imageHeight: number | null
  auteur: string | null
  text: string
  imageUrl: string
  imageAlt: string
  tags: string // stocké comme JSON string
  relatedArticles: string // stocké comme JSON string
  metaKeywords: string // stocké comme JSON string
}

// Fonction pour analyser le HTML et extraire un objet ArticleContent
/**
 * Analyse le contenu HTML et extrait une structure ArticleContent compatible avec l'assistant SEO
 * 
 * Cette fonction parcourt le HTML brut de l'éditeur RichTextEditor et tente d'extraire :
 * - L'introduction (premier paragraphe)
 * - Les titres H2 pour les sections principales
 * - Les titres H3 pour les sous-sections
 * - Les listes (ul/ol), citations (blockquote) et images (img)
 * - La conclusion (section avec titre "Conclusion")
 * 
 * Limitations:
 * - Fonctionne uniquement côté client (DOMParser)
 * - Assume une structure hiérarchique h1 > h2 > h3
 * - La conclusion doit être précédée par un titre "Conclusion"
 * 
 * @param html Le contenu HTML à analyser
 * @param title Le titre de l'article (h1)
 * @param tags Les mots-clés/tags
 * @param mainImageUrl L'URL de l'image principale
 * @param imageAlt Le texte alternatif de l'image principale
 * @returns Un objet ArticleContent partiel compatible avec l'assistant SEO
 */
function parseHTMLToArticleContent(html: string, title: string = '', tags: string[] = [], mainImageUrl: string = '', imageAlt: string = ''): Partial<ArticleContent> {
  if (!html || typeof window === 'undefined') {
    return { 
      title: title ? title.trim() : '', 
      tags: tags.map(tag => tag.trim()), 
      mainImage: { 
        url: mainImageUrl ? mainImageUrl.trim() : '', 
        alt: imageAlt ? imageAlt.trim() : '' 
      } 
    }
  }
  
  // Fonction utilitaire pour nettoyer les textes
  const cleanTextContent = (element: Element | null): string => {
    if (!element || !element.textContent) return '';
    return element.textContent.trim();
  }
  
  try {
    // Créer un DOM temporaire pour analyser le HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Initialiser l'objet ArticleContent
    const articleContent: Partial<ArticleContent> = {
      title: title ? title.trim() : '',
      mainImage: { 
        url: mainImageUrl ? mainImageUrl.trim() : '', 
        alt: imageAlt ? imageAlt.trim() : '' 
      },
      tags: tags.map(tag => tag.trim()),
      introduction: '',
      sections: [],
      conclusion: ''
    }
    
    // Chercher à l'intérieur de <article> s'il existe
    const articleElement = doc.querySelector('article') || doc

    // Vérifier si le titre est dans un header
    const headerElement = articleElement.querySelector('header')
    
    // Extraire le titre à partir du header s'il existe
    if (headerElement) {
      const h1Element = headerElement.querySelector('h1')
      if (h1Element && !title) {
        articleContent.title = cleanTextContent(h1Element)
      }
      
      // Chercher l'image principale dans le header
      const imgElement = headerElement.querySelector('img')
      if (imgElement && !mainImageUrl) {
        articleContent.mainImage = {
          url: imgElement.getAttribute('src')?.trim() || '',
          alt: imgElement.getAttribute('alt')?.trim() || ''
        }
      }
    }
    
    // Extraire l'introduction (le premier paragraphe)
    const introDiv = articleElement.querySelector('.introduction')
    const introP = introDiv ? introDiv.querySelector('p') : articleElement.querySelector('p')
    if (introP) {
      articleContent.introduction = cleanTextContent(introP)
    }
    
    // Extraire les sections (h2) et leurs contenus
    const h2Elements = articleElement.querySelectorAll('h2')
    const sections: any[] = []
    
    h2Elements.forEach((h2, index) => {
      // Vérifier si c'est la conclusion
      if (h2.textContent?.toLowerCase().trim() === 'conclusion') {
        // Trouver le paragraphe suivant la conclusion
        let conclusionContent = ''
        let nextElement = h2.nextElementSibling
        while (nextElement && nextElement.tagName !== 'H2') {
          if (nextElement.tagName === 'P') {
            conclusionContent += cleanTextContent(nextElement) + ' '
          }
          nextElement = nextElement.nextElementSibling
        }
        articleContent.conclusion = conclusionContent.trim()
        return
      }
      
      // Créer une section
      const section: any = {
        id: Date.now() + index,
        title: cleanTextContent(h2),
        content: '',
        subsections: []
      }
      
      // Trouver le contenu de cette section (premier paragraphe après h2)
      let nextElement = h2.nextElementSibling
      if (nextElement && nextElement.tagName === 'P') {
        section.content = cleanTextContent(nextElement)
        nextElement = nextElement.nextElementSibling
      }
      
      // Trouver les sous-sections (h3) à l'intérieur de cette section
      while (nextElement && nextElement.tagName !== 'H2') {
        if (nextElement.tagName === 'H3') {
          const subsection: any = {
            id: Date.now() + index + Math.random(),
            title: cleanTextContent(nextElement),
            content: '',
            elements: []
          }
          
          // Trouver le contenu de cette sous-section
          let subNextElement = nextElement.nextElementSibling
          if (subNextElement && subNextElement.tagName === 'P') {
            subsection.content = cleanTextContent(subNextElement)
            subNextElement = subNextElement.nextElementSibling
          }
          
          // Chercher les éléments spéciaux (listes, citations, images)
          while (subNextElement && subNextElement.tagName !== 'H3' && subNextElement.tagName !== 'H2') {
            if (subNextElement.tagName === 'UL') {
              const items: string[] = []
              subNextElement.querySelectorAll('li').forEach(li => {
                items.push(cleanTextContent(li))
              })
              
              subsection.elements.push({
                id: Date.now() + Math.random(),
                type: 'unorderedList',
                items
              })
            } else if (subNextElement.tagName === 'OL') {
              const items: string[] = []
              subNextElement.querySelectorAll('li').forEach(li => {
                items.push(cleanTextContent(li))
              })
              
              subsection.elements.push({
                id: Date.now() + Math.random(),
                type: 'orderedList',
                items
              })
            } else if (subNextElement.tagName === 'BLOCKQUOTE') {
              const quoteText = cleanTextContent(subNextElement.querySelector('p'))
              const author = subNextElement.querySelector('cite')?.textContent?.replace('—', '').trim() || ''
              
              subsection.elements.push({
                id: Date.now() + Math.random(),
                type: 'quote',
                text: quoteText,
                author: author.trim()
              })
            } else if (subNextElement.tagName === 'IMG') {
              const imgElement = subNextElement as HTMLImageElement
              
              subsection.elements.push({
                id: Date.now() + Math.random(),
                type: 'image',
                url: imgElement.src.trim(),
                alt: imgElement.alt.trim()
              })
            }
            
            subNextElement = subNextElement.nextElementSibling
          }
          
          section.subsections.push(subsection)
        }
        
        nextElement = nextElement.nextElementSibling
      }
      
      sections.push(section)
    })
    
    if (sections.length > 0) {
      articleContent.sections = sections
    }
    
    return articleContent
  } catch (error) {
    console.error('Erreur lors de l\'analyse du HTML:', error)
    return { 
      title: title ? title.trim() : '', 
      tags: tags.map(tag => tag.trim()), 
      mainImage: { 
        url: mainImageUrl ? mainImageUrl.trim() : '', 
        alt: imageAlt ? imageAlt.trim() : '' 
      } 
    }
  }
}

// Composant pour la miniature de l'image
function ImageThumbnail({ url }: { url: string }) {
  return (
    <div className="inline-flex items-center">
      <div className="relative w-6 h-6 mr-1">
        <Image
          src={url}
          alt="Miniature"
          width={96}
          height={96}
          className="object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <span className="text-xs text-gray-500">✓</span>
    </div>
  )
}

// Interface pour les validations SEO
interface SEOValidation {
  isValid: boolean
  score: number
  checks: {
    title: boolean
    metaDescription: boolean
    content: boolean
    images: boolean
    headings: boolean
    keywords: boolean
    links: boolean
    wordCount: number
  }
}

// Schéma de validation avec Zod
const blogPostSchema = z.object({
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(60, 'Le titre SEO doit faire moins de 60 caractères'),
  slug: z.string()
    .min(1, 'Le slug URL est requis')
    .regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
  metaDescription: z.string()
    .min(120, 'La meta description doit faire au moins 120 caractères')
    .max(160, 'La meta description ne doit pas dépasser 160 caractères'),
  metaKeywords: z.string()
    .min(1, 'Les mots-clés meta sont requis'),
  auteur: z.string()
    .min(1, 'Le nom de l\'auteur est requis'),
  text: z.string().min(1, 'Le contenu de l\'article est requis'),
  featuredImageUrl: z.string().min(1, 'Une image à la une est requise'),
  featuredImageAlt: z.string().min(1, 'Le texte alternatif de l\'image est requis'),
  featuredImageWidth: z.number().min(1, 'La largeur de l\'image est requise'),
  featuredImageHeight: z.number().min(1, 'La hauteur de l\'image est requise'),
  tags: z.array(z.string())
    .min(2, 'Ajoutez au moins 2 tags pour le référencement'),
  relatedArticles: z.array(z.object({
    id: z.string(),
    title: z.string()
  })).optional()
})

type BlogPostFormData = z.infer<typeof blogPostSchema>

interface BlogPostFormProps {
  blogPost?: BlogPostWithAdditionalFields | null
  isEditMode?: boolean
}

// Exemple de code HTML SEO idéal à afficher dans la modale
const SAMPLE_HTML_SEO = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Découvrez comment les Real World Assets (RWA) transforment le marché de l'art contemporain en 2024. Tokenisation, fractionnement et blockchain : une nouvelle ère pour collectionneurs et artistes.">
  <meta name="keywords" content="RWA, art contemporain, tokenisation, blockchain, NFT, art numérique, investissement artistique">
  <title>RWA dans l'Art Contemporain : Révolution Numérique des Actifs Artistiques</title>
  
  <!-- Schema.org markup pour Article -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "RWA dans l'Art Contemporain : Révolution Numérique des Actifs Artistiques",
    "description": "Découvrez comment les Real World Assets (RWA) transforment le marché de l'art contemporain en 2024. Tokenisation, fractionnement et blockchain : une nouvelle ère pour collectionneurs et artistes.",
    "image": "https://exemple.com/images/rwa-art-contemporain.jpg",
    "author": {
      "@type": "Person",
      "name": "Nom de l'Auteur"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Votre Galerie d'Art",
      "logo": {
        "@type": "ImageObject",
        "url": "https://exemple.com/logo.png"
      }
    },
    "datePublished": "2024-03-25",
    "dateModified": "2024-03-25"
  }
  </script>
</head>
<body>

<article>
  <header>
    <h1>RWA dans l'Art Contemporain : Révolution Numérique des Actifs Artistiques</h1>
    <p class="meta">Publié le <time datetime="2024-03-25">25 mars 2024</time> | Temps de lecture : 5 minutes</p>
    <img src="https://exemple.com/images/rwa-art-contemporain.jpg" alt="Tokenisation d'œuvres d'art contemporain via la technologie RWA" width="800" height="500">
  </header>

  <section>
    <p>L'intersection entre les <strong>Real World Assets (RWA)</strong> et l'art contemporain représente aujourd'hui l'une des évolutions les plus fascinantes du marché artistique. Cette fusion technologique permet désormais de tokeniser des œuvres physiques sur la blockchain, créant ainsi un pont inédit entre l'art traditionnel et l'univers numérique.</p>
  </section>

  <section>
    <h2>Qu'est-ce que la Tokenisation d'Art via RWA ?</h2>
    <p>La tokenisation d'œuvres d'art transforme des actifs physiques en actifs numériques vérifiables sur blockchain. Concrètement, une peinture ou sculpture peut être représentée par des tokens numériques, chacun représentant une fraction de propriété de l'œuvre originale.</p>
    
    <p>Cette technologie offre plusieurs avantages révolutionnaires :</p>
    
    <ul>
      <li><strong>Fractionnement de propriété</strong> : Des œuvres valant plusieurs millions peuvent être détenues collectivement</li>
      <li><strong>Liquidité accrue</strong> : L'art devient négociable sur des plateformes numériques 24/7</li>
      <li><strong>Traçabilité absolue</strong> : L'historique de propriété est immuablement enregistré</li>
      <li><strong>Accessibilité démocratisée</strong> : L'investissement artistique s'ouvre à tous les budgets</li>
    </ul>
  </section>

  <section>
    <h2>Les Plateformes Pionnières de RWA Artistique</h2>
    <p>Plusieurs plateformes innovantes ont émergé pour faciliter cette convergence entre art et blockchain :</p>
    
    <h3>Masterworks</h3>
    <p>Masterworks a révolutionné l'investissement artistique en permettant l'achat de fractions d'œuvres de maîtres comme Banksy ou Basquiat à partir de quelques centaines d'euros seulement. <a href="https://www.masterworks.com" target="_blank" rel="noopener">Leur plateforme</a> enregistre déjà plus de 500 000 utilisateurs.</p>
    
    <h3>La Place</h3>
    <p>Développée en France, La Place propose une approche hybride intégrant galerie physique et plateforme de tokenisation. Leur exposition récente "Fragments d'Art" a attiré plus de 3 000 visiteurs en présentant simultanément œuvres physiques et leurs équivalents tokenisés.</p>
  </section>

  <section>
    <h2>Impact sur le Marché de l'Art Contemporain</h2>
    <p>L'intégration des RWA dans l'écosystème artistique transforme profondément plusieurs aspects du marché :</p>
    
    <ol>
      <li><strong>Valorisation des œuvres</strong> : Les artistes peuvent bénéficier de royalties automatiques à chaque revente grâce aux smart contracts</li>
      <li><strong>Nouvelles formes de mécénat</strong> : Des communautés peuvent collectionner collectivement</li>
      <li><strong>Internationalisation facilitée</strong> : Les barrières géographiques s'effacent pour les collectionneurs</li>
    </ol>
    
    <p>Une étude récente de Deloitte révèle que 64% des gestionnaires de patrimoine considèrent désormais l'art tokenisé comme un élément important des portefeuilles d'investissement alternatifs.</p>
  </section>

  <section>
    <h2>Défis et Perspectives d'Avenir</h2>
    <p>Malgré son potentiel révolutionnaire, l'intersection RWA-art fait face à plusieurs défis :</p>
    
    <ul>
      <li>Cadres réglementaires encore en développement</li>
      <li>Éducation des collectionneurs traditionnels</li>
      <li>Questions de conservation des œuvres physiques</li>
      <li>Évolution des standards de certification</li>
    </ul>
  </section>

  <section>
    <h2>Conclusion</h2>
    <p>La tokenisation des œuvres d'art via RWA représente bien plus qu'une innovation technologique passagère. Elle constitue une transformation fondamentale de l'écosystème artistique, redéfinissant les notions de propriété, d'accessibilité et de valorisation. Pour les artistes comme pour les collectionneurs, cette révolution ouvre des perspectives inédites, démocratisant l'accès à un marché historiquement élitiste tout en créant de nouvelles opportunités de création et d'investissement.</p>
    
    <p>Que vous soyez artiste, collectionneur ou simple amateur d'art, les RWA redessinent les contours de votre relation avec l'art contemporain, annonçant une ère de démocratisation et d'innovation sans précédent dans l'histoire de l'art.</p>
  </section>

  <footer>
    <div class="tags">
      <span>Tags :</span>
      <a href="/tags/rwa" rel="tag">RWA</a>,
      <a href="/tags/art-contemporain" rel="tag">Art Contemporain</a>,
      <a href="/tags/blockchain" rel="tag">Blockchain</a>,
      <a href="/tags/tokenisation" rel="tag">Tokenisation</a>,
      <a href="/tags/investissement-artistique" rel="tag">Investissement Artistique</a>
    </div>
    
    <div class="cta">
      <h3>Vous souhaitez en savoir plus sur la tokenisation de l'art ?</h3>
      <p>Inscrivez-vous à notre newsletter mensuelle pour recevoir les dernières actualités sur l'art et la technologie.</p>
      <a href="/newsletter" class="button">S'inscrire à la newsletter</a>
    </div>
    
    <div class="related-posts">
      <h3>Articles associés</h3>
      <ul>
        <li><a href="/blog/nft-vs-rwa-differences">NFT vs RWA : Quelles différences pour les collectionneurs d'art ?</a></li>
        <li><a href="/blog/investir-art-blockchain">Comment investir dans l'art via la blockchain en 2024</a></li>
        <li><a href="/blog/artistes-contemporains-tokenisation">5 artistes contemporains qui embrassent la tokenisation</a></li>
      </ul>
    </div>
  </footer>
</article>

</body>
</html>`

// Composant pour le modal affichant le code HTML SEO
function SEOExampleModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(SAMPLE_HTML_SEO)
    toast.success('Code HTML copié dans le presse-papier')
  }
  
  return (
    <>
      <button 
        onClick={handleOpen}
        type="button"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-1"
        title="Voir un exemple de structure HTML optimisée pour le SEO"
      >
        <HelpCircle size={16} className="mr-1" />
        Voir un exemple de structure HTML idéale pour le SEO
      </button>
      
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Exemple de structure HTML optimisée pour le SEO"
      >
        <div className="p-4">
          <p className="mb-4 text-sm text-gray-600">
            Voici un exemple de structure HTML idéale pour un article de blog optimisé pour le référencement :
          </p>
          
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[70vh]">
            <pre className="text-xs whitespace-pre-wrap">{SAMPLE_HTML_SEO}</pre>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn btn-primary btn-small"
            >
              Copier le code
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default function BlogPostForm({ blogPost, isEditMode = false }: BlogPostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>(blogPost?.imageUrl || '')
  const [imagePreview, setImagePreview] = useState<string>(blogPost?.imageUrl || '')
  const [tags, setTags] = useState<string[]>(() => {
    if (!blogPost?.tags) return [];
    try {
      return JSON.parse(blogPost?.tags || '[]');
    } catch (e) {
      // Si le parsing échoue, essayons de traiter comme une chaîne séparée par des virgules
      return (blogPost?.tags || '').split(',').map(tag => tag.trim()).filter(Boolean);
    }
  });
  const [relatedArticles, setRelatedArticles] = useState<Array<{ id: string, title: string }>>(() => {
    if (!blogPost?.relatedArticles) return [];
    try {
      return JSON.parse(blogPost?.relatedArticles || '[]');
    } catch (e) {
      console.error('Erreur lors du parsing des articles liés:', e);
      return [];
    }
  });
  const [seoScore, setSeoScore] = useState<SEOValidation>({
    isValid: false,
    score: 0,
    checks: {
      title: false,
      metaDescription: false,
      content: false,
      images: false,
      headings: false,
      keywords: false,
      links: false,
      wordCount: 0
    }
  })
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: blogPost?.title || '',
      text: blogPost?.text || '',
      featuredImageUrl: blogPost?.imageUrl || '',
      featuredImageAlt: blogPost?.imageAlt || '',
      featuredImageWidth: blogPost?.imageWidth ? Number(blogPost.imageWidth) : 0,
      featuredImageHeight: blogPost?.imageHeight ? Number(blogPost.imageHeight) : 0,
      tags: (() => {
        if (!blogPost?.tags) return [];
        try {
          return JSON.parse(blogPost?.tags || '[]');
        } catch (e) {
          // Si le parsing échoue, essayons de traiter comme une chaîne séparée par des virgules
          return (blogPost?.tags || '').split(',').map(tag => tag.trim()).filter(Boolean);
        }
      })(),
      metaDescription: blogPost?.metaDescription || '',
      metaKeywords: blogPost?.metaKeywords || '',
      slug: blogPost?.slug || '',
      auteur: blogPost?.auteur || '',
      relatedArticles: (() => {
        if (!blogPost?.relatedArticles) return [];
        try {
          return JSON.parse(blogPost?.relatedArticles || '[]');
        } catch (e) {
          console.error('Erreur lors du parsing des articles liés:', e);
          return [];
        }
      })()
    }
  })

  // Hook personnalisé pour l'éditeur de texte riche
  const richTextEditor = useRichTextEditor<BlogPostFormData>('text', setValue, watch)

  // État pour stocker les données analysées pour le SEO
  const [parsedSEOData, setParsedSEOData] = useState<Partial<ArticleContent> | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour générer un slug à partir du titre
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }, [])

  // Mettre à jour le slug lorsque le titre change
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'title' && value.title && !isEditMode) {
        setValue('slug', generateSlug(value.title))
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, setValue, generateSlug, isEditMode])

  // Surveiller les changements d'URL d'image
  useEffect(() => {
    if (featuredImageUrl) {
      setValue('featuredImageUrl', featuredImageUrl)
    }
  }, [featuredImageUrl, setValue])

  // Surveiller les changements de tags
  useEffect(() => {
    setValue('tags', tags)
  }, [tags, setValue])

  // Analyser le SEO du contenu
  const analyzeSEO = useCallback(() => {
    const title = watch('title')
    const metaDescription = watch('metaDescription')
    const content = watch('text')
    const tagsArray = watch('tags')
    
    const checks = {
      title: false,
      metaDescription: false,
      content: false,
      images: false,
      headings: false,
      keywords: false,
      links: false,
      wordCount: 0
    }
    
    // Extraction de texte simple depuis HTML (approx.)
    const plainText = content ? content.replace(/<[^>]*>/g, ' ') : ''
    const wordCount = plainText.split(/\s+/).filter(Boolean).length
    checks.wordCount = wordCount
    
    // Vérification du titre
    checks.title = Boolean(title && title.length >= 30 && title.length <= 60)
    
    // Vérification de la meta description
    checks.metaDescription = Boolean(metaDescription && metaDescription.length >= 120 && metaDescription.length <= 160)
    
    // Vérification du contenu
    checks.content = wordCount >= 300
    
    // Vérification des sous-titres (approx.)
    const h2Count = (content?.match(/<h2/gi) || []).length
    const h3Count = (content?.match(/<h3/gi) || []).length
    checks.headings = (h2Count + h3Count) >= 2
    
    // Vérification des images
    checks.images = (content?.match(/<img/gi) || []).length >= 1 && !!watch('featuredImageUrl')
    
    // Vérification des liens
    checks.links = (content?.match(/<a\s+(?:[^>]*?\s+)?href/gi) || []).length >= 2
    
    // Vérification des mots-clés
    if (tagsArray && tagsArray.length > 0 && content) {
      const keywordsPresent = tagsArray.filter((tag: string) => {
        const regex = new RegExp(tag, 'gi')
        return (plainText.match(regex) || []).length > 0
      })
      checks.keywords = keywordsPresent.length >= Math.ceil(tagsArray.length * 0.7)
    }
    
    // Calcul du score SEO
    const checkValues = Object.values(checks).filter(val => typeof val === 'boolean')
    const passedChecks = checkValues.filter(Boolean).length
    const score = Math.round((passedChecks / checkValues.length) * 100)
    
    // Le score SEO est maintenant accessible dans la modale de l'assistant SEO plutôt qu'affiché directement ici
    setSeoScore({
      isValid: score >= 70,
      score,
      checks
    })
  }, [watch])

  // Analyser le SEO à chaque changement de formulaire
  useEffect(() => {
    const subscription = watch(() => {
      analyzeSEO()
    })
    return () => subscription.unsubscribe()
  }, [watch, analyzeSEO])

  // Analyser le contenu HTML pour l'assistant SEO avant ouverture
  const prepareContentForSEO = useCallback(() => {
    const currentContent = watch('text').trim()
    const currentTitle = watch('title').trim()
    const currentTags = watch('tags') || []
    const currentImageUrl = watch('featuredImageUrl').trim()
    const currentImageAlt = watch('featuredImageAlt').trim()
    
    if (typeof window !== 'undefined') {
      const parsedContent = parseHTMLToArticleContent(
        currentContent,
        currentTitle,
        currentTags,
        currentImageUrl,
        currentImageAlt
      )
      setParsedSEOData(parsedContent)
      toast.success('Contenu HTML analysé avec succès', { id: 'seo-analysis' })
    }
  }, [watch])
  
  // Version avec debounce pour les mises à jour automatiques
  const debouncedPrepareContentForSEO = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const currentContent = watch('text').trim()
      const currentTitle = watch('title').trim()
      const currentTags = watch('tags') || []
      const currentImageUrl = watch('featuredImageUrl').trim()
      const currentImageAlt = watch('featuredImageAlt').trim()
      
      if (typeof window !== 'undefined') {
        const parsedContent = parseHTMLToArticleContent(
          currentContent,
          currentTitle,
          currentTags,
          currentImageUrl,
          currentImageAlt
        )
        setParsedSEOData(parsedContent)
      }
    }, 1000) // 1 seconde de délai pour éviter les analyses trop fréquentes
  }, [watch])

  // Surveiller les changements dans le contenu pour mettre à jour les données SEO
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (['text', 'title', 'tags', 'featuredImageUrl', 'featuredImageAlt'].includes(name as string)) {
        debouncedPrepareContentForSEO()
      }
    })
    
    // Analyser le contenu initial
    debouncedPrepareContentForSEO()
    
    return () => {
      subscription.unsubscribe()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [watch, debouncedPrepareContentForSEO])

  const onSubmit = async (data: BlogPostFormData) => {
    setIsSubmitting(true)
    
    try {
      const tagsJson = JSON.stringify(data.tags)
      const relatedArticlesJson = JSON.stringify(data.relatedArticles || [])
      const readingTime = Math.ceil(data.text.length / 1500) // Calcul automatique du temps de lecture
      
      if (isEditMode && blogPost) {
        // Mode édition
        const result = await updateBlogPost(blogPost.id, {
          title: data.title,
          text: data.text,
          imageUrl: data.featuredImageUrl,
          imageAlt: data.featuredImageAlt,
          imageWidth: data.featuredImageWidth,
          imageHeight: data.featuredImageHeight,
          readingTime,
          tags: tagsJson,
          metaDescription: data.metaDescription,
          metaKeywords: data.metaKeywords,
          slug: data.slug,
          auteur: data.auteur,
          relatedArticles: relatedArticlesJson
        } as any)
        
        if (result.success) {
          toast.success('Article de blog mis à jour avec succès')
          router.push('/landing/blog')
        } else {
          toast.error(result.message || 'Une erreur est survenue lors de la mise à jour')
        }
      } else {
        // Mode création
        const result = await createBlogPost({
          title: data.title,
          text: data.text,
          imageUrl: data.featuredImageUrl,
          imageAlt: data.featuredImageAlt,
          imageWidth: data.featuredImageWidth,
          imageHeight: data.featuredImageHeight,
          readingTime,
          tags: tagsJson,
          metaDescription: data.metaDescription,
          metaKeywords: data.metaKeywords,
          slug: data.slug,
          auteur: data.auteur,
          relatedArticles: relatedArticlesJson
        } as any)
        
        if (result.success) {
          toast.success('Article de blog créé avec succès')
          router.push('/landing/blog')
        } else {
          toast.error(result.message || 'Une erreur est survenue lors de la création')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/landing/blog')
  }

  const handleImageUpload = (url: string) => {
    setFeaturedImageUrl(url)
  }

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags)
  }

  const title = isEditMode ? 'Modifier l\'article de blog' : 'Créer un nouvel article de blog'
  const submitButtonText = isEditMode ? 'Mettre à jour' : 'Créer'
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">
          {isEditMode ? 'Modifiez les informations de l\'article' : 'Créez un nouvel article de blog'}
        </p>
        <SEOExampleModal />
      </div>
      
      <div className="page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="form-container">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Titre SEO <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                {...register('title')}
                maxLength={60}
              />
              <div className="text-xs text-gray-500 mt-1">
                {watch('title')?.length || 0}/60 caractères
              </div>
              {errors.title?.message && (
                <p className="error-message">{errors.title.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="slug" className="form-label">
                Slug URL <span className="text-danger">*</span>
              </label>
              <input
                id="slug"
                type="text"
                className={`form-input ${errors.slug ? 'input-error' : ''}`}
                {...register('slug')}
              />
              {errors.slug?.message && (
                <p className="error-message">{errors.slug.message}</p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                URL: votresite.com/blog/<strong>{watch('slug')}</strong>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="auteur" className="form-label">
                Auteur <span className="text-danger">*</span>
              </label>
              <input
                id="auteur"
                type="text"
                className={`form-input ${errors.auteur ? 'input-error' : ''}`}
                {...register('auteur')}
              />
              {errors.auteur?.message && (
                <p className="error-message">{errors.auteur.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="metaDescription" className="form-label">
                Meta Description <span className="text-danger">*</span>
              </label>
              <textarea
                id="metaDescription"
                className={`form-input ${errors.metaDescription ? 'input-error' : ''}`}
                {...register('metaDescription')}
                rows={3}
                maxLength={160}
              />
              <div className="text-xs text-gray-500 mt-1">
                {watch('metaDescription')?.length || 0}/160 caractères (idéal: 120-160)
              </div>
              {errors.metaDescription?.message && (
                <p className="error-message">{errors.metaDescription.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="metaKeywords" className="form-label">
                Meta Keywords <span className="text-danger">*</span>
              </label>
              <input
                id="metaKeywords"
                type="text"
                className={`form-input ${errors.metaKeywords ? 'input-error' : ''}`}
                {...register('metaKeywords')}
                placeholder="mot-clé1, mot-clé2, mot-clé3"
              />
              {errors.metaKeywords && (
                <p className="error-message">{errors.metaKeywords.message}</p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Séparez les mots-clés par des virgules (important pour le SEO)
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Tags <span className="text-danger">*</span>
              </label>
              <TagInput 
                value={tags}
                onChange={setTags}
                placeholder="Ajouter des tags..."
                maxTags={10}
                className="form-input"
              />
              <div className="text-xs text-gray-500 mt-1">
                Minimum 2 tags pour faciliter la navigation
              </div>
              {errors.tags && (
                <p className="error-message">{errors.tags.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Image à la une <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                {...register('featuredImageUrl', {
                  onChange: (e) => setImagePreview(e.target.value)
                })}
                className={`form-input ${errors.featuredImageUrl ? 'input-error' : ''}`}
                placeholder="https://example.com/image.jpg"
                disabled={isSubmitting}
              />
              {errors.featuredImageUrl && (
                <p className="error-message">Une image à la une est requise</p>
              )}
              {imagePreview && (
                <div className="mt-1">
                  <ImageThumbnail url={imagePreview} />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="featuredImageAlt" className="form-label">
                Texte alternatif d'image <span className="text-danger">*</span>
              </label>
              <input
                id="featuredImageAlt"
                type="text"
                className={`form-input ${errors.featuredImageAlt ? 'input-error' : ''}`}
                placeholder="Description de l'image (important pour le SEO et l'accessibilité)"
                {...register('featuredImageAlt')}
              />
              {errors.featuredImageAlt && (
                <p className="error-message">{errors.featuredImageAlt.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="featuredImageWidth" className="form-label">
                  Largeur de l'image <span className="text-danger">*</span>
                </label>
                <input
                  id="featuredImageWidth"
                  type="number"
                  className={`form-input ${errors.featuredImageWidth ? 'input-error' : ''}`}
                  placeholder="Largeur en pixels"
                  {...register('featuredImageWidth', { valueAsNumber: true })}
                />
                {errors.featuredImageWidth && (
                  <p className="error-message">{errors.featuredImageWidth.message}</p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="featuredImageHeight" className="form-label">
                  Hauteur de l'image <span className="text-danger">*</span>
                </label>
                <input
                  id="featuredImageHeight"
                  type="number"
                  className={`form-input ${errors.featuredImageHeight ? 'input-error' : ''}`}
                  placeholder="Hauteur en pixels"
                  {...register('featuredImageHeight', { valueAsNumber: true })}
                />
                {errors.featuredImageHeight && (
                  <p className="error-message">{errors.featuredImageHeight.message}</p>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Articles liés
              </label>
              <div className="border rounded-md p-3 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">
                  Fonctionnalité à implémenter : Sélecteur d'articles liés
                </p>
                <div className="text-xs text-gray-500">
                  Cette fonctionnalité permettra de choisir des articles liés dans une liste
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="text" className="form-label">
                Contenu de l'article <span className="text-danger">*</span>
              </label>
              <div className="form-field">
                <RichTextEditor 
                  value={richTextEditor.value} 
                  onChange={richTextEditor.onChange}
                />
                <div className="mt-2 flex items-center gap-2">
                  <SEOModalGenerator
                    onContentGenerated={(html) => {
                      richTextEditor.onChange(html);
                    }}
                    initialData={parsedSEOData || {
                      title: watch('title')?.trim() || '',
                      tags: (watch('tags') || []).map(tag => typeof tag === 'string' ? tag.trim() : tag),
                      mainImage: {
                        url: watch('featuredImageUrl')?.trim() || '',
                        alt: watch('featuredImageAlt')?.trim() || ''
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary flex items-center gap-2 text-sm"
                    onClick={prepareContentForSEO}
                    title="Analyser le contenu existant avant d'ouvrir l'assistant SEO"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Analyser le contenu
                  </button>
                </div>
                <div className="text-xs text-blue-600 mt-1 italic">
                  L'analyse SEO complète est disponible dans l'onglet "Analyse SEO" de l'assistant SEO.
                </div>
              </div>
              {errors.text && (
                <p className="error-message">{errors.text.message}</p>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary btn-medium"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" message="" inline />
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 