'use client'

import { ItemStatus, ResourceNftStatuses } from '@prisma/client'
import styles from './StatusBadge.module.scss'

/**
 * Types de badges supportés
 */
export type BadgeType = 
  | 'default'   // Gris - style par défaut
  | 'success'   // Vert - pour les statuts positifs/complétés
  | 'warning'   // Jaune/Orange - pour les statuts en cours/attention
  | 'error'     // Rouge - pour les erreurs
  | 'info'      // Bleu - pour les statuts informatifs
  | 'primary'   // Couleur primaire du thème

/**
 * Props du composant StatusBadge
 */
interface StatusBadgeProps {
  /**
   * Texte à afficher dans le badge
   */
  text: string
  /**
   * Type de badge qui détermine la couleur
   */
  type?: BadgeType
  /**
   * Classes CSS additionnelles
   */
  className?: string
}

/**
 * Composant StatusBadge générique pour afficher des indicateurs de statut
 */
export default function StatusBadge({ text, type = 'default', className = '' }: StatusBadgeProps) {
  const getBadgeClass = () => {
    switch(type) {
      case 'success':
        return styles.success
      case 'warning':
        return styles.warning
      case 'error':
        return styles.error
      case 'info':
        return styles.info
      case 'primary':
        return styles.primary
      default:
        return styles.default
    }
  }

  return (
    <span className={`${styles.badge} ${getBadgeClass()} ${className}`}>
      {text}
    </span>
  )
}

/**
 * Helper pour obtenir un badge correspondant à un ItemStatus
 */
export function getItemStatusBadge(status: ItemStatus, className = '') {
  const getType = (): BadgeType => {
    switch(status) {
      case 'created':
        return 'default'
      case 'pending':
        return 'warning'
      case 'minted':
        return 'success'
      case 'listed':
        return 'info'
      default:
        return 'default'
    }
  }

  const getText = (): string => {
    switch(status) {
      case 'created':
        return 'Créé'
      case 'pending':
        return 'En attente'
      case 'minted':
        return 'Minté'
      case 'listed':
        return 'Listé'
      default:
        return status
    }
  }

  return <StatusBadge text={getText()} type={getType()} className={className} />
}

/**
 * Helper pour obtenir un badge correspondant à un ResourceNftStatuses
 */
export function getNftStatusBadge(status: ResourceNftStatuses | string | null | undefined, className = '') {
  if (!status) return null
  
  const getType = (): BadgeType => {
    if (status === ResourceNftStatuses.UPLOADIPFS || 
        status === ResourceNftStatuses.UPLOADCERTIFICATE || 
        status === ResourceNftStatuses.UPLOADMETADATA) {
      return 'warning'
    }
    
    if (status === ResourceNftStatuses.MINED) {
      return 'primary'
    }
    
    if (status === ResourceNftStatuses.LISTED) {
      return 'info'
    }
    
    if (status === ResourceNftStatuses.SOLD) {
      return 'success'
    }
    
    return 'default'
  }

  const getText = (): string => {
    switch(status) {
      case ResourceNftStatuses.UPLOADIPFS:
        return 'À préparer'
      case ResourceNftStatuses.UPLOADMETADATA:
        return 'Prêt à minter'
      case ResourceNftStatuses.MINED:
        return 'Minté'
      case ResourceNftStatuses.LISTED:
        return 'Listé'
      case ResourceNftStatuses.SOLD:
        return 'Vendu'
      default:
        return status as string
    }
  }

  return <StatusBadge text={getText()} type={getType()} className={className} />
}

/**
 * Helper pour obtenir un badge actif/inactif
 */
export function getActiveBadge(isActive: boolean, className = '') {
  return <StatusBadge 
    text={isActive ? 'Actif' : 'Inactif'} 
    type={isActive ? 'success' : 'error'} 
    className={className} 
  />
} 