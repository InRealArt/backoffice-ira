import { BackofficeUserRoles } from '@/lib/types/roles'

/**
 * Préfixes du bucket R2 autorisés selon le rôle (cf. lib/r2/storage.ts) :
 *  - artists/, marketplace/, temp/ : uploads des artistes et de l'admin ;
 *  - team/ : photos d'équipe, réservé à l'admin.
 */
const COMMON_PREFIXES = ['artists/', 'marketplace/', 'temp/']
const ADMIN_PREFIXES = [...COMMON_PREFIXES, 'team/']

/**
 * Valide une clé R2 reçue du client avant de signer une URL d'upload ou de supprimer un objet.
 * Refuse : non-chaîne, chemins absolus ou avec `..`, `//`, `\`, caractères de contrôle,
 * et tout préfixe non autorisé pour le rôle de l'appelant.
 */
export function isAllowedStoragePath(storagePath: unknown, role: string | null | undefined): boolean {
    if (typeof storagePath !== 'string' || storagePath.length === 0 || storagePath.length > 1024) return false
    if (storagePath.startsWith('/') || storagePath.includes('//') || storagePath.includes('\\')) return false
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(storagePath)) return false
    if (storagePath.split('/').some((segment) => segment === '..' || segment === '.')) return false

    const prefixes = role === BackofficeUserRoles.admin ? ADMIN_PREFIXES : COMMON_PREFIXES
    return prefixes.some((prefix) => storagePath.startsWith(prefix) && storagePath.length > prefix.length)
}
