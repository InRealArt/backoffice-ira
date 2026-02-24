'use client'

import { ResourceNftStatuses } from '@/src/generated/prisma/browser'
import { getNftStatusBadge } from '@/app/components/StatusBadge'

interface NftStatusBadgeProps {
  status: ResourceNftStatuses | string | null | undefined
  className?: string
}

export default function NftStatusBadge({ status, className = '' }: NftStatusBadgeProps) {
  // Réutiliser la fonction helper déjà disponible
  return getNftStatusBadge(status, className)
}