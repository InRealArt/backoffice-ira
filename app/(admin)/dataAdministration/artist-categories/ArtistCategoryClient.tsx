'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArtistCategory } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteArtistCategory } from '@/lib/actions/artist-categories-actions'
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

interface ArtistCategoryClientProps {
  artistCategories: ArtistCategory[]
}

export default function ArtistCategoryClient({ artistCategories }: ArtistCategoryClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingArtistCategoryId, setLoadingArtistCategoryId] = useState<number | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const { success, error } = useToast()
  
  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Vérifier au chargement
    checkIfMobile()
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  const handleArtistCategoryClick = (artistCategory: ArtistCategory) => {
    setLoadingArtistCategoryId(artistCategory.id)
    router.push(`/dataAdministration/artist-categories/${artistCategory.id}/edit`)
  }

  const handleCreateArtistCategory = () => {
    router.push('/dataAdministration/artist-categories/create')
  }

  const handleDelete = async (id: number, name: string) => {
    try {
      const result = await deleteArtistCategory(id)
      if (result.success) {
        success(`Catégorie "${name}" supprimée avec succès`)
        router.push('/dataAdministration/artist-categories')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      error('Une erreur est survenue lors de la suppression')
    }
  }
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  // Trier les mediums d'œuvres selon le champ sélectionné
  const sortedArtistCategories = [...artistCategories].sort((a, b) => {
    const valueA = (a as any)[sortColumn] ?? ''
    const valueB = (b as any)[sortColumn] ?? ''
    
    if (sortDirection === 'asc') {
      return typeof valueA === 'string' 
        ? valueA.localeCompare(valueB) 
        : valueA - valueB
    } else {
      return typeof valueA === 'string' 
        ? valueB.localeCompare(valueA) 
        : valueB - valueA
    }
  })
  
  // Définition des colonnes pour le DataTable
  const columns: Column<ArtistCategory>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      render: (artistCategory) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingArtistCategoryId === artistCategory.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingArtistCategoryId === artistCategory.id ? 'text-muted' : ''}>
            {artistCategory.name}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (artistCategory) => (
        <div className="d-flex align-items-center justify-content-end gap-sm">
          <DeleteActionButton
            onDelete={() => handleDelete(artistCategory.id, artistCategory.name)}
            disabled={loadingArtistCategoryId !== null}
            itemName={`la catégorie "${artistCategory.name}"`}
            confirmMessage={`Êtes-vous sûr de vouloir supprimer la catégorie "${artistCategory.name}" ? Cette action est irréversible.`}
          />
        </div>
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Catégories d'artistes"
        subtitle="Liste des catégories d'artistes utilisées sur le site"
        actions={
          <ActionButton 
            label="Ajouter une catégorie"
            onClick={handleCreateArtistCategory}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedArtistCategories}
          columns={columns}
          keyExtractor={(artistCategory) => artistCategory.id}
          onRowClick={handleArtistCategoryClick}
          isLoading={false}
          loadingRowId={loadingArtistCategoryId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={
            <EmptyState 
              message="Aucune catégorie trouvée"
              action={
                <ActionButton
                  label="Ajouter une catégorie"
                  onClick={handleCreateArtistCategory}
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