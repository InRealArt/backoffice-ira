'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SeoPost, SeoCategory, PostStatus } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  Column,
  Badge
} from '../../../components/PageLayout/index'

interface SeoPostWithRelations extends SeoPost {
  category: SeoCategory
  tags: {
    tag: {
      id: number
      name: string
      slug: string
    }
  }[]
}

interface SeoPostClientProps {
  seoPosts: SeoPostWithRelations[]
}

export default function SeoPostClient({ seoPosts }: SeoPostClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('updatedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
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
  
  const handlePostClick = (post: SeoPostWithRelations) => {
    setLoadingPostId(post.id)
    router.push(`/landing/seo-posts/${post.id}/edit`)
  }

  const handleCreatePost = () => {
    router.push('/landing/seo-posts/create')
  }
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  
  // Formater la date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Trier les articles selon le champ sélectionné
  const sortedSeoPosts = [...seoPosts].sort((a, b) => {
    const valueA = (a as any)[sortColumn] ?? 0
    const valueB = (b as any)[sortColumn] ?? 0
    
    if (sortDirection === 'asc') {
      return typeof valueA === 'string' 
        ? valueA.localeCompare(valueB) 
        : typeof valueA === 'object' && valueA instanceof Date
          ? valueA.getTime() - valueB.getTime()
          : valueA - valueB
    } else {
      return typeof valueA === 'string' 
        ? valueB.localeCompare(valueA) 
        : typeof valueA === 'object' && valueA instanceof Date
          ? valueB.getTime() - valueA.getTime()
          : valueB - valueA
    }
  })
  
  // Définition des colonnes pour le DataTable
  const columns: Column<SeoPostWithRelations>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '80px'
    },
    {
      key: 'title',
      header: 'Titre',
      render: (post) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingPostId === post.id && <LoadingSpinner size="small" message="" inline />}
          <div className="d-flex align-items-center gap-md">
            {post.mainImageUrl && (
              <div style={{ width: '48px', height: '32px', overflow: 'hidden', position: 'relative', borderRadius: '4px' }}>
                <Image
                  src={post.mainImageUrl}
                  alt={post.mainImageAlt || post.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <span className={loadingPostId === post.id ? 'text-muted' : ''}>
              {post.title}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Statut',
      render: (post) => (
        <span 
          className={`status-badge ${post.status === PostStatus.PUBLISHED ? 'status-success' : 'status-warning'}`}
        >
          {post.status === PostStatus.PUBLISHED ? 'Publié' : 'Brouillon'}
        </span>
      )
    },
    {
      key: 'category',
      header: 'Catégorie',
      render: (post) => (
        <span>{post.category.name}</span>
      )
    },
    {
      key: 'updatedAt',
      header: 'Dernière mise à jour',
      sortable: true,
      render: (post) => (
        <span>{formatDate(post.updatedAt)}</span>
      )
    },
    {
      key: 'viewsCount',
      header: 'Vues',
      sortable: true
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Articles SEO"
        subtitle="Liste des articles du blog SEO affichés sur le site"
        actions={
          <ActionButton 
            label="Créer un article"
            onClick={handleCreatePost}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedSeoPosts}
          columns={columns}
          keyExtractor={(post) => post.id}
          onRowClick={handlePostClick}
          isLoading={false}
          loadingRowId={loadingPostId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={
            <EmptyState 
              message="Aucun article trouvé"
              action={
                <ActionButton
                  label="Créer un premier article"
                  onClick={handleCreatePost}
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