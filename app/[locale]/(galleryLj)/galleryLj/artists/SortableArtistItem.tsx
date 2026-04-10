'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { GripVertical } from 'lucide-react'
import { getImageUrl } from '@/lib/r2/url'

interface GalleryLjArtist {
  id: number
  pseudo: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
  order: number
}

interface SortableArtistItemProps {
  artist: GalleryLjArtist
  isDragging: boolean
  disabled?: boolean
}

export default function SortableArtistItem({
  artist,
  isDragging,
  disabled = false
}: SortableArtistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: artist.id,
    disabled
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1
  }

  const displayName = artist.pseudo || `${artist.firstName || ''} ${artist.lastName || ''}`.trim()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg transition-all cursor-grab hover:border-indigo-500 hover:shadow-md ${
        isDragging ? 'opacity-50 border-indigo-500 shadow-lg' : ''
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div
        className="flex items-center justify-center p-2 text-gray-400 cursor-grab hover:text-indigo-500 transition-colors flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </div>

      {artist.imageUrl && (
        <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
          <Image
            src={getImageUrl(artist.imageUrl) ?? ''}
            alt={displayName}
            fill
            className="object-cover"
            sizes="48px"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {displayName}
          </h3>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold whitespace-nowrap">
            Ordre: {artist.order}
          </span>
        </div>
        {!artist.pseudo && artist.firstName && artist.lastName && (
          <p className="text-sm text-gray-500 mt-1">
            {artist.firstName} {artist.lastName}
          </p>
        )}
      </div>
    </div>
  )
}
