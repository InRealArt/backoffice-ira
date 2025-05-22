'use client'

import { useState, ReactNode, useEffect } from 'react'
import styles from './Accordion.module.scss'

export interface AccordionItemProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  isOpen?: boolean
  className?: string
  onOpenChange?: (isOpen: boolean) => void
}

export function AccordionItem({ 
  title, 
  children, 
  defaultOpen = false,
  isOpen: controlledIsOpen,
  className = '',
  onOpenChange
}: AccordionItemProps) {
  // Si isOpen est fourni, utilisez-le, sinon utilisez defaultOpen pour l'état initial
  const isControlled = controlledIsOpen !== undefined
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)
  
  // L'état actuel est soit contrôlé de l'extérieur, soit géré en interne
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  // Gestion du clic sur l'en-tête de l'accordéon
  const toggleAccordion = () => {
    const newIsOpen = !isOpen
    
    // Si non contrôlé, mettre à jour l'état interne
    if (!isControlled) {
      setInternalIsOpen(newIsOpen)
    }
    
    // Notifier le parent du changement
    if (onOpenChange) {
      onOpenChange(newIsOpen)
    }
  }

  return (
    <div className={`${styles.accordionItem} ${className}`}>
      <button 
        type="button"
        className={styles.accordionHeader}
        onClick={toggleAccordion}
        aria-expanded={isOpen}
      >
        <span className={styles.accordionTitle}>{title}</span>
        <span className={`${styles.accordionIcon} ${isOpen ? styles.open : ''}`}>
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M6 9L12 15L18 9" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      
      {isOpen && (
        <div className={styles.accordionContent}>
          {children}
        </div>
      )}
    </div>
  )
}

export interface AccordionProps {
  children: ReactNode
  className?: string
  spaced?: boolean
}

export default function Accordion({ children, className = '', spaced = false }: AccordionProps) {
  const accordionClasses = [
    styles.accordion,
    spaced ? styles.spacedAccordion : '',
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={accordionClasses}>
      {children}
    </div>
  )
} 