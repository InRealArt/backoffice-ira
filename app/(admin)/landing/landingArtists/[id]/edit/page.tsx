import { notFound } from 'next/navigation'
import { getLandingArtistById } from '@/lib/actions/landing-artist-actions'
import { getAllCountries } from '@/lib/actions/country-actions'
import LandingArtistEditForm from './LandingArtistEditForm'

export default async function EditLandingArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const landingArtistId = parseInt(id)
  
  if (isNaN(landingArtistId)) {
    notFound()
  }
  
  const [landingArtist, countries] = await Promise.all([
    getLandingArtistById(landingArtistId),
    getAllCountries()
  ])
  
  if (!landingArtist) {
    notFound()
  }
  
  return <LandingArtistEditForm landingArtist={landingArtist} countries={countries} />
} 