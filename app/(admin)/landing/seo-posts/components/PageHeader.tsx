'use client'

import { useState } from 'react'
import HelpIcon from '@/app/components/HelpIcon'
import SeoGuideModal from '@/app/components/SeoGuide'
import styles from './PageHeader.module.scss'

interface PageHeaderProps {
  title: string
  children?: React.ReactNode
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  
  const openGuideModal = () => {
    setIsGuideModalOpen(true)
  }
  
  const closeGuideModal = () => {
    setIsGuideModalOpen(false)
  }
  
  return (
    <div className={styles.pageHeader}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>{title}</h1>
        <HelpIcon onClick={openGuideModal} />
      </div>
      
      {children}
      
      <SeoGuideModal 
        isOpen={isGuideModalOpen} 
        onClose={closeGuideModal} 
      />
    </div>
  )
} 