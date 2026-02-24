import { notFound } from 'next/navigation'
import { getUgcArtistProfileById, getLandingArtistsForUgcSelection } from '@/lib/actions/ugc-artist-profile-actions'
import UgcArtistProfileForm from '../../_components/UgcArtistProfileForm'

export const metadata = { title: 'Modifier un profil artiste UGC | Administration' }

export default async function EditUgcArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const profileId = parseInt(id, 10)
    if (isNaN(profileId)) notFound()

    const [profile, landingArtists] = await Promise.all([
        getUgcArtistProfileById(profileId),
        getLandingArtistsForUgcSelection(),
    ])

    if (!profile) notFound()

    return <UgcArtistProfileForm profile={profile} landingArtists={landingArtists} />
}
