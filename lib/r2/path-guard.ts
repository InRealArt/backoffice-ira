import { BackofficeUserRoles } from '@/lib/types/roles'

/**
 * Préfixes du bucket R2 autorisés pour un non-admin (cf. lib/r2/storage.ts) :
 * artists/, marketplace/ et temp/. L'admin n'a pas de restriction de préfixe (les dossiers
 * exhibitions/, agency-events/, ARTITUDE/, artistsUGC/, team/… sont gérés par l'admin), seulement
 * les contrôles de structure du chemin.
 */
const NON_ADMIN_PREFIXES = ['artists/', 'marketplace/', 'temp/']

/**
 * Valide une clé R2 reçue du client avant de signer une URL d'upload ou de supprimer un objet.
 * Refuse : non-chaîne, chemins absolus ou avec `..`, `//`, `\`, caractères de contrôle,
 * et, pour un non-admin, tout préfixe autre que artists/, marketplace/ et temp/.
 */
export function isAllowedStoragePath(storagePath: unknown, role: string | null | undefined): boolean {
    if (typeof storagePath !== 'string' || storagePath.length === 0 || storagePath.length > 1024) return false
    if (storagePath.startsWith('/') || storagePath.includes('//') || storagePath.includes('\\')) return false
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(storagePath)) return false
    if (storagePath.split('/').some((segment) => segment === '..' || segment === '.')) return false

    if (role === BackofficeUserRoles.admin) return true

    return NON_ADMIN_PREFIXES.some((prefix) => storagePath.startsWith(prefix) && storagePath.length > prefix.length)
}
