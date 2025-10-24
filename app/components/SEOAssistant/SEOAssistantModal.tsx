'use client'

import Modal from '../Common/Modal'
import Tabs, { TabItem } from '../Tabs/Tabs'
import BlogPreviewRenderer from './BlogPreviewRenderer'
import SEOScoreAnalyzer from './SEOScoreAnalyzer'
import { generateSEOHTML, FormData } from './htmlGenerator'

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
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">{generatedHTML}</pre>
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
      <p className="text-gray-600 mb-4">
        Prévisualisation en temps réel de votre article basée sur les données du formulaire.
      </p>
      <Tabs tabs={tabs} defaultTabId="preview" />
    </Modal>
  )
} 