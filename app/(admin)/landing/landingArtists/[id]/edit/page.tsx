import { notFound } from 'next/navigation'
import { getLandingArtistById } from '@/lib/actions/landing-artist-actions'
import { getAllCountries } from '@/lib/actions/country-actions'
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
  
  const [landingArtist, countries, mediums, categories] = await Promise.all([
    getLandingArtistById(landingArtistId),
    getAllCountries(),
    getAllArtworkMediums(),
    getAllArtistCategories()
  ])
  
  if (!landingArtist) {
    notFound()
  }
  
  return <LandingArtistEditForm landingArtist={landingArtist} countries={countries} mediums={mediums.map(m => m.name)} categories={categories} />
} 