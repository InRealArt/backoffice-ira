'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTranslation } from '@/lib/actions/translation-actions'
import styles from './TranslationIcon.module.scss'

interface TranslationIconProps {
  entityType: string
  entityId: number
  field: string
  languageCode?: string
  className?: string
}

export default function TranslationIcon({
  entityType,
  entityId,
  field,
  languageCode = 'en',
  className = ''
}: TranslationIconProps) {
  const [translationId, setTranslationId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTranslation = async () => {
      try {
        setIsLoading(true)
        const result = await getTranslation(entityType, entityId, field, languageCode)
        
        if (result.success && result.translation) {
          setTranslationId(result.translation.id)
        } else {
          setTranslationId(null)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la traduction:', error)
        setTranslationId(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (entityType && entityId && field) {
      fetchTranslation()
    } else {
      setIsLoading(false)
      setTranslationId(null)
    }
  }, [entityType, entityId, field, languageCode])

  if (isLoading) {
    return (
      <span className={`${styles.translationIcon} ${styles.translationIconLoading} ${className}`} title="Chargement...">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
      </span>
    )
  }

  // Si on a trouvé une traduction, on affiche un lien pour l'éditer
  if (translationId) {
    return (
      <Link
        href={`/landing/translations/${translationId}/edit`}
        className={`${styles.translationIcon} ${className}`}
        title={`Modifier la traduction ${languageCode.toUpperCase()} pour ce champ`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 8 6 6 6-6"></path>
          <path d="M4 14h2v6h12v-6h2"></path>
          <path d="M15 14v-5"></path>
        </svg>
        <span className={styles.translationLangCode}>{languageCode.toUpperCase()}</span>
      </Link>
    )
  }

  // Si pas de traduction existante, on affiche un lien pour en créer une nouvelle
  return (
    <Link
      href={`/landing/translations/new?entityType=${entityType}&entityId=${entityId}&field=${field}&languageCode=${languageCode}`}
      className={`${styles.translationIcon} ${styles.translationIconNew} ${className}`}
      title={`Créer une traduction ${languageCode.toUpperCase()} pour ce champ`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
      </svg>
      <span className={styles.translationLangCode}>{languageCode.toUpperCase()}</span>
    </Link>
  )
} 