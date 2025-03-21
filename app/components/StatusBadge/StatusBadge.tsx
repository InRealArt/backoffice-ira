'use client'

import React from 'react'
import { ItemStatus, ResourceNftStatuses } from '@prisma/client'

/**
 * Types de badges supportés
 */
export type BadgeType = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'

/**
 * Props du composant StatusBadge
 */
export interface StatusBadgeProps {
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
export function StatusBadge({ text, type = 'default', className = '' }: StatusBadgeProps) {
  // Utiliser les classes globales au lieu des classes du module
  const baseClass = 'status-badge'
  const typeClass = `status-${type}`
  const badgeClass = `${baseClass} ${typeClass} ${className}`

  return (
    <span className={badgeClass}>
      {text}
    </span>
  )
}

/**
 * Obtenir un badge de statut pour les items (oeuvres d'art)
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
 * Obtenir un badge de statut pour les NFTs
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
 * Obtenir un badge pour indiquer si quelque chose est actif ou non
 */
export function getActiveBadge(isActive: boolean, className = '') {
  return <StatusBadge 
    text={isActive ? 'Actif' : 'Inactif'} 
    type={isActive ? 'success' : 'error'} 
    className={className} 
  />
} 