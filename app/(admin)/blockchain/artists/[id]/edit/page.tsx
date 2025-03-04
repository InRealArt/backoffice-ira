import { notFound } from 'next/navigation'
import { getArtistById } from '@/lib/actions/artist-actions'
import ArtistEditForm from './ArtistEditForm'


export default async function EditArtistPage({ params }: { params: { id: string } }) {
  const artistId = parseInt(params.id)
  
  if (isNaN(artistId)) {
    notFound()
  }
  
  const artist = await getArtistById(artistId)
  
  if (!artist) {
    notFound()
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier l&apos;artiste</h1>
      <ArtistEditForm artist={artist} />
    </div>
  )
} 