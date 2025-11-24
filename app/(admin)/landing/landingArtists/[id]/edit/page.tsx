import { notFound } from 'next/navigation'
import { getLandingArtistById } from '@/lib/actions/landing-artist-actions'
import { getAllArtistCategories } from '@/lib/actions/artist-categories-actions'
import LandingArtistEditForm from './LandingArtistEditForm'
import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'

export default async function EditLandingArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const landingArtistId = parseInt(id)
  
  if (isNaN(landingArtistId)) {
    notFound()
  }
  
  const [landingArtist, mediums, categories] = await Promise.all([
    getLandingArtistById(landingArtistId),
    getAllArtworkMediums(),
    getAllArtistCategories()
  ])
  
  if (!landingArtist) {
    notFound()
  }
  
  return <LandingArtistEditForm landingArtist={landingArtist} mediums={mediums.map(m => m.name)} categories={categories} />
} 