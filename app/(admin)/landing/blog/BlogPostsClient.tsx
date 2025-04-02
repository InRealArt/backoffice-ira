'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPost } from '@prisma/client'
import Image from 'next/image'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { toast } from 'react-hot-toast'
import Modal from '@/app/components/Common/Modal'
import { deleteBlogPost } from '@/lib/actions/blog-post-actions'

function ImageThumbnail({ url }: { url: string }) {
  return (
    <div className="relative w-6 h-6">
      <Image
        src={url}
        alt="Miniature"
        width={24}
        height={24}
        className="object-cover rounded-sm"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

interface BlogPostProps extends BlogPost {
  id: number
  title: string
  text: string
  imageUrl: string
  readingTime: number
  createdAt: Date
  viewsCount: number
}

interface BlogPostsClientProps {
  blogPosts: BlogPostProps[]
}

export default function BlogPostsClient({ blogPosts }: BlogPostsClientProps) {
  const router = useRouter()
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<number | null>(null)

  const handlePostClick = (postId: number) => {
    setLoadingPostId(postId)
    router.push(`/landing/blog/${postId}/edit`)
  }

  const handleAddNewPost = () => {
    router.push(`/landing/blog/create`)
  }

  const handleDeleteClick = (e: React.MouseEvent, postId: number) => {
    e.stopPropagation()
    setPostToDelete(postId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!postToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingPostId(postToDelete)
    
    try {
      const result = await deleteBlogPost(postToDelete)
      
      if (result.success) {
        toast.success('Article de blog supprimé avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Une erreur est survenue lors de la suppression')
    } finally {
      setDeletingPostId(null)
      setPostToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setPostToDelete(null)
  }
  
  // Formater la date de création
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }
  
  // Tronquer le texte s'il est trop long
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Articles de blog</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewPost}
          >
            Ajouter un article
          </button>
        </div>
        <p className="page-subtitle">
          Gérez les articles du blog
        </p>
      </div>
      
      <div className="page-content">
        {blogPosts.length === 0 ? (
          <div className="empty-state">
            <p>Aucun article de blog trouvé</p>
            <button 
              className="btn btn-primary btn-medium mt-4"
              onClick={handleAddNewPost}
            >
              Ajouter un article
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Titre</th>
                  <th>Date de création</th>
                  <th>Temps de lecture</th>
                  <th>Vues</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogPosts.map((post) => {
                  const isLoading = loadingPostId === post.id
                  const isDeleting = deletingPostId === post.id
                  const isDisabled = loadingPostId !== null || deletingPostId !== null
                  
                  return (
                    <tr 
                      key={post.id} 
                      onClick={() => !isDisabled && handlePostClick(post.id)}
                      className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${isDisabled && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                    >
                      <td className="w-8">
                        <ImageThumbnail url={post.imageUrl} />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {post.title}
                          </span>
                        </div>
                      </td>
                      <td>
                        {formatDate(post.createdAt)}
                      </td>
                      <td>
                        {post.readingTime} min
                      </td>
                      <td>
                        {post.viewsCount}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => handleDeleteClick(e, post.id)}
                          className="btn btn-danger btn-small"
                          disabled={isDisabled}
                        >
                          {isDeleting ? (
                            <LoadingSpinner size="small" message="" inline />
                          ) : (
                            'Supprimer'
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="Confirmation de suppression"
      >
        <div className="modal-content">
          <p className="text-danger">
            Êtes-vous sûr de vouloir supprimer cet article de blog ? Cette action est irréversible.
          </p>
          
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDeleteCancel}>
              Annuler
            </button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm}>
              Confirmer la suppression
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 