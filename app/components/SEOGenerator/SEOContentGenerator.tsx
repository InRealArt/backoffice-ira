'use client'

import React, { useRef, useCallback } from 'react'
import { useState, useEffect } from 'react'
import { 
  PlusCircle, Trash2, ImageIcon, ListOrdered, 
  List, Quote, SaveIcon, Eye, Code, ArrowDown, ArrowUp,
  Bold, Italic, Link, AlignLeft
} from 'lucide-react'

// Types pour le contenu de l'article
export interface ArticleContent {
  title: string
  mainImage: { url: string; alt: string }
  introduction: string
  sections: {
    id: number
    title: string
    content: string
    subsections: {
      id: number
      title: string
      content: string
      elements?: {
        id: number
        type: 'unorderedList' | 'orderedList' | 'quote' | 'image'
        items?: string[]
        text?: string
        author?: string
        url?: string
        alt?: string
      }[]
    }[]
  }[]
  conclusion: string
  tags: string[]
}

interface SEOContentGeneratorProps {
  value: string
  onChange: (html: string, wordCount?: number) => void
  initialData?: Partial<ArticleContent>
  hideControls?: boolean
}

// Fonction utilitaire pour appliquer des balises HTML au texte sélectionné
const applyFormatting = (
  element: HTMLTextAreaElement,
  startTag: string,
  endTag: string,
  setValue: (val: string) => void
) => {
  const start = element.selectionStart
  const end = element.selectionEnd
  const currentValue = element.value
  
  if (start === end) {
    // Pas de sélection, insérer les balises vides
    const newValue = 
      currentValue.substring(0, start) + 
      startTag + endTag + 
      currentValue.substring(end)
    
    setValue(newValue)
    
    // Placer le curseur entre les balises
    setTimeout(() => {
      element.focus()
      element.selectionStart = start + startTag.length
      element.selectionEnd = start + startTag.length
    }, 0)
  } else {
    // Entourer la sélection avec les balises
    const selectedText = currentValue.substring(start, end)
    const newValue = 
      currentValue.substring(0, start) + 
      startTag + selectedText + endTag + 
      currentValue.substring(end)
    
    setValue(newValue)
    
    // Restaurer la sélection en incluant les balises
    setTimeout(() => {
      element.focus()
      element.selectionStart = start
      element.selectionEnd = end + startTag.length + endTag.length
    }, 0)
  }
}

// Composant pour les boutons de formatage
const FormattingToolbar = ({ 
  textareaElement,
  onFormatting 
}: { 
  textareaElement: HTMLTextAreaElement | null
  onFormatting: (newValue: string) => void
}) => {
  const handleFormat = (startTag: string, endTag: string) => {
    if (textareaElement) {
      applyFormatting(
        textareaElement,
        startTag,
        endTag,
        onFormatting
      )
    }
  }
  
  return (
    <div className="flex flex-col mb-1 py-1 px-2 bg-gray-50 border rounded-md">
      <div className="text-xs text-gray-500 mb-1">Formatage:</div>
      <div className="grid grid-flow-col auto-cols-max gap-2">
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded tooltip-parent inline-block"
          onClick={() => handleFormat('<p>', '</p>')}
          title="Paragraphe"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded font-bold tooltip-parent inline-block"
          onClick={() => handleFormat('<strong>', '</strong>')}
          title="Gras"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded italic tooltip-parent inline-block"
          onClick={() => handleFormat('<em>', '</em>')}
          title="Italique"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded text-blue-500 tooltip-parent inline-block"
          onClick={() => handleFormat('<a href="#">', '</a>')}
          title="Lien"
        >
          <Link size={16} />
        </button>
      </div>
      <style jsx>{`
        .tooltip-parent {
          position: relative;
        }
        .tooltip-parent:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: #333;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          margin-bottom: 5px;
          z-index: 100;
        }
        .tooltip-parent:hover::before {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 4px;
          border-style: solid;
          border-color: #333 transparent transparent transparent;
          margin-bottom: -3px;
          z-index: 100;
        }
      `}</style>
    </div>
  )
}

const SEOContentGenerator = ({ value, onChange, initialData = {}, hideControls = false }: SEOContentGeneratorProps) => {
  // Fonction pour nettoyer les valeurs de texte
  const cleanValue = (text: string | undefined): string => {
    if (!text) return '';
    return text.trim();
  }
  
  // IDs constants pour introduction et conclusion
  const INTRO_ID = -1;
  const CONCLUSION_ID = -2;
  
  const [article, setArticle] = useState<ArticleContent>({
    title: cleanValue(initialData.title),
    mainImage: {
      url: initialData.mainImage?.url || '',
      alt: cleanValue(initialData.mainImage?.alt)
    },
    introduction: cleanValue(initialData.introduction),
    sections: initialData.sections ? initialData.sections.map(section => ({
      id: section.id,
      title: cleanValue(section.title),
      content: cleanValue(section.content),
      subsections: section.subsections ? section.subsections.map(subsection => ({
        id: subsection.id,
        title: cleanValue(subsection.title),
        content: cleanValue(subsection.content),
        elements: subsection.elements ? subsection.elements.map(element => {
          let cleanedElement = { ...element };
          
          if (element.type === 'quote') {
            cleanedElement.text = cleanValue(element.text);
            cleanedElement.author = cleanValue(element.author);
          } else if (element.type === 'image') {
            cleanedElement.alt = cleanValue(element.alt);
          } else if (element.items) {
            cleanedElement.items = element.items.map(cleanValue);
          }
          
          return cleanedElement;
        }) : []
      })) : []
    })) : [],
    conclusion: cleanValue(initialData.conclusion),
    tags: initialData.tags ? initialData.tags.map(cleanValue) : []
  })
  
  const [activeTab, setActiveTab] = useState('editor')
  const [currentWordCount, setCurrentWordCount] = useState(0)
  const [previewHtml, setPreviewHtml] = useState('')
  
  // Utiliser une référence pour suivre les changements sans déclencher de re-rendus
  const htmlOutputRef = useRef(previewHtml)
  
  // Utiliser useRef au lieu de useState pour les refs DOM
  const sectionTextareas = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const subsectionTextareas = useRef<Record<number, HTMLTextAreaElement | null>>({});
  
  // Callbacks pour attacher les refs aux textareas
  const attachSectionTextarea = useCallback((element: HTMLTextAreaElement | null, sectionId: number) => {
    if (element) {
      sectionTextareas.current[sectionId] = element;
    }
  }, []);
  
  const attachSubsectionTextarea = useCallback((element: HTMLTextAreaElement | null, subsectionId: number) => {
    if (element) {
      subsectionTextareas.current[subsectionId] = element;
    }
  }, []);
  
  // Générer le HTML final
  const generateHtml = useCallback((articleData: ArticleContent) => {
    // Nettoyer les chaînes de caractères pour éviter les problèmes HTML
    const cleanHtml = (str: string) => {
      if (!str) return '';
      // Trim le texte avant et après pour supprimer les espaces superflus
      return str.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    
    // Préserver les balises HTML pour le contenu formaté tout en nettoyant la chaîne
    const preserveHtml = (str: string) => {
      if (!str) return '';
      return str.trim();
    };
    
    // Ajouter des identifiants uniques pour aider au rendu
    const randomId = () => `id-${Math.random().toString(36).substr(2, 9)}`;
    
    // Débuter avec une balise article
    let html = `<article>\n\n`;
    
    // Titre principal encapsulé dans header
    html += `<header>\n  <h1 data-h-id="${randomId()}">${cleanHtml(articleData.title)}</h1>\n`;
    
    // Image principale dans le header si elle existe
    if (articleData.mainImage.url) {
      html += `  <img src="${articleData.mainImage.url}" alt="${cleanHtml(articleData.mainImage.alt)}" width="800" height="500">\n`;
    }
    
    // Fermer le header
    html += `</header>\n\n`;
    
    // Introduction - préserver le HTML formaté
    html += `<div class="introduction" data-section="intro">\n  <p>${preserveHtml(articleData.introduction)}</p>\n</div>\n\n`;
    
    // Sections
    articleData.sections.forEach((section, idx) => {
      const sectionId = `section-${idx}-${randomId()}`;
      html += `<h2 data-h-id="${sectionId}">${cleanHtml(section.title)}</h2>\n\n`;
      html += `<p data-section-content="${sectionId}">${preserveHtml(section.content)}</p>\n\n`;
      
      // Sous-sections
      section.subsections.forEach((subsection, subIdx) => {
        const subsectionId = `subsection-${idx}-${subIdx}-${randomId()}`;
        html += `<h3 data-h-id="${subsectionId}">${cleanHtml(subsection.title)}</h3>\n\n`;
        html += `<p data-subsection-content="${subsectionId}">${preserveHtml(subsection.content)}</p>\n\n`;
        
        // Éléments spéciaux (listes, citations, etc.)
        if (subsection.elements && subsection.elements.length > 0) {
          subsection.elements.forEach(element => {
            if (element.type === 'unorderedList' && element.items && element.items.length > 0) {
              html += `<ul>\n`
              element.items.forEach(item => {
                html += `  <li>${preserveHtml(item)}</li>\n`
              })
              html += `</ul>\n\n`
            } else if (element.type === 'orderedList' && element.items && element.items.length > 0) {
              html += `<ol>\n`
              element.items.forEach(item => {
                html += `  <li>${preserveHtml(item)}</li>\n`
              })
              html += `</ol>\n\n`
            } else if (element.type === 'quote') {
              html += `<blockquote>\n  <p>${preserveHtml(element.text || '')}</p>\n`
              if (element.author) {
                html += `  <cite>— ${cleanHtml(element.author)}</cite>\n`
              }
              html += `</blockquote>\n\n`
            } else if (element.type === 'image') {
              html += `<img src="${element.url || ''}" alt="${cleanHtml(element.alt || '')}" width="600" height="400">\n\n`
            }
          })
        }
      })
    })
    
    // Conclusion - préserver le HTML formaté
    if (articleData.conclusion) {
      html += `<h2 data-h-id="conclusion-${randomId()}">Conclusion</h2>\n\n`;
      html += `<p data-section="conclusion">${preserveHtml(articleData.conclusion)}</p>\n\n`;
    }
    
    // Tags
    if (articleData.tags.length > 0) {
      html += `<div class="tags" data-section="tags">\n  <span>Tags :</span>\n`;
      articleData.tags.forEach(tag => {
        const tagSlug = tag.toLowerCase().replace(/\s+/g, '-');
        html += `  <a href="/tags/${tagSlug}" rel="tag">${cleanHtml(tag)}</a>,\n`;
      });
      html += `</div>\n`;
    }
    
    // Fermer la balise article
    html += `\n</article>`;
    
    return html;
  }, [])
  
  // Mettre à jour le compteur de mots
  useEffect(() => {
    // Calculer le nombre de mots
    const allText = [
      article.title,
      article.introduction,
      ...article.sections.flatMap(section => [
        section.title,
        section.content,
        ...section.subsections.flatMap(subsection => [
          subsection.title,
          subsection.content
        ])
      ]),
      article.conclusion
    ].join(' ')
    
    const wordCount = allText.split(/\s+/).filter(Boolean).length
    setCurrentWordCount(wordCount)
  }, [article])
  
  // Effet séparé pour générer le HTML et le passer au parent
  useEffect(() => {
    const generatedHtml = generateHtml(article)
    
    // Mettre à jour seulement si le HTML a changé
    if (generatedHtml !== htmlOutputRef.current) {
      htmlOutputRef.current = generatedHtml
      setPreviewHtml(generatedHtml)
      // Utiliser un timeout pour éviter les boucles de mise à jour
      const timer = setTimeout(() => {
        onChange(generatedHtml, currentWordCount)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [article, generateHtml, onChange, currentWordCount])
  
  // Ajouter une nouvelle section
  const addSection = () => {
    setArticle(prev => ({
      ...prev,
      sections: [...prev.sections, {
        id: Date.now(),
        title: '',
        content: '',
        subsections: []
      }]
    }))
  }
  
  // Ajouter une sous-section
  const addSubsection = (sectionId: number) => {
    setArticle(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              subsections: [...section.subsections, {
                id: Date.now(),
                title: '',
                content: '',
                elements: []
              }]
            } 
          : section
      )
    }))
  }
  
  // Ajouter un élément spécial (liste, citation, etc.)
  const addElement = (sectionId: number, subsectionId: number, type: 'unorderedList' | 'orderedList' | 'quote' | 'image') => {
    setArticle(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              subsections: section.subsections.map(subsection => 
                subsection.id === subsectionId
                  ? {
                      ...subsection,
                      elements: [...(subsection.elements || []), {
                        id: Date.now(),
                        type,
                        items: type === 'unorderedList' || type === 'orderedList' ? [''] : undefined,
                        text: type === 'quote' ? '' : undefined,
                        author: type === 'quote' ? '' : undefined,
                        url: type === 'image' ? '' : undefined,
                        alt: type === 'image' ? '' : undefined
                      }]
                    }
                  : subsection
              )
            } 
          : section
      )
    }))
  }
  
  // Supprimer une section
  const removeSection = (sectionId: number) => {
    setArticle(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }))
  }
  
  // Supprimer une sous-section
  const removeSubsection = (sectionId: number, subsectionId: number) => {
    setArticle(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              subsections: section.subsections.filter(subsection => subsection.id !== subsectionId)
            } 
          : section
      )
    }))
  }
  
  // Supprimer un élément
  const removeElement = (sectionId: number, subsectionId: number, elementId: number) => {
    setArticle(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              subsections: section.subsections.map(subsection => 
                subsection.id === subsectionId
                  ? {
                      ...subsection,
                      elements: (subsection.elements || []).filter(element => element.id !== elementId)
                    }
                  : subsection
              )
            } 
          : section
      )
    }))
  }
  
  // Déplacer une section vers le haut ou le bas
  const moveSection = (sectionId: number, direction: 'up' | 'down') => {
    const sectionIndex = article.sections.findIndex(section => section.id === sectionId)
    if ((direction === 'up' && sectionIndex === 0) || 
        (direction === 'down' && sectionIndex === article.sections.length - 1)) {
      return
    }
    
    const newSections = [...article.sections]
    const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1
    const [movedSection] = newSections.splice(sectionIndex, 1)
    newSections.splice(newIndex, 0, movedSection)
    
    setArticle(prev => ({
      ...prev,
      sections: newSections
    }))
  }
  
  // Ajouter un tag
  const addTag = (tag: string) => {
    if (tag && !article.tags.includes(tag)) {
      setArticle(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }
  
  // Supprimer un tag
  const removeTag = (tagToRemove: string) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }
  
  // Obtenir des recommandations SEO
  const getSeoRecommendations = () => {
    const recommendations = []
    
    // Vérifier la longueur du titre
    if (article.title.length < 40 || article.title.length > 60) {
      recommendations.push(`Le titre devrait être entre 40 et 60 caractères (actuellement ${article.title.length})`)
    }
    
    // Vérifier l'image principale
    if (!article.mainImage.url) {
      recommendations.push('Ajoutez une image principale avec texte alternatif')
    } else if (!article.mainImage.alt) {
      recommendations.push('Ajoutez un texte alternatif pour l\'image principale')
    }
    
    // Vérifier l'introduction
    if (article.introduction.length < 100) {
      recommendations.push("L'introduction devrait faire au moins 100 caractères")
    }
    
    // Vérifier le nombre de sections
    if (article.sections.length < 2) {
      recommendations.push('Ajoutez au moins 2 sections (H2) à votre article')
    }
    
    // Vérifier la longueur totale
    if (currentWordCount < 300) {
      recommendations.push(`L'article est trop court (${currentWordCount} mots). Visez au moins 300 mots`)
    }
    
    // Vérifier les tags
    if (article.tags.length < 2) {
      recommendations.push('Ajoutez au moins 2 tags pour améliorer le référencement')
    }
    
    return recommendations
  }
  
  const [isApplying, setIsApplying] = useState(false)
  
  // Fonction pour appliquer manuellement le contenu HTML généré
  const handleApplyContent = () => {
    setIsApplying(true)
    
    // Générer le HTML final
    const finalHtml = generateHtml(article)
    
    // Appeler la fonction onChange avec le HTML généré
    onChange(finalHtml, currentWordCount)
    
    // Afficher un feedback visuel temporaire
    setTimeout(() => {
      setIsApplying(false)
    }, 1000)
  }
  
  return (
    <div className="seo-content-generator mt-4 p-4 border-2 border-blue-400 bg-blue-50 rounded-lg">
      <div className="text-lg font-bold mb-4 text-blue-800 flex items-center">
        <span className="mr-2">🔍</span>
        Générateur de contenu SEO
      </div>
      
      <div className="tabs-container">
        {!hideControls && (
          <div className="tabs-list">
            <button 
              className={`tab-trigger ${activeTab === 'editor' ? 'active' : ''}`} 
              onClick={() => setActiveTab('editor')}
            >
              Éditeur SEO
            </button>
            <button 
              className={`tab-trigger ${activeTab === 'preview' ? 'active' : ''}`} 
              onClick={() => setActiveTab('preview')}
            >
              Aperçu
            </button>
            <button 
              className={`tab-trigger ${activeTab === 'html' ? 'active' : ''}`} 
              onClick={() => setActiveTab('html')}
            >
              HTML
            </button>
            <button 
              className={`tab-trigger ${activeTab === 'seo' ? 'active' : ''}`} 
              onClick={() => setActiveTab('seo')}
            >
              Analyse SEO
            </button>
          </div>
        )}
        
        <div className={`tab-content ${(activeTab === 'editor' || hideControls) ? 'block' : 'hidden'}`}>
          {/* Titre et image principale */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-blue-700 font-medium text-sm uppercase tracking-wider mb-3">Informations principales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre principal (H1)</label>
                <input 
                  type="text"
                  className="form-input w-full"
                  value={article.title} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArticle(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre principal de votre article (avec mot-clé)" 
                  maxLength={70}
                />
                <p className="text-xs text-gray-500 mt-1">{article.title.length}/70 caractères (idéal: 40-60)</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">URL de l'image principale</label>
                  <input 
                    type="text"
                    className="form-input w-full"
                    value={article.mainImage.url} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArticle(prev => ({ 
                      ...prev, 
                      mainImage: { ...prev.mainImage, url: e.target.value } 
                    }))}
                    placeholder="https://exemple.com/image.jpg" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Texte alternatif de l'image</label>
                  <input 
                    type="text"
                    className="form-input w-full"
                    value={article.mainImage.alt} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArticle(prev => ({ 
                      ...prev, 
                      mainImage: { ...prev.mainImage, alt: e.target.value } 
                    }))}
                    placeholder="Description de l'image (avec mot-clé)" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Introduction */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-blue-700 font-medium text-sm uppercase tracking-wider mb-3">Introduction</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Introduction (avec mot-clé principal)</label>
              <FormattingToolbar 
                textareaElement={sectionTextareas.current[INTRO_ID] || null}
                onFormatting={(newValue) => setArticle(prev => ({ ...prev, introduction: newValue }))}
              />
              <textarea 
                ref={(el) => attachSectionTextarea(el, INTRO_ID)}
                className="form-textarea w-full"
                value={article.introduction} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setArticle(prev => ({ ...prev, introduction: e.target.value }))}
                placeholder="Introduisez votre sujet en incluant votre mot-clé principal dès le premier paragraphe (100-150 mots)" 
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {article.introduction.split(/\s+/).filter(Boolean).length} mots (idéal: 100-150)
              </p>
            </div>
          </div>
          
          {/* Sections */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-blue-700 font-medium text-sm uppercase tracking-wider">Sections de l'article</h3>
              <button 
                type="button" 
                onClick={addSection} 
                className="btn btn-primary btn-medium flex items-center gap-1"
              >
                <PlusCircle size={16} /> Ajouter une section (H2)
              </button>
            </div>
            
            <div className="space-y-5">
              {article.sections.map((section, sectionIndex) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Section {sectionIndex + 1}</h4>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => moveSection(section.id, 'up')} 
                        className="btn btn-secondary btn-sm"
                        disabled={sectionIndex === 0}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => moveSection(section.id, 'down')} 
                        className="btn btn-secondary btn-sm"
                        disabled={sectionIndex === article.sections.length - 1}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => removeSection(section.id)} 
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Titre et contenu de la section */}
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Titre de section (H2)</label>
                      <input 
                        type="text"
                        className="form-input w-full"
                        value={section.title} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArticle(prev => ({
                          ...prev,
                          sections: prev.sections.map(s => 
                            s.id === section.id 
                              ? { ...s, title: e.target.value } 
                              : s
                          )
                        }))}
                        placeholder="Titre de section avec mot-clé secondaire" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Contenu principal</label>
                      <FormattingToolbar 
                        textareaElement={sectionTextareas.current[section.id] || null}
                        onFormatting={(newValue) => {
                          setArticle(prev => ({
                            ...prev,
                            sections: prev.sections.map(s => 
                              s.id === section.id 
                                ? { ...s, content: newValue } 
                                : s
                            )
                          }))
                        }}
                      />
                      <textarea 
                        ref={(el) => attachSectionTextarea(el, section.id)}
                        className="form-textarea w-full"
                        value={section.content} 
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setArticle(prev => ({
                          ...prev,
                          sections: prev.sections.map(s => 
                            s.id === section.id 
                              ? { ...s, content: e.target.value } 
                              : s
                          )
                        }))}
                        placeholder="Contenu principal de la section" 
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {/* Sous-sections */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700">Sous-sections</h5>
                      <button 
                        type="button" 
                        onClick={() => addSubsection(section.id)} 
                        className="btn btn-primary btn-sm flex items-center gap-1"
                      >
                        <PlusCircle size={14} /> Ajouter une sous-section (H3)
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {section.subsections.map((subsection, subsectionIndex) => (
                        <div key={subsection.id} className="border-l-2 border-blue-200 pl-4 ml-2 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="text-sm font-medium text-gray-700">Sous-section {subsectionIndex + 1}</h6>
                            <button 
                              type="button" 
                              onClick={() => removeSubsection(section.id, subsection.id)} 
                              className="btn btn-danger btn-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          {/* Titre et contenu de la sous-section */}
                          <div className="space-y-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Titre de sous-section (H3)</label>
                              <input 
                                type="text"
                                className="form-input w-full"
                                value={subsection.title} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArticle(prev => ({
                                  ...prev,
                                  sections: prev.sections.map(s => 
                                    s.id === section.id 
                                      ? { 
                                          ...s, 
                                          subsections: s.subsections.map(sub => 
                                            sub.id === subsection.id 
                                              ? { ...sub, title: e.target.value } 
                                              : sub
                                          ) 
                                        } 
                                      : s
                                  )
                                }))}
                                placeholder="Titre de sous-section" 
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium mb-1">Contenu</label>
                              <FormattingToolbar 
                                textareaElement={subsectionTextareas.current[subsection.id] || null}
                                onFormatting={(newValue) => {
                                  setArticle(prev => ({
                                    ...prev,
                                    sections: prev.sections.map(s => 
                                      s.id === section.id 
                                        ? { 
                                            ...s, 
                                            subsections: s.subsections.map(sub => 
                                              sub.id === subsection.id 
                                                ? { ...sub, content: newValue } 
                                                : sub
                                            ) 
                                          } 
                                        : s
                                    )
                                  }))
                                }}
                              />
                              <textarea 
                                ref={(el) => attachSubsectionTextarea(el, subsection.id)}
                                className="form-textarea w-full"
                                value={subsection.content} 
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setArticle(prev => ({
                                  ...prev,
                                  sections: prev.sections.map(s => 
                                    s.id === section.id 
                                      ? { 
                                          ...s, 
                                          subsections: s.subsections.map(sub => 
                                            sub.id === subsection.id 
                                              ? { ...sub, content: e.target.value } 
                                              : sub
                                          ) 
                                        } 
                                      : s
                                  )
                                }))}
                                placeholder="Contenu de la sous-section" 
                                rows={2}
                              />
                            </div>
                          </div>
                          
                          {/* Éléments spéciaux de la sous-section */}
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2 mb-3">
                              <button 
                                type="button" 
                                onClick={() => addElement(section.id, subsection.id, 'unorderedList')} 
                                className="btn btn-secondary btn-sm text-xs"
                              >
                                <List size={14} className="mr-1" /> Liste à puces
                              </button>
                              <button 
                                type="button" 
                                onClick={() => addElement(section.id, subsection.id, 'orderedList')} 
                                className="btn btn-secondary btn-sm text-xs"
                              >
                                <ListOrdered size={14} className="mr-1" /> Liste numérotée
                              </button>
                              <button 
                                type="button" 
                                onClick={() => addElement(section.id, subsection.id, 'quote')} 
                                className="btn btn-secondary btn-sm text-xs"
                              >
                                <Quote size={14} className="mr-1" /> Citation
                              </button>
                              <button 
                                type="button" 
                                onClick={() => addElement(section.id, subsection.id, 'image')} 
                                className="btn btn-secondary btn-sm text-xs"
                              >
                                <ImageIcon size={14} className="mr-1" /> Image
                              </button>
                            </div>
                            
                            {/* Rendu des éléments spéciaux */}
                            <div className="space-y-3">
                              {subsection.elements && subsection.elements.map((element, elementIndex) => (
                                <div key={element.id} className="border rounded p-3 bg-white">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium">
                                      {element.type === 'unorderedList' && 'Liste à puces'}
                                      {element.type === 'orderedList' && 'Liste numérotée'}
                                      {element.type === 'quote' && 'Citation'}
                                      {element.type === 'image' && 'Image'}
                                    </span>
                                    <button 
                                      type="button" 
                                      onClick={() => removeElement(section.id, subsection.id, element.id)} 
                                      className="btn btn-danger btn-sm h-6 w-6"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  
                                  {/* Rendu spécifique selon le type d'élément */}
                                  {(element.type === 'unorderedList' || element.type === 'orderedList') && (
                                    <div className="space-y-2">
                                      {element.items && element.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="flex items-center gap-2">
                                          <span className="text-xs font-medium w-5">{itemIndex + 1}.</span>
                                          <input 
                                            type="text"
                                            className="form-input w-full"
                                            value={item} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                              if (!element.items) return;
                                              const newItems = [...element.items]
                                              newItems[itemIndex] = e.target.value
                                              setArticle(prev => ({
                                                ...prev,
                                                sections: prev.sections.map(s => 
                                                  s.id === section.id 
                                                    ? { 
                                                        ...s, 
                                                        subsections: s.subsections.map(sub => 
                                                          sub.id === subsection.id 
                                                            ? { 
                                                                ...sub, 
                                                                elements: (sub.elements || []).map(el => 
                                                                  el.id === element.id 
                                                                    ? { ...el, items: newItems } 
                                                                    : el
                                                                ) 
                                                              } 
                                                            : sub
                                                        ) 
                                                      } 
                                                    : s
                                                )
                                              }))
                                            }}
                                            placeholder={`Élément ${itemIndex + 1}`}
                                          />
                                          {itemIndex === (element.items?.length || 0) - 1 && (
                                            <button 
                                              type="button" 
                                              onClick={() => {
                                                if (!element.items) return;
                                                const newItems = [...element.items, '']
                                                setArticle(prev => ({
                                                  ...prev,
                                                  sections: prev.sections.map(s => 
                                                    s.id === section.id 
                                                      ? { 
                                                          ...s, 
                                                          subsections: s.subsections.map(sub => 
                                                            sub.id === subsection.id 
                                                              ? { 
                                                                  ...sub, 
                                                                  elements: (sub.elements || []).map(el => 
                                                                    el.id === element.id 
                                                                      ? { ...el, items: newItems } 
                                                                      : el
                                                                  ) 
                                                                } 
                                                              : sub
                                                          ) 
                                                        } 
                                                      : s
                                                  )
                                                }))
                                              }} 
                                              className="btn btn-secondary btn-sm h-6 w-6"
                                            >
                                              <PlusCircle size={12} />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {element.type === 'quote' && (
                                    <div className="space-y-2">
                                      <textarea 
                                        className="form-textarea w-full"
                                        value={element.text || ''} 
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                          setArticle(prev => ({
                                            ...prev,
                                            sections: prev.sections.map(s => 
                                              s.id === section.id 
                                                ? { 
                                                    ...s, 
                                                    subsections: s.subsections.map(sub => 
                                                      sub.id === subsection.id 
                                                        ? { 
                                                            ...sub, 
                                                            elements: (sub.elements || []).map(el => 
                                                              el.id === element.id 
                                                                ? { ...el, text: e.target.value } 
                                                                : el
                                                            ) 
                                                          } 
                                                        : sub
                                                    ) 
                                                  } 
                                                : s
                                            )
                                          }))
                                        }}
                                        placeholder="Texte de la citation"
                                        rows={2}
                                      />
                                      <input 
                                        type="text"
                                        className="form-input w-full"
                                        value={element.author || ''} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          setArticle(prev => ({
                                            ...prev,
                                            sections: prev.sections.map(s => 
                                              s.id === section.id 
                                                ? { 
                                                    ...s, 
                                                    subsections: s.subsections.map(sub => 
                                                      sub.id === subsection.id 
                                                        ? { 
                                                            ...sub, 
                                                            elements: (sub.elements || []).map(el => 
                                                              el.id === element.id 
                                                                ? { ...el, author: e.target.value } 
                                                                : el
                                                            ) 
                                                          } 
                                                        : sub
                                                    ) 
                                                  } 
                                                : s
                                            )
                                          }))
                                        }}
                                        placeholder="Auteur de la citation (optionnel)"
                                      />
                                    </div>
                                  )}
                                  
                                  {element.type === 'image' && (
                                    <div className="space-y-2">
                                      <input 
                                        type="text"
                                        className="form-input w-full"
                                        value={element.url || ''} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          setArticle(prev => ({
                                            ...prev,
                                            sections: prev.sections.map(s => 
                                              s.id === section.id 
                                                ? { 
                                                    ...s, 
                                                    subsections: s.subsections.map(sub => 
                                                      sub.id === subsection.id 
                                                        ? { 
                                                            ...sub, 
                                                            elements: (sub.elements || []).map(el => 
                                                              el.id === element.id 
                                                                ? { ...el, url: e.target.value } 
                                                                : el
                                                            ) 
                                                          } 
                                                        : sub
                                                    ) 
                                                  } 
                                                : s
                                            )
                                          }))
                                        }}
                                        placeholder="URL de l'image"
                                      />
                                      <input 
                                        type="text"
                                        className="form-input w-full"
                                        value={element.alt || ''} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          setArticle(prev => ({
                                            ...prev,
                                            sections: prev.sections.map(s => 
                                              s.id === section.id 
                                                ? { 
                                                    ...s, 
                                                    subsections: s.subsections.map(sub => 
                                                      sub.id === subsection.id 
                                                        ? { 
                                                            ...sub, 
                                                            elements: (sub.elements || []).map(el => 
                                                              el.id === element.id 
                                                                ? { ...el, alt: e.target.value } 
                                                                : el
                                                            ) 
                                                          } 
                                                        : sub
                                                    ) 
                                                  } 
                                                : s
                                            )
                                          }))
                                        }}
                                        placeholder="Texte alternatif de l'image"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Conclusion */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="text-blue-700 font-medium text-sm uppercase tracking-wider mb-3">Conclusion</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Conclusion</label>
              <FormattingToolbar 
                textareaElement={sectionTextareas.current[CONCLUSION_ID] || null}
                onFormatting={(newValue) => setArticle(prev => ({ ...prev, conclusion: newValue }))}
              />
              <textarea 
                ref={(el) => attachSectionTextarea(el, CONCLUSION_ID)}
                className="form-textarea w-full"
                value={article.conclusion} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setArticle(prev => ({ ...prev, conclusion: e.target.value }))}
                placeholder="Résumez les points clés et ajoutez un appel à l'action (100-200 mots)" 
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {article.conclusion.split(/\s+/).filter(Boolean).length} mots (idéal: 100-200)
              </p>
            </div>
          </div>
          
          {/* Tags */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-blue-700 font-medium text-sm uppercase tracking-wider mb-3">Tags / Mots-clés</h3>
            <div>
              <div className="flex flex-wrap gap-2 mb-3 min-h-8">
                {article.tags.map(tag => (
                  <div key={tag} className="bg-blue-100 text-blue-800 text-xs rounded-full px-3 py-1 flex items-center">
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)} 
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  id="tag-input"
                  className="form-input"
                  placeholder="Ajouter un tag" 
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.currentTarget as HTMLInputElement
                      addTag(input.value)
                      input.value = ''
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const input = document.getElementById('tag-input') as HTMLInputElement
                    addTag(input.value)
                    input.value = ''
                  }} 
                  className="btn btn-primary btn-medium"
                >
                  Ajouter
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Appuyez sur Entrée après chaque tag. Minimum 2 tags.</p>
            </div>
          </div>
        </div>
        
        {!hideControls && (
          <>
            <div className={`tab-content ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
              <div className="border rounded-lg p-6">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
            
            <div className={`tab-content ${activeTab === 'html' ? 'block' : 'hidden'}`}>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap break-all text-sm">
                  {previewHtml}
                </pre>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  navigator.clipboard.writeText(previewHtml)
                    .then(() => alert('HTML copié dans le presse-papiers'))
                    .catch(err => console.error('Erreur lors de la copie: ', err))
                }} 
                className="btn btn-primary btn-medium mt-2"
              >
                <Code size={16} className="mr-2" /> Copier le HTML
              </button>
            </div>
            
            <div className={`tab-content ${activeTab === 'seo' ? 'block' : 'hidden'}`}>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-blue-800 font-medium mb-2">Informations SEO</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Nombre de mots:</span> {currentWordCount} 
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        currentWordCount < 300 
                          ? 'bg-red-100 text-red-800' 
                          : currentWordCount < 600 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {currentWordCount < 300 
                          ? 'Trop court' 
                          : currentWordCount < 600 
                            ? 'Acceptable' 
                            : 'Bon'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">Titre principal</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Bouton d'application */}
        <div className="mt-8 border-t border-blue-200 pt-4 flex justify-end">
          <button
            type="button"
            onClick={handleApplyContent}
            className="btn btn-primary btn-medium flex items-center gap-2"
            disabled={isApplying}
          >
            {isApplying ? (
              <>
                <span className="animate-pulse">⏳</span>
                <span>Application en cours...</span>
              </>
            ) : (
              <>
                <SaveIcon size={16} />
                <span>Appliquer au formulaire</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .tabs-list {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 1rem;
        }
        
        .tab-trigger {
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .tab-trigger:hover {
          color: #3b82f6;
        }
        
        .tab-trigger.active {
          color: #3b82f6;
          font-weight: 600;
        }
        
        .tab-trigger.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #3b82f6;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-primary {
          background-color: #3b82f6;
          color: white;
          border: 1px solid #2563eb;
        }
        
        .btn-primary:hover {
          background-color: #2563eb;
        }
        
        .btn-secondary {
          background-color: #f8fafc;
          color: #475569;
          border: 1px solid #cbd5e1;
        }
        
        .btn-secondary:hover {
          background-color: #f1f5f9;
        }
        
        .btn-danger {
          background-color: #f8fafc;
          color: #ef4444;
          border: 1px solid #cbd5e1;
        }
        
        .btn-danger:hover {
          background-color: #fee2e2;
        }
        
        .btn-medium {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }
        
        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  )
}

export default SEOContentGenerator
