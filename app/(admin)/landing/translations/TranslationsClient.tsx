'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Translation } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteTranslation } from '@/lib/actions/translation-actions'
import { Filters, FilterItem } from '@/app/components/Common'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Column
} from '../../../components/PageLayout/index'

interface TranslationWithLanguage extends Translation {
  language: {
    id: number
    name: string
    code: string
  }
}

interface TranslationsClientProps {
  translations: TranslationWithLanguage[]
}

export default function TranslationsClient({ translations }: TranslationsClientProps) {
  const router = useRouter()
  const [loadingTranslationId, setLoadingTranslationId] = useState<number | null>(null)
  const [selectedEntityType, setSelectedEntityType] = useState<string>('')
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null)
  const { success, error } = useToast()

  const handleTranslationClick = (translation: TranslationWithLanguage) => {
    setLoadingTranslationId(translation.id)
    router.push(`/landing/translations/${translation.id}/edit`)
  }

  const handleAddNewTranslation = () => {
    router.push(`/landing/translations/new`)
  }

  const handleDelete = async (translationId: number) => {
    try {
      const result = await deleteTranslation(translationId)
      
      if (result.success) {
        success('Traduction supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      error('Une erreur est survenue lors de la suppression')
    }
  }
  
  // Extraire les types d'entités uniques pour les filtres
  const uniqueEntityTypes = Array.from(new Set(translations.map(t => t.entityType)))
  
  // Extraire les langues uniques pour les filtres
  const uniqueLanguages = Array.from(
    new Map(translations.map(t => [t.languageId, t.language])).values()
  )
  
  // Filtrer les traductions en fonction des filtres sélectionnés
  const filteredTranslations = translations.filter(translation => {
    const matchesEntityType = selectedEntityType ? translation.entityType === selectedEntityType : true
    const matchesLanguage = selectedLanguageId ? translation.languageId === selectedLanguageId : true
    return matchesEntityType && matchesLanguage
  })

  // Définition des colonnes pour le DataTable
  const columns: Column<TranslationWithLanguage>[] = [
    {
      key: 'entityType',
      header: 'Type d\'entité',
      render: (translation) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingTranslationId === translation.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingTranslationId === translation.id ? 'text-muted' : ''}>
            {translation.entityType}
          </span>
        </div>
      )
    },
    {
      key: 'entityId',
      header: 'ID Entité',
      width: '100px'
    },
    {
      key: 'field',
      header: 'Champ'
    },
    {
      key: 'language',
      header: 'Langue',
      render: (translation) => `${translation.language.name} (${translation.language.code})`
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (translation) => (
        <DeleteActionButton
          onDelete={() => handleDelete(translation.id)}
          disabled={loadingTranslationId !== null}
          itemName={`la traduction ${translation.entityType}#${translation.entityId}.${translation.field}`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer cette traduction ? Cette action est irréversible.`}
        />
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Traductions"
        subtitle="Gestion des traductions pour le contenu du site"
        actions={
          <ActionButton 
            label="Ajouter une traduction"
            onClick={handleAddNewTranslation}
            size="small"
          />
        }
      />
      
      <Filters>
        <FilterItem
          id="entityTypeFilter"
          label="Filtrer par type d'entité:"
          value={selectedEntityType}
          onChange={(value) => setSelectedEntityType(value)}
          options={[
            { value: '', label: 'Tous les types d\'entité' },
            ...uniqueEntityTypes.map(type => ({
              value: type,
              label: type
            }))
          ]}
        />
        <FilterItem
          id="languageFilter"
          label="Filtrer par langue:"
          value={selectedLanguageId ? selectedLanguageId.toString() : ''}
          onChange={(value) => setSelectedLanguageId(value ? parseInt(value) : null)}
          options={[
            { value: '', label: 'Toutes les langues' },
            ...uniqueLanguages.map(language => ({
              value: language.id.toString(),
              label: `${language.name} (${language.code})`
            }))
          ]}
        />
      </Filters>
      
      <PageContent>
        <DataTable
          data={filteredTranslations}
          columns={columns}
          keyExtractor={(translation) => translation.id}
          onRowClick={handleTranslationClick}
          isLoading={false}
          loadingRowId={loadingTranslationId}
          emptyState={
            <EmptyState 
              message="Aucune traduction trouvée"
              action={
                <ActionButton
                  label="Ajouter une traduction"
                  onClick={handleAddNewTranslation}
                  variant="primary"
                />
              }
            />
          }
        />
      </PageContent>
    </PageContainer>
  )
} 