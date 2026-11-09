import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '@/lib/auth-helpers'
import { BackofficeUserRoles } from '@/lib/types/roles'
import { isAllowedStoragePath } from '@/lib/r2/path-guard'
import { artistFolderKey, canonicalFolderKey } from '@/lib/r2/folder-keys'

export { canonicalFolderKey, artistFolderKey }

/**
 * Cloisonnement du bucket R2 : un non-admin ne peut agir que dans le dossier de SON artiste.
 * Le dossier est comparé par clé canonique (cf. lib/r2/folder-keys.ts) au prénom + nom de
 * l'artiste de la session, lus en base, jamais fournis par le client.
 */

export type StorageOperation = 'write' | 'delete'

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SessionLike = { user: { role?: string | null; artistId?: number | null } }

/**
 * Autorise (ou non) l'accès d'un utilisateur à une clé R2.
 *
 * - admin : aucune restriction de dossier (seulement la validation de structure) ;
 * - non-admin : `temp/<uuid>/…`, ou `artists/<dossier>/…` / `marketplace/<dossier>/…` dont le
 *   dossier correspond à son artiste ;
 * - artiste sans profil (création de profil en cours) : écriture seulement dans un dossier
 *   `artists/<dossier>/` qui n'appartient à aucun artiste existant ; suppression refusée.
 *
 * @throws UnauthorizedError si l'accès est refusé
 */
export async function assertStorageAccess(
    session: SessionLike,
    storagePath: unknown,
    operation: StorageOperation
): Promise<void> {
    const role = session.user.role
    if (!isAllowedStoragePath(storagePath, role)) throw new UnauthorizedError()
    if (role === BackofficeUserRoles.admin) return

    const parts = (storagePath as string).split('/')
    const [prefix, folder] = parts
    // Un chemin doit désigner un fichier : le dernier segment ne peut pas être vide (« …/ »)
    if (!parts[parts.length - 1]) throw new UnauthorizedError()

    // Fichiers temporaires : uuid v4 non devinable, nom de fichier obligatoire
    if (prefix === 'temp') {
        if (parts.length >= 3 && UUID_SEGMENT.test(folder)) return
        throw new UnauthorizedError()
    }

    // artists/<dossier>/<fichier…> ou marketplace/<dossier>/<fichier…>
    if (parts.length < 3 || !folder.trim()) throw new UnauthorizedError()
    const folderKey = canonicalFolderKey(folder)
    if (!folderKey) throw new UnauthorizedError()

    const artistId = session.user.artistId
    if (artistId != null) {
        const artist = await prisma.artist.findUnique({
            where: { id: artistId },
            select: { name: true, surname: true },
        })
        if (artist && artistFolderKey(artist) === folderKey) return
        throw new UnauthorizedError()
    }

    // Artiste sans profil (création de profil en cours) : le client écrit alors
    // artists/<Prénom Nom>/<Prénom Nom>[_secondary|_studio].webp, un seul niveau de dossier, avec un
    // nom de fichier qui commence par le nom du dossier. On n'accepte que cette forme, en écriture,
    // dans un dossier qui n'appartient à aucun artiste existant.
    if (role === BackofficeUserRoles.artist && prefix === 'artists' && operation === 'write' && parts.length === 3) {
        const fileKey = canonicalFolderKey(parts[2].replace(/\.[^.]*$/, ''))
        if (fileKey.startsWith(folderKey)) {
            const artists = await prisma.artist.findMany({ select: { name: true, surname: true } })
            if (!artists.some((artist) => artistFolderKey(artist) === folderKey)) return
        }
    }
    throw new UnauthorizedError()
}
