'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import { SortableList, type SortableItem } from '@/app/components/SortableList'
import SortableArtistItem from './SortableArtistItem'
import { updateGalleryLjArtistsOrder } from '@/lib/actions/gallery-lj-artist-actions'
import { Save, X } from 'lucide-react'

interface GalleryLjArtist {
  id: number
  pseudo: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  order: number
}

interface GalleryLjDisplayOrderManagerProps {
  artists: GalleryLjArtist[]
  onSuccess?: () => void
}

export default function GalleryLjDisplayOrderManager({
  artists: initialArtists,
  onSuccess
}: GalleryLjDisplayOrderManagerProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'fr'
  const { success, error: showError } = useToast()

  const [artists, setArtists] = useState(initialArtists)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleReorder = async (reorderedItems: SortableItem[]) => {
    // Update local state immediately for visual feedback
    const updatedArtists = reorderedItems as GalleryLjArtist[]
    setArtists(updatedArtists)
    setHasChanges(true)

    // Prepare updates with new order values (1-indexed)
    const updates = updatedArtists.map((item, index) => ({
      id: item.id,
      order: index + 1
    }))

    setIsSaving(true)

    try {
      const result = await updateGalleryLjArtistsOrder(updates)
      if (result.success) {
        success('Ordre d\'affichage mis à jour avec succès')
        setHasChanges(false)
        onSuccess?.()
      } else {
        showError(result.message || 'Erreur lors de la mise à jour')
        // Rollback on error
        setArtists(initialArtists)
        setHasChanges(false)
      }
    } catch (err) {
      showError('Une erreur est survenue lors de la mise à jour')
      // Rollback on error
      setArtists(initialArtists)
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setArtists(initialArtists)
    setHasChanges(false)
  }

  return (
    <div className="space-y-4">
      {/* Header with save/cancel buttons */}
      {hasChanges && (
        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Vous avez des modifications non enregistrées
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSaving}
            >
              <X size={16} />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Sortable list */}
      <SortableList
        items={artists}
        onReorder={handleReorder}
        renderItem={(item, index, isDragging) => (
          <SortableArtistItem
            artist={item as GalleryLjArtist}
            isDragging={isDragging}
            disabled={isSaving}
          />
        )}
        disabled={isSaving}
        emptyMessage="Aucun artiste à afficher"
      />

      {/* Saving indicator */}
      {isSaving && (
        <div className="flex items-center justify-center gap-2 p-4 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Sauvegarde en cours...
        </div>
      )}
    </div>
  )
}
