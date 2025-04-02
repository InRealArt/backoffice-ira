'use client'

import React, { useState, useCallback, useRef, useEffect, memo } from 'react'
import { Code, ClipboardCheck, UserCheck } from 'lucide-react'
import Modal from '../Common/Modal'
import SEOContentGenerator, { ArticleContent } from './SEOContentGenerator'
import styles from './SEOModal.module.scss'

// Fonction utilitaire pour formater le HTML avec indentation
const formatHTMLWithIndent = (html: string): string => {
  if (!html) return ''
  
  // Trimmer le HTML avant de commencer
  const trimmedHtml = html.trim()
  if (!trimmedHtml) return ''
  
  let formatted = ''
  let indent = 0
  
  // Remplacer tous les retours à la ligne et espaces multiples par un seul espace
  // Mais préserver les espaces significatifs dans le contenu textuel
  const tmp = trimmedHtml.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ')
  
  // Liste des balises qui augmentent l'indentation
  const indentationTags = ['article', 'header', 'div', 'p', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'article', 'section', 'header', 'footer', 'main', 'aside', 'nav', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'figure', 'figcaption']
  
  // Regex pour capturer les balises
  const tagRegex = /<\/?([a-z0-9]+)(?:\s+[^>]*)?\s*>/gi
  
  let lastIndex = 0
  let match
  
  while ((match = tagRegex.exec(tmp)) !== null) {
    const tag = match[1].toLowerCase()
    const isClosingTag = match[0].startsWith('</')
    const isAutoClosingTag = match[0].endsWith('/>')
    
    // Ajouter le texte avant la balise
    const beforeTag = tmp.substring(lastIndex, match.index).trim()
    if (beforeTag) {
      formatted += '\n' + ' '.repeat(indent * 2) + beforeTag
    }
    
    // Ajuster l'indentation pour les balises de bloc
    if (indentationTags.includes(tag)) {
      // Placer les balises de fermeture avec une indentation correcte
      if (isClosingTag) {
        indent = Math.max(0, indent - 1)
      }
      
      // Ajouter la balise avec l'indentation appropriée
      formatted += '\n' + ' '.repeat(indent * 2) + match[0]
      
      // Augmenter l'indentation après l'ouverture d'une balise
      if (!isClosingTag && !isAutoClosingTag) {
        indent++
      }
    } else {
      // Ajouter les autres balises sans modifier l'indentation
      formatted += match[0]
    }
    
    lastIndex = match.index + match[0].length
  }
  
  // Ajouter le reste du texte
  if (lastIndex < tmp.length) {
    const restOfHtml = tmp.substring(lastIndex).trim()
    if (restOfHtml) {
      formatted += '\n' + ' '.repeat(indent * 2) + restOfHtml
    }
  }
  
  // S'assurer que le résultat final est bien trimmé
  return formatted.trim()
}

interface SEOModalGeneratorProps {
  onContentGenerated?: (html: string) => void
  initialData?: Partial<ArticleContent>
}

// PreviewContent component avec React.memo pour éviter les rendus inutiles
const PreviewContent = memo(({ html }: { html: string }) => {
  if (!html) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <p className="mt-4 text-center">
          Créez du contenu dans l'onglet Éditeur pour visualiser l'aperçu ici
        </p>
      </div>
    );
  }
  
  return (
    <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  );
});

PreviewContent.displayName = 'PreviewContent';

export default function SEOModalGenerator({ 
  onContentGenerated, 
  initialData = {} 
}: SEOModalGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [currentWordCount, setCurrentWordCount] = useState(0)
  
  // Référence pour le timer d'animation de copie
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)
  
  const handleContentChange = useCallback((html: string, wordCount?: number) => {
    // S'assurer que le HTML est trimmé avant d'être formaté
    const trimmedHtml = html.trim()
    
    // Appliquer le formatage HTML dès qu'un nouveau contenu est généré
    const formattedHtml = formatHTMLWithIndent(trimmedHtml)
    
    // S'assurer que le HTML généré est à jour immédiatement
    setGeneratedHtml(prevHtml => {
      // Vérifier si le HTML a réellement changé pour éviter des rendus inutiles
      if (prevHtml !== formattedHtml) {
        return formattedHtml;
      }
      return prevHtml;
    });
    
    if (wordCount !== undefined) {
      setCurrentWordCount(wordCount);
    }
  }, []);
  
  const handleCopyHtml = useCallback(() => {
    // S'assurer que le HTML est propre avant de le formater
    const trimmedHtml = generatedHtml.trim()
    
    // Formater le HTML avant de le copier
    const formattedHtml = formatHTMLWithIndent(trimmedHtml)
    
    navigator.clipboard.writeText(formattedHtml)
      .then(() => {
        setIsCopied(true)
        
        // Réinitialiser l'état de copie après 2 secondes
        if (copyTimerRef.current) {
          clearTimeout(copyTimerRef.current)
        }
        
        copyTimerRef.current = setTimeout(() => {
          setIsCopied(false)
        }, 2000)
        
        if (onContentGenerated) {
          // Passer le HTML formaté au callback
          onContentGenerated(formattedHtml)
        }
      })
      .catch(err => console.error('Erreur lors de la copie: ', err))
  }, [generatedHtml, onContentGenerated])
  
  // Gérer le changement d'onglet en forçant une mise à jour du HTML si nécessaire
  const handleTabChange = (tab: string) => {
    // Si on passe à l'onglet Aperçu ou HTML, s'assurer que le contenu est à jour
    if (tab === 'preview' || tab === 'html') {
      // Forcer une mise à jour du DOM dans le prochain cycle
      setTimeout(() => {
        const currentDOM = document.querySelector(`.${styles.tabContent}[style*="block"] .prose`);
        if (currentDOM) {
          // Déclencher un reflow du DOM pour forcer la mise à jour du contenu
          currentDOM.classList.add('refresh-content');
          setTimeout(() => currentDOM.classList.remove('refresh-content'), 10);
        }
      }, 10);
    }
    setActiveTab(tab);
  };
  
  // Forcer la mise à jour du contenu aperçu lorsque l'onglet change
  useEffect(() => {
    if (activeTab === 'preview' || activeTab === 'html') {
      // Forcer un refresh du contenu HTML (si nécessaire)
      if (generatedHtml) {
        const refreshTimer = setTimeout(() => {
          setGeneratedHtml(html => html + ' ');
          setTimeout(() => setGeneratedHtml(html => html.trim()), 10);
        }, 10);
        return () => clearTimeout(refreshTimer);
      }
    }
  }, [activeTab]);
  
  return (
    <>
      <button 
        onClick={handleOpen}
        type="button"
        className="btn btn-primary flex items-center gap-2"
      >
        <Code size={20} />
        Assistant SEO
      </button>
      
      <Modal 
        isOpen={isOpen}
        onClose={handleClose}
        title="Générateur de contenu SEO"
      >
        <div className={styles.seoModalContainer}>
          <div className={styles.tabsList}>
            <button 
              className={`${styles.tabTrigger} ${activeTab === 'editor' ? styles.active : ''}`} 
              onClick={() => handleTabChange('editor')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Éditeur SEO
            </button>
            <button 
              className={`${styles.tabTrigger} ${activeTab === 'preview' ? styles.active : ''}`} 
              onClick={() => handleTabChange('preview')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Aperçu
            </button>
            <button 
              className={`${styles.tabTrigger} ${activeTab === 'html' ? styles.active : ''}`} 
              onClick={() => handleTabChange('html')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              HTML
            </button>
          </div>
          
          <div className={styles.contentWrapper}>
            <div className={styles.tabContent} style={{ display: activeTab === 'editor' ? 'block' : 'none' }}>
              <SEOContentGenerator 
                value={generatedHtml}
                onChange={handleContentChange}
                initialData={initialData}
                hideControls={true}
              />
            </div>
            
            <div className={styles.tabContent} style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
              <div className="p-6 border rounded-lg shadow-sm bg-white overflow-auto" style={{ minHeight: '400px' }}>
                <PreviewContent html={generatedHtml} />
              </div>
            </div>
            
            <div className={styles.tabContent} style={{ display: activeTab === 'html' ? 'block' : 'none' }}>
              {generatedHtml ? (
                <div className="bg-gray-50 rounded-lg p-4 border shadow-sm" style={{ minHeight: '400px' }}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Code HTML formaté</h3>
                    <button 
                      onClick={() => navigator.clipboard.writeText(generatedHtml)}
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      Copier
                    </button>
                  </div>
                  <pre className="whitespace-pre text-sm font-mono overflow-auto max-h-[500px] p-4 bg-white border rounded text-gray-800" style={{ lineHeight: 1.5 }}>
                    {formatHTMLWithIndent(generatedHtml.trim())}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                  <p className="mt-4 text-center">
                    Créez du contenu dans l'onglet Éditeur pour visualiser le code HTML ici
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            <div className={styles.statusIndicator}>
              <span>Nombre de mots: </span>
              <span className={styles.wordCount}>{currentWordCount}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${
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
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleClose}
                type="button"
                className="btn btn-secondary"
              >
                Fermer
              </button>
              
              <button 
                onClick={handleCopyHtml}
                type="button"
                className="btn btn-primary flex items-center gap-2"
                disabled={!generatedHtml || isCopied}
              >
                {isCopied ? (
                  <>
                    <ClipboardCheck size={16} /> 
                    Copié !
                  </>
                ) : (
                  <>
                    <Code size={16} /> 
                    Copier le HTML
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
} 