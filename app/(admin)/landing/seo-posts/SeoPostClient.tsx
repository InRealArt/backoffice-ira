'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryStates } from 'nuqs'
import { SeoPost, SeoCategory, PostStatus, Language } from '@prisma/client'
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
import { SeoPostFilter } from './SeoPostFilter'
import { seoPostsSearchParams } from './searchParams'

interface SeoPostWithRelations extends SeoPost {
  category: SeoCategory
  language: Language
  tags: {
    tag: {
      id: number
      name: string
      slug: string
    }
  }[]
}

interface LanguageOption {
  id: number
  code: string
  name: string
}

interface CategoryOption {
  id: number
  name: string
}

interface SeoPostClientProps {
  seoPosts: SeoPostWithRelations[]
  languages: LanguageOption[]
  categories: CategoryOption[]
}

export default function SeoPostClient({ seoPosts, languages, categories }: SeoPostClientProps) {
  const [searchParams] = useQueryStates(seoPostsSearchParams, { shallow: true })
  const filteredSeoPosts = useMemo(() => {
    const title = (searchParams.title || '').trim().toLowerCase()
    const language = searchParams.language || ''
    const categoryId = searchParams.category ? parseInt(searchParams.category, 10) : 0
    if (!title && !language && !categoryId) return seoPosts
    return seoPosts.filter((post) => {
      const matchesTitle = !title || (post.title?.toLowerCase() || '').includes(title)
      const matchesLanguage = !language || post.language.code === language
      const matchesCategory = !categoryId || post.categoryId === categoryId
      return matchesTitle && matchesLanguage && matchesCategory
    })
  }, [seoPosts, searchParams.title, searchParams.language, searchParams.category])

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
  const sortedSeoPosts = useMemo(() => [...filteredSeoPosts].sort((a, b) => {
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
  }), [filteredSeoPosts, sortColumn, sortDirection])

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
      key: 'slug',
      header: 'Slug',
      render: (post) => <span className="text-muted">{post.slug}</span>
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
      key: 'pinned',
      header: 'Épinglé',
      render: (post) => (
        <span 
          className={`status-badge ${post.pinned ? 'status-info' : 'status-muted'}`}
        >
          {post.pinned ? '📌 Oui' : 'Non'}
        </span>
      )
    },
    {
      key: 'language',
      header: 'Langue',
      render: (post) => (
        <span className="language-badge">
          {post.language.code.toUpperCase()}
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
        <div className="mb-6">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Filtrer les articles
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recherchez par titre, langue ou catégorie
                </p>
              </div>
            </div>
            <SeoPostFilter languages={languages} categories={categories} />
          </div>
        </div>
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