'use client'

import { useState, useRef, useEffect } from 'react'
import { InfoTooltipProps } from './types'
import styles from '../ArtworkForm.module.scss'

function InfoTooltip({ title, content }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Fermer l'infobulle en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={styles.tooltipContainer} ref={tooltipRef}>
      <span 
        className={styles.infoIcon} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={title}
      >
        ?
      </span>
      {isOpen && (
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipHeader}>
            <h4>{title}</h4>
            <button 
              className={styles.closeTooltip}
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          <div className={styles.tooltipBody}>
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

export default InfoTooltip 