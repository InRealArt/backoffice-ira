'use client'

import { ResourceNftStatuses } from '@prisma/client'
import styles from './NftStatusBadge.module.scss'

interface NftStatusBadgeProps {
  status: ResourceNftStatuses | string | null | undefined
  className?: string
}

export default function NftStatusBadge({ status, className = '' }: NftStatusBadgeProps) {
  if (!status) return null
  
  // Déterminer le texte à afficher selon le statut
  const getDisplayText = (status: string) => {
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
        return status
    }
  }
  
  // Déterminer la classe CSS à utiliser selon le statut
  const getBadgeClass = (status: ResourceNftStatuses) => {
    if (status === ResourceNftStatuses.UPLOADIPFS || status === ResourceNftStatuses.UPLOADCERTIFICATE || status === ResourceNftStatuses.UPLOADMETADATA) {
      return styles.uploadBadge
    }
    
    if (status === ResourceNftStatuses.MINED) {
      return styles.minedBadge
    }
    
    if (status === ResourceNftStatuses.LISTED || status === ResourceNftStatuses.SOLD) {
      return styles.mintedBadge
    }
    
    return styles.defaultBadge
  }
  return (
    <span className={`${styles.statusBadge} ${getBadgeClass(status as ResourceNftStatuses)} ${className}`}>
      {getDisplayText(status)}
    </span>
  )
}