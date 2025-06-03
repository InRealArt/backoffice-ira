'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArtworkTechnique } from '@prisma/client'
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

interface ArtworkTechniqueClientProps {
  artworkTechniques: ArtworkTechnique[]
}

export default function ArtworkTechniqueClient({ artworkTechniques }: ArtworkTechniqueClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingTechniqueId, setLoadingTechniqueId] = useState<number | null>(null)
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
  
  const handleTechniqueClick = (technique: ArtworkTechnique) => {
    setLoadingTechniqueId(technique.id)
    router.push(`/dataAdministration/artwork-techniques/${technique.id}/edit`)
  }

  const handleCreateTechnique = () => {
    router.push('/dataAdministration/artwork-techniques/create')
  }
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  // Trier les techniques d'œuvres selon le champ sélectionné
  const sortedArtworkTechniques = [...artworkTechniques].sort((a, b) => {
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
  const columns: Column<ArtworkTechnique>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      render: (technique) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingTechniqueId === technique.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingTechniqueId === technique.id ? 'text-muted' : ''}>
            {technique.name}
          </span>
        </div>
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Techniques d'œuvres"
        subtitle="Liste des techniques d'œuvres utilisées sur le site"
        actions={
          <ActionButton 
            label="Ajouter une technique"
            onClick={handleCreateTechnique}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedArtworkTechniques}
          columns={columns}
          keyExtractor={(technique) => technique.id}
          onRowClick={handleTechniqueClick}
          isLoading={false}
          loadingRowId={loadingTechniqueId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={
            <EmptyState 
              message="Aucune technique trouvée"
              action={
                <ActionButton
                  label="Ajouter une première technique"
                  onClick={handleCreateTechnique}
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