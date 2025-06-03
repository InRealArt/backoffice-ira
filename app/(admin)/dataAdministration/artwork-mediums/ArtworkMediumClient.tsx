'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArtworkMedium } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  Column
} from '../../../components/PageLayout/index'

interface ArtworkMediumClientProps {
  artworkMediums: ArtworkMedium[]
}

export default function ArtworkMediumClient({ artworkMediums }: ArtworkMediumClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingMediumId, setLoadingMediumId] = useState<number | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
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
  
  const handleMediumClick = (medium: ArtworkMedium) => {
    setLoadingMediumId(medium.id)
    router.push(`/dataAdministration/artwork-mediums/${medium.id}/edit`)
  }

  const handleCreateMedium = () => {
    router.push('/dataAdministration/artwork-mediums/create')
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
  const sortedArtworkMediums = [...artworkMediums].sort((a, b) => {
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
  const columns: Column<ArtworkMedium>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      render: (medium) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingMediumId === medium.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingMediumId === medium.id ? 'text-muted' : ''}>
            {medium.name}
          </span>
        </div>
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Mediums d'œuvres"
        subtitle="Liste des mediums d'œuvres utilisés sur le site"
        actions={
          <ActionButton 
            label="Ajouter un medium"
            onClick={handleCreateMedium}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedArtworkMediums}
          columns={columns}
          keyExtractor={(medium) => medium.id}
          onRowClick={handleMediumClick}
          isLoading={false}
          loadingRowId={loadingMediumId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={
            <EmptyState 
              message="Aucun medium trouvé"
              action={
                <ActionButton
                  label="Ajouter un premier medium"
                  onClick={handleCreateMedium}
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