import { getLandingArtistsForUgcSelection } from '@/lib/actions/ugc-artist-profile-actions'
import UgcArtistProfileForm from '../_components/UgcArtistProfileForm'

export const metadata = { title: 'Créer un profil artiste UGC | Administration' }

export default async function CreateUgcArtistProfilePage() {
    const landingArtists = await getLandingArtistsForUgcSelection()
    return <UgcArtistProfileForm landingArtists={landingArtists} />
}
