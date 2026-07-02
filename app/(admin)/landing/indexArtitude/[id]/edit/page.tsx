import { notFound } from 'next/navigation'
import { getArtitudeArtistById } from '@/lib/actions/artitude-artist-actions'
import { getAllCountries } from '@/lib/actions/country-actions'
import EditArtitudeArtistForm from './EditArtitudeArtistForm'

export const metadata = {
  title: 'Modifier une fiche Artitude | In Real Art',
  description: 'Modifier la fiche établissement Artitude d\'un artiste',
}

export default async function EditArtitudeArtistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const artitudeArtistId = parseInt(id)

  if (isNaN(artitudeArtistId)) {
    notFound()
  }

  const [artitudeArtist, countries] = await Promise.all([
    getArtitudeArtistById(artitudeArtistId),
    getAllCountries(),
  ])

  if (!artitudeArtist) {
    notFound()
  }

  return <EditArtitudeArtistForm artitudeArtist={artitudeArtist} countries={countries} />
}
