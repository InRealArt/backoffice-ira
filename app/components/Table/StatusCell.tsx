'use client'

import { ReactNode } from 'react'

interface StatusCellProps {
  isActive: boolean
  className?: string
  children: ReactNode
  colorType?: 'danger' | 'warning' | 'success' | 'info'
}

/**
 * Composant pour afficher une cellule de tableau qui change de couleur en fonction d'un statut
 * 
 * @param isActive - Indique si l'élément est actif
 * @param className - Classes CSS additionnelles à appliquer
 * @param colorType - Type de couleur à appliquer (danger, warning, success, info)
 * @param children - Contenu de la cellule
 */
export function StatusCell({ 
  isActive, 
  className = '', 
  colorType = 'danger',
  children 
}: StatusCellProps) {
  // Déterminer la couleur en fonction du type
  const getBackgroundColor = () => {
    if (isActive) return undefined
    
    switch (colorType) {
      case 'danger':
        return 'rgba(255, 0, 0, 0.1)'
      case 'warning':
        return 'rgba(255, 193, 7, 0.1)'
      case 'success':
        return 'rgba(40, 167, 69, 0.1)'
      case 'info':
        return 'rgba(23, 162, 184, 0.1)'
      default:
        return 'rgba(255, 0, 0, 0.1)'
    }
  }
  
  return (
    <td 
      className={className}
      data-status={!isActive ? 'inactive' : 'active'}
      style={{ 
        backgroundColor: getBackgroundColor(),
        transition: 'background-color 0.2s ease'
      }}
    >
      {children}
    </td>
  )
} 