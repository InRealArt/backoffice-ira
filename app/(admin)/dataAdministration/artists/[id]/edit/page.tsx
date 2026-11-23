import { notFound } from 'next/navigation'
import { getArtistById } from '@/lib/actions/artist-actions'
import ArtistEditForm from './ArtistEditForm'
export default async function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params
  const artistId = parseInt(id)
  
  if (isNaN(artistId)) {
    notFound()
  }
  
  const artist = await getArtistById(artistId)
  
  if (!artist) {
    notFound()
  }
  
  return (
    <div>
      <ArtistEditForm artist={artist} />
    </div>
  )
} 