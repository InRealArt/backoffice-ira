import { getAllUgcArtistProfiles } from '@/lib/actions/ugc-artist-profile-actions'
import UgcArtistProfilesClient from './UgcArtistProfilesClient'

export const metadata = { title: 'Profils Artistes UGC | Administration' }

export default async function UgcArtistProfilesPage() {
    const profiles = await getAllUgcArtistProfiles()
    return <UgcArtistProfilesClient profiles={profiles} />
}
