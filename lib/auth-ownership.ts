import { prisma } from '@/lib/prisma'
import {
    requireArtistAccess,
    requireAuthUserAccess,
    UnauthorizedError,
} from '@/lib/auth-helpers'

/**
 * Contrôles de propriété par entité : chaque helper charge le propriétaire de l'enregistrement
 * en base puis délègue à requireArtistAccess / requireAuthUserAccess (admin = accès total).
 *
 * Une entité introuvable est refusée (UnauthorizedError) : on ne révèle pas son existence
 * et l'action n'a de toute façon rien à modifier. Même règle d'usage que les autres gardes :
 * en première instruction de l'action, avant tout try/catch.
 */

/** Œuvre en prévente : propriétaire = artistId. */
export async function requirePresaleArtworkAccess(id: number) {
    const artwork = await prisma.presaleArtwork.findUnique({
        where: { id },
        select: { artistId: true },
    })
    if (!artwork) throw new UnauthorizedError()
    return requireArtistAccess(artwork.artistId)
}

/** Item (œuvre physique/NFT) : propriétaire = idUser (compte) ou, à défaut, artistId. */
export async function requireItemAccess(id: number) {
    const item = await prisma.item.findUnique({
        where: { id },
        select: { idUser: true, artistId: true },
    })
    if (!item) throw new UnauthorizedError()
    try {
        return await requireAuthUserAccess(item.idUser)
    } catch (error) {
        if (!(error instanceof UnauthorizedError) || item.artistId == null) throw error
        return requireArtistAccess(item.artistId)
    }
}

/** PhysicalItem : propriétaire = celui de l'Item associé. */
export async function requirePhysicalItemAccess(physicalItemId: number | bigint) {
    const physicalItem = await prisma.physicalItem.findUnique({
        where: { id: physicalItemId },
        select: { itemId: true },
    })
    if (!physicalItem) throw new UnauthorizedError()
    return requireItemAccess(physicalItem.itemId)
}

/** Collection physique : propriétaire = artistId du LandingArtist. */
export async function requirePhysicalCollectionAccess(id: number) {
    const collection = await prisma.physicalCollection.findUnique({
        where: { id },
        select: { landingArtist: { select: { artistId: true } } },
    })
    if (!collection) throw new UnauthorizedError()
    return requireArtistAccess(collection.landingArtist.artistId)
}

/** Adresse d'artiste : propriétaire = backofficeAuthUserId. */
export async function requireArtistAddressAccess(id: number) {
    const address = await prisma.artistAddress.findUnique({
        where: { id },
        select: { backofficeAuthUserId: true },
    })
    if (!address) throw new UnauthorizedError()
    return requireAuthUserAccess(address.backofficeAuthUserId)
}
