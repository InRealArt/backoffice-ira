'use client'

import { useRouter } from 'next/navigation'
import { DeleteActionButton } from '@/app/components/PageLayout/DeleteActionButton'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteSeoPost } from '@/lib/actions/seo-post-actions'

interface DeleteSeoPostButtonProps {
  postId: number
  postTitle: string
}

export default function DeleteSeoPostButton({ postId, postTitle }: DeleteSeoPostButtonProps) {
  const router = useRouter()
  const { success, error } = useToast()

  const handleDelete = async () => {
    const result = await deleteSeoPost(postId)

    if (result.success) {
      success('Article supprimé avec succès')
      router.push('/landing/seo-posts')
    } else {
      error(result.message || 'Une erreur est survenue lors de la suppression')
    }
  }

  return (
    <DeleteActionButton
      onDelete={handleDelete}
      itemName={postTitle}
      confirmTitle="Supprimer l'article"
      confirmMessage={`Êtes-vous sûr de vouloir supprimer "${postTitle}" ? Cette action supprimera également la traduction associée et est irréversible.`}
      buttonText="Supprimer"
      buttonSize="medium"
    />
  )
}
