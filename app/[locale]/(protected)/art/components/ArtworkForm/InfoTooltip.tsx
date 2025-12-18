'use client'

import { useState, useRef, useEffect } from 'react'
import { InfoTooltipProps } from './types'

function InfoTooltip({ title, content }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [positionStyle, setPositionStyle] = useState<{ top?: string; left?: string; right?: string }>({})
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tooltipContentRef = useRef<HTMLDivElement>(null)

  // Calculer la position du tooltip pour éviter le débordement
  useEffect(() => {
    if (isOpen && tooltipRef.current && tooltipContentRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      const tooltipWidth = 320 // w-80 = 320px
      const padding = 16 // padding pour éviter le bord de l'écran
      const tooltipTop = rect.bottom + 8 // mt-2 = 8px

      // Aligner le bord gauche du tooltip avec le bord droit de l'icône
      let left = rect.right

      // Vérifier que le tooltip ne déborde pas à gauche
      if (left < padding) {
        left = padding
      }

      // Vérifier que le tooltip ne déborde pas à droite
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding
        // Si même après ajustement, il déborde à gauche, le forcer à padding
        if (left < padding) {
          left = padding
        }
      }

      setPositionStyle({
        top: `${tooltipTop}px`,
        left: `${left}px`,
        right: 'auto'
      })
    }
  }, [isOpen])

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
    <div className="relative inline-block ml-2" ref={tooltipRef}>
      <span 
        className="info-tooltip-icon inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-black text-xs cursor-pointer transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-black" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={title}
      >
        ?
      </span>
      {isOpen && (
        <div 
          ref={tooltipContentRef}
          className="info-tooltip-popup fixed z-50 w-80 bg-white dark:bg-gray-900 rounded-md shadow-lg dark:shadow-xl p-0 overflow-hidden animate-fade-in border border-gray-200 dark:border-gray-700"
          style={{
            maxWidth: 'calc(100vw - 32px)',
            ...positionStyle
          }}
        >
          <div className="info-tooltip-header flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h4 className="info-tooltip-title m-0 text-sm text-gray-900 dark:text-gray-100 font-medium">{title}</h4>
            <button 
              className="info-tooltip-close bg-transparent border-none text-lg text-gray-500 dark:text-gray-400 cursor-pointer p-0 leading-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          <div className="info-tooltip-content p-3 max-h-72 overflow-y-auto text-gray-700 dark:text-gray-200 text-sm">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

export default InfoTooltip 