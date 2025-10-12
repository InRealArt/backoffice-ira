'use client'

import { useState } from 'react'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useStickyFooters } from './useStickyFooters'
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

interface StickyFooterProps {
  id: number
  activeOnAllPages: boolean
  activeOnSpecificPages: boolean
  specificPages: string[]
  endValidityDate?: Date | null
  title?: string | null
  text?: string | null
  textButton?: string | null
  buttonUrl?: string | null
}

interface StickyFooterClientProps {
  stickyFooters: StickyFooterProps[] | undefined
}

export default function StickyFooterClient({ stickyFooters: initialStickyFooters }: StickyFooterClientProps) {
  const {
    stickyFooters,
    loadingStickyFooterId,
    navigateToEdit,
    navigateToCreate,
    deleteStickyFooter,
    isLoading
  } = useStickyFooters({ initialStickyFooters })

  const handleStickyFooterClick = (stickyFooter: StickyFooterProps) => {
    if (!isLoading) {
      navigateToEdit(stickyFooter.id)
    }
  }

  const handleDelete = async (stickyFooterId: number) => {
    await deleteStickyFooter(stickyFooterId)
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getActivationStatus = (stickyFooter: StickyFooterProps) => {
    if (stickyFooter.activeOnAllPages) return 'Toutes les pages'
    if (stickyFooter.activeOnSpecificPages) return `${stickyFooter.specificPages.length} page(s) spécifique(s)`
    return 'Inactif'
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<StickyFooterProps>[] = [
    {
      key: 'title',
      header: 'Titre',
      render: (stickyFooter) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingStickyFooterId === stickyFooter.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingStickyFooterId === stickyFooter.id ? 'text-muted' : ''}>
            {stickyFooter.title || 'Sans titre'}
          </span>
        </div>
      )
    },
    {
      key: 'activation',
      header: 'Activation',
      render: (stickyFooter) => (
        <span className={`badge ${stickyFooter.activeOnAllPages || stickyFooter.activeOnSpecificPages ? 'badge-success' : 'badge-secondary'}`}>
          {getActivationStatus(stickyFooter)}
        </span>
      )
    },
    {
      key: 'endValidityDate',
      header: 'Date de fin',
      render: (stickyFooter) => formatDate(stickyFooter.endValidityDate)
    },
    {
      key: 'textButton',
      header: 'Bouton',
      render: (stickyFooter) => stickyFooter.textButton || '-'
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (stickyFooter) => (
        <DeleteActionButton
          onDelete={() => handleDelete(stickyFooter.id)}
          disabled={isLoading}
          itemName={`le sticky footer "${stickyFooter.title || 'Sans titre'}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer ce sticky footer ? Cette action est irréversible.`}
        />
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Paramétrage Sticky Footer"
        subtitle="Gérez les paramètres du sticky footer"
        actions={
          <ActionButton 
            label="Ajouter un sticky footer"
            onClick={navigateToCreate}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={stickyFooters || []}
          columns={columns}
          keyExtractor={(stickyFooter) => stickyFooter.id}
          onRowClick={handleStickyFooterClick}
          isLoading={false}
          loadingRowId={loadingStickyFooterId}
          emptyState={
            <EmptyState 
              message="Aucun sticky footer trouvé"
              action={
                <ActionButton
                  label="Ajouter un sticky footer"
                  onClick={navigateToCreate}
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
