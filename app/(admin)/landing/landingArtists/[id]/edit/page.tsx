import { notFound } from 'next/navigation'
import { getLandingArtistById } from '@/lib/actions/landing-artist-actions'
import LandingArtistEditForm from './LandingArtistEditForm'

export default async function EditLandingArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const landingArtistId = parseInt(id)
  
  if (isNaN(landingArtistId)) {
    notFound()
  }
  
  const landingArtist = await getLandingArtistById(landingArtistId)
  
  if (!landingArtist) {
    notFound()
  }
  
  return <LandingArtistEditForm landingArtist={landingArtist} />
} 