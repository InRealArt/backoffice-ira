'use client'

import { useState, useRef, useEffect } from 'react'
import { InfoTooltipProps } from './types'

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
    <div className="relative inline-block ml-2" ref={tooltipRef}>
      <span 
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs cursor-pointer transition-all duration-200 hover:bg-gray-300 hover:text-gray-900" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={title}
      >
        ?
      </span>
      {isOpen && (
        <div className="absolute z-10 top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg p-0 overflow-hidden animate-fade-in">
          <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h4 className="m-0 text-sm text-gray-900 dark:text-white font-medium">{title}</h4>
            <button 
              className="bg-transparent border-none text-lg text-gray-500 cursor-pointer p-0 leading-none hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          <div className="p-3 max-h-72 overflow-y-auto text-gray-700 dark:text-gray-300 text-sm">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

export default InfoTooltip 