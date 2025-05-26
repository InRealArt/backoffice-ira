'use client'

import Modal from '../Common/Modal'
import Tabs, { TabItem } from '../Tabs/Tabs'
import BlogPreviewRenderer from './BlogPreviewRenderer'
import SEOScoreAnalyzer from './SEOScoreAnalyzer'
import { generateSEOHTML, FormData } from './htmlGenerator'
import styles from '../SeoGuide/SeoGuideModal.module.scss'

interface SEOAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  formData: FormData
}

export default function SEOAssistantModal({ isOpen, onClose, formData }: SEOAssistantModalProps) {
  const generatedHTML = generateSEOHTML(formData)
  
  const tabs: TabItem[] = [
    {
      id: 'preview',
      label: 'Preview',
      content: (
        <BlogPreviewRenderer formData={formData} />
      )
    },
    {
      id: 'html-structure',
      label: 'HTML Structure',
      content: (
        <pre className={styles.codeBlock}>{generatedHTML}</pre>
      )
    },
    {
      id: 'seo-score',
      label: 'SEO Score',
      content: (
        <SEOScoreAnalyzer formData={formData} />
      )
    }
  ]
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SEO Assistant - Prévisualisation de l'article">
      <p className={styles.modalDescription}>
        Prévisualisation en temps réel de votre article basée sur les données du formulaire.
      </p>
      <Tabs tabs={tabs} defaultTabId="preview" />
    </Modal>
  )
} 