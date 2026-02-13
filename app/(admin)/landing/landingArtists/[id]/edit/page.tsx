import { notFound } from 'next/navigation'
import { getLandingArtistById } from '@/lib/actions/landing-artist-actions'
import { getAllArtistCategories } from '@/lib/actions/artist-categories-actions'
import { getAllArtistSpecialties } from '@/lib/actions/artist-specialty-actions'
import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'
import { getLandingArtistSeo, getPresaleArtworksForArtist } from '@/lib/actions/landing-artist-seo-actions'
import LandingArtistEditForm from './LandingArtistEditForm'
import ArtistSeoForm from './ArtistSeoForm'
import ArtistEditTabs from './ArtistEditTabs'

export default async function EditLandingArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const landingArtistId = parseInt(id)

  if (isNaN(landingArtistId)) {
    notFound()
  }

  const [landingArtist, mediums, categories, specialties] = await Promise.all([
    getLandingArtistById(landingArtistId),
    getAllArtworkMediums(),
    getAllArtistCategories(),
    getAllArtistSpecialties()
  ])

  if (!landingArtist) {
    notFound()
  }

  const [seo, presaleArtworks] = await Promise.all([
    getLandingArtistSeo(landingArtistId),
    getPresaleArtworksForArtist(landingArtist.artistId),
  ])

  return (
    <ArtistEditTabs
      profileForm={
        <LandingArtistEditForm
          landingArtist={landingArtist}
          mediums={mediums.map(m => m.name)}
          categories={categories}
          specialties={specialties}
        />
      }
      seoForm={
        <ArtistSeoForm
          landingArtistId={landingArtistId}
          initialSeo={seo ? {
            seoTitle: seo.seoTitle,
            stylesInfluences: seo.stylesInfluences,
            artisticApproach: seo.artisticApproach,
            artitudeUrl: seo.artitudeUrl,
            interviewUrl: seo.interviewUrl,
            keyWorks: seo.keyWorks.map(kw => ({
              presaleArtworkId: kw.presaleArtworkId,
              order: kw.order,
              presaleArtwork: {
                id: kw.presaleArtwork.id,
                name: kw.presaleArtwork.name,
                imageUrl: kw.presaleArtwork.imageUrl,
                price: kw.presaleArtwork.price,
                width: kw.presaleArtwork.width,
                height: kw.presaleArtwork.height,
              }
            }))
          } : null}
          presaleArtworks={presaleArtworks}
        />
      }
    />
  )
}
