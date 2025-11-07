'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'
import { ItemStatus, PhysicalItemStatus, NftItemStatus } from '@prisma/client'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  Column
} from '../../../components/PageLayout/index'

export interface ItemWithRelations {
  id: number
  name: string
  description: string
  slug: string | null
  mainImageUrl: string | null
  secondaryImagesUrl: string[]
  tags: string[]
  artist: {
    id: number
    name: string
    surname: string
    pseudo: string | null
    imageUrl: string | null
    backofficeUserId: number | null
  } | null
  physicalItem: {
    id: number
    price: number
    initialQty: number
    stockQty: number
    height: any
    width: any
    weight: any
    creationYear: number | null
    status: PhysicalItemStatus
  } | null
  nftItem: {
    id: number
    price: number
    status: NftItemStatus
    nftResource: {
      id: number
      name: string
      status: string
      tokenId: number | null
    } | null
  } | null
  medium: {
    id: number
    name: string
  } | null
  style: {
    id: number
    name: string
  } | null
  technique: {
    id: number
    name: string
  } | null
}

interface CollectionAdminClientProps {
  items: ItemWithRelations[]
}

export default function CollectionAdminClient({ items }: CollectionAdminClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  const handleItemClick = (item: ItemWithRelations) => {
    setLoadingItemId(item.id)
    router.push(`/admin-art/editArtwork/${item.id}`)
  }

  const handleCreateArtwork = () => {
    router.push('/admin-art/createArtwork')
  }
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  // Trier les items selon le champ sélectionné
  const sortedItems = [...items].sort((a, b) => {
    let valueA: any
    let valueB: any
    
    // Gestion des champs nested
    if (sortColumn === 'artistName') {
      valueA = a.artist ? `${a.artist.name} ${a.artist.surname}` : ''
      valueB = b.artist ? `${b.artist.name} ${b.artist.surname}` : ''
    } else if (sortColumn === 'mediumName') {
      valueA = a.medium?.name || ''
      valueB = b.medium?.name || ''
    } else {
      valueA = (a as any)[sortColumn] ?? ''
      valueB = (b as any)[sortColumn] ?? ''
    }
    
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
  const columns: Column<ItemWithRelations>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px',
      sortable: true
    },
    {
      key: 'name',
      header: 'Œuvre',
      render: (item) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingItemId === item.id && <LoadingSpinner size="small" message="" inline />}
          <div className="d-flex align-items-center gap-md">
            {item.mainImageUrl && (
              <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <Image
                  src={item.mainImageUrl}
                  alt={item.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <span className={loadingItemId === item.id ? 'text-muted' : ''}>
              {item.name}
            </span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      key: 'artistName',
      header: 'Artiste',
      render: (item) => (
        <div className="d-flex align-items-center gap-sm">
          {item.artist?.imageUrl && (
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
              <Image
                src={item.artist.imageUrl}
                alt={`${item.artist.name} ${item.artist.surname}`}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <span>
            {item.artist ? `${item.artist.name} ${item.artist.surname}` : 'Aucun artiste'}
            {item.artist?.pseudo && (
              <span style={{ fontSize: '0.8em', color: '#666', fontStyle: 'italic' }}>
                {` (${item.artist.pseudo})`}
              </span>
            )}
          </span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'mediumName',
      header: 'Medium',
      render: (item) => item.medium?.name || '-',
      sortable: true
    },
    {
      key: 'physical',
      header: 'Physical',
      render: (item) => (
        <span style={{ fontSize: '1.2em' }}>
          {item.physicalItem ? '✅' : '❌'}
        </span>
      ),
      width: '100px'
    },
    {
      key: 'nft',
      header: 'NFT',
      render: (item) => (
        <span style={{ fontSize: '1.2em' }}>
          {item.nftItem ? '✅' : '❌'}
        </span>
      ),
      width: '100px'
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (item) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              style={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.8em'
              }}
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span style={{ fontSize: '0.8em', color: '#666' }}>
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      ),
      width: '150px'
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Collection d'œuvres"
        subtitle="Liste de toutes les œuvres créées dans le système"
        actions={
          <ActionButton 
            label="Créer une œuvre"
            onClick={handleCreateArtwork}
            size="small"
            icon="➕"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedItems}
          columns={columns}
          keyExtractor={(item) => item.id}
          onRowClick={handleItemClick}
          isLoading={false}
          loadingRowId={loadingItemId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={
            <EmptyState 
              message="Aucune œuvre trouvée"
              action={
                <ActionButton
                  label="Créer la première œuvre"
                  onClick={handleCreateArtwork}
                  variant="primary"
                  icon="➕"
                />
              }
            />
          }
        />
      </PageContent>
    </PageContainer>
  )
} 