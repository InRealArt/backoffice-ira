'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArtworkStyle } from '@prisma/client'
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

interface ArtworkStyleClientProps {
  artworkStyles: ArtworkStyle[]
}

export default function ArtworkStyleClient({ artworkStyles }: ArtworkStyleClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingStyleId, setLoadingStyleId] = useState<number | null>(null)
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
  
  const handleStyleClick = (style: ArtworkStyle) => {
    setLoadingStyleId(style.id)
    router.push(`/dataAdministration/artwork-styles/${style.id}/edit`)
  }

  const handleCreateStyle = () => {
    router.push('/dataAdministration/artwork-styles/create')
  }
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  // Trier les styles d'œuvres selon le champ sélectionné
  const sortedArtworkStyles = [...artworkStyles].sort((a, b) => {
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
  const columns: Column<ArtworkStyle>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      render: (style) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingStyleId === style.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingStyleId === style.id ? 'text-muted' : ''}>
            {style.name}
          </span>
        </div>
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Styles d'œuvres"
        subtitle="Liste des styles d'œuvres utilisés sur le site"
        actions={
          <ActionButton 
            label="Ajouter un style"
            onClick={handleCreateStyle}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedArtworkStyles}
          columns={columns}
          keyExtractor={(style) => style.id}
          onRowClick={handleStyleClick}
          isLoading={false}
          loadingRowId={loadingStyleId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={
            <EmptyState 
              message="Aucun style trouvé"
              action={
                <ActionButton
                  label="Ajouter un premier style"
                  onClick={handleCreateStyle}
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