import { getAllGalleryLjArtists } from '@/lib/actions/gallery-lj-artist-actions'
import GalleryLjDisplayOrderManager from '../GalleryLjDisplayOrderManager'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Ordre d\'affichage des artistes Galerie LJ | Administration',
  description: 'Gérez l\'ordre d\'affichage des artistes dans la galerie LJ',
}

export default async function GalleryLjArtistsDisplayOrderPage() {
  const allArtists = await getAllGalleryLjArtists()

  // Sort by order field
  const sortedArtists = [...allArtists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/fr/galleryLj/artists"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="page-title">Ordre d'affichage des artistes</h1>
        </div>
        <p className="page-subtitle">
          Glissez-déposez les artistes pour modifier leur ordre d&apos;affichage
        </p>
      </div>

      <div className="page-content">
        <GalleryLjDisplayOrderManager artists={sortedArtists} />
      </div>
    </div>
  )
}
