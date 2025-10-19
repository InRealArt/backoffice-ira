'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTranslation } from '@/lib/actions/translation-actions'

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

  const baseIconClasses = 'inline-flex items-center justify-center ml-2 p-1 rounded text-[9px] font-semibold uppercase transition-colors duration-200'

  if (isLoading) {
    return (
      <span className={[
        'inline-flex items-center justify-center ml-2 p-1 rounded bg-black/5 text-black/50 animate-pulse cursor-default',
        className,
      ].filter(Boolean).join(' ')} title="Chargement...">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
      </span>
    )
  }

  if (translationId) {
    return (
      <Link
        href={`/landing/translations/${translationId}/edit`}
        className={[
          baseIconClasses,
          'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black/80',
          className,
        ].filter(Boolean).join(' ')}
        title={`Modifier la traduction ${languageCode.toUpperCase()} pour ce champ`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 8 6 6 6-6"></path>
          <path d="M4 14h2v6h12v-6h2"></path>
          <path d="M15 14v-5"></path>
        </svg>
        <span className="ml-[0.15rem]">{languageCode.toUpperCase()}</span>
      </Link>
    )
  }

  return (
    <Link
      href={`/landing/translations/new?entityType=${entityType}&entityId=${entityId}&field=${field}&languageCode=${languageCode}`}
      className={[
        baseIconClasses,
        'text-blue-600 bg-blue-600/10 hover:bg-blue-600/20 hover:text-blue-800',
        className,
      ].filter(Boolean).join(' ')}
      title={`Créer une traduction ${languageCode.toUpperCase()} pour ce champ`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
      </svg>
      <span className="ml-[0.15rem]">{languageCode.toUpperCase()}</span>
    </Link>
  )
} 