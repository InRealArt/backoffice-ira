'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Language } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { deleteLanguage } from '@/lib/actions/language-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Badge,
  Column
} from '../../../components/PageLayout/index'

interface LanguagesClientProps {
  languages: Language[]
}

export default function LanguagesClient({ languages }: LanguagesClientProps) {
  const router = useRouter()
  const [loadingLanguageId, setLoadingLanguageId] = useState<number | null>(null)
  const { success, error } = useToast()

  const handleLanguageClick = (language: Language) => {
    setLoadingLanguageId(language.id)
    router.push(`/landing/languages/${language.id}/edit`)
  }

  const handleAddNewLanguage = () => {
    router.push(`/landing/languages/new`)
  }

  const handleDelete = async (languageId: number) => {
    try {
      const result = await deleteLanguage(languageId)
      
      if (result.success) {
        success('Langue supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      error('Une erreur est survenue lors de la suppression')
    }
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<Language>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (language) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingLanguageId === language.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingLanguageId === language.id ? 'text-muted' : ''}>
            {language.name}
          </span>
        </div>
      )
    },
    {
      key: 'code',
      header: 'Code',
      width: '100px'
    },
    {
      key: 'isDefault',
      header: 'Par défaut',
      width: '120px',
      render: (language) => (
        <Badge 
          variant={language.isDefault ? 'success' : 'secondary'}
          text={language.isDefault ? 'Oui' : 'Non'}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (language) => (
        <DeleteActionButton
          onDelete={() => handleDelete(language.id)}
          disabled={loadingLanguageId !== null || language.isDefault}
          itemName={`la langue "${language.name}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer la langue "${language.name}" ? Cette action est irréversible et supprimera toutes les traductions associées.`}
        />
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Langues"
        subtitle="Liste des langues disponibles pour le contenu multilingue"
        actions={
          <ActionButton 
            label="Ajouter une langue"
            onClick={handleAddNewLanguage}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={languages}
          columns={columns}
          keyExtractor={(language) => language.id}
          onRowClick={handleLanguageClick}
          isLoading={false}
          loadingRowId={loadingLanguageId}
          emptyState={
            <EmptyState 
              message="Aucune langue trouvée"
              action={
                <ActionButton
                  label="Ajouter une langue"
                  onClick={handleAddNewLanguage}
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