import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: getSessionMock } } }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const { requireAdmin, requireRole, requireBackofficeUser, requireArtistAccess, requireAuthUserAccess, UnauthorizedError } =
    await import('@/lib/auth-helpers')
const { BackofficeUserRoles } = await import('@/lib/types/roles')

const sessionWith = (role?: string | null) => ({ user: { id: 'u1', email: 'a@b.c', role } })

describe('requireRole', () => {
    beforeEach(() => getSessionMock.mockReset())

    it('refuse un appelant sans session', async () => {
        getSessionMock.mockResolvedValue(null)
        await expect(requireAdmin()).rejects.toThrow(UnauthorizedError)
        await expect(requireAdmin()).rejects.toThrow('Non authentifié')
    })

    it('refuse un utilisateur sans rôle', async () => {
        getSessionMock.mockResolvedValue(sessionWith(null))
        await expect(requireAdmin()).rejects.toThrow('Non autorisé')
    })

    it('refuse un rôle insuffisant', async () => {
        getSessionMock.mockResolvedValue(sessionWith(BackofficeUserRoles.artist))
        await expect(requireAdmin()).rejects.toThrow(UnauthorizedError)
    })

    it('accepte le bon rôle et renvoie la session', async () => {
        const session = sessionWith(BackofficeUserRoles.admin)
        getSessionMock.mockResolvedValue(session)
        await expect(requireAdmin()).resolves.toBe(session)
    })

    it('accepte l\'un des rôles listés', async () => {
        getSessionMock.mockResolvedValue(sessionWith(BackofficeUserRoles.artist))
        await expect(requireRole(BackofficeUserRoles.admin, BackofficeUserRoles.artist)).resolves.toBeTruthy()
    })

    it('n\'accorde pas l\'accès admin à un autre rôle, et un admin n\'hérite pas des autres rôles', async () => {
        getSessionMock.mockResolvedValue(sessionWith(BackofficeUserRoles.galleryManager))
        await expect(requireAdmin()).rejects.toThrow(UnauthorizedError)

        getSessionMock.mockResolvedValue(sessionWith(BackofficeUserRoles.admin))
        await expect(requireRole(BackofficeUserRoles.artist)).rejects.toThrow(UnauthorizedError)
    })
})

const artistSession = (artistId: number | null, id = 'u-artist') => ({
    user: { id, email: 'art@b.c', role: BackofficeUserRoles.artist, artistId },
})

describe('requireBackofficeUser', () => {
    beforeEach(() => getSessionMock.mockReset())

    it('refuse sans session ou sans rôle', async () => {
        getSessionMock.mockResolvedValue(null)
        await expect(requireBackofficeUser()).rejects.toThrow(UnauthorizedError)
        getSessionMock.mockResolvedValue(sessionWith(null))
        await expect(requireBackofficeUser()).rejects.toThrow(UnauthorizedError)
    })

    it('accepte admin, artiste et responsable de galerie', async () => {
        for (const role of Object.values(BackofficeUserRoles)) {
            getSessionMock.mockResolvedValue(sessionWith(role))
            await expect(requireBackofficeUser()).resolves.toBeTruthy()
        }
    })
})

describe('requireArtistAccess', () => {
    beforeEach(() => getSessionMock.mockReset())

    it('laisse passer un admin quel que soit l\'artiste', async () => {
        getSessionMock.mockResolvedValue(sessionWith(BackofficeUserRoles.admin))
        await expect(requireArtistAccess(42)).resolves.toBeTruthy()
    })

    it('laisse passer l\'artiste propriétaire', async () => {
        getSessionMock.mockResolvedValue(artistSession(7))
        await expect(requireArtistAccess(7)).resolves.toBeTruthy()
    })

    it('refuse un autre artiste (IDOR)', async () => {
        getSessionMock.mockResolvedValue(artistSession(7))
        await expect(requireArtistAccess(8)).rejects.toThrow(UnauthorizedError)
    })

    it('refuse si artistId absent côté session ou côté appel', async () => {
        getSessionMock.mockResolvedValue(artistSession(null))
        await expect(requireArtistAccess(7)).rejects.toThrow(UnauthorizedError)
        getSessionMock.mockResolvedValue(artistSession(7))
        await expect(requireArtistAccess(null)).rejects.toThrow(UnauthorizedError)
        await expect(requireArtistAccess(undefined)).rejects.toThrow(UnauthorizedError)
    })

    it('refuse un responsable de galerie même avec un artistId égal', async () => {
        getSessionMock.mockResolvedValue({
            user: { id: 'g', role: BackofficeUserRoles.galleryManager, artistId: 7 },
        })
        await expect(requireArtistAccess(7)).rejects.toThrow(UnauthorizedError)
    })

    it('refuse sans session', async () => {
        getSessionMock.mockResolvedValue(null)
        await expect(requireArtistAccess(7)).rejects.toThrow('Non authentifié')
    })
})

describe('requireAuthUserAccess', () => {
    beforeEach(() => getSessionMock.mockReset())

    it('laisse passer un admin', async () => {
        getSessionMock.mockResolvedValue(sessionWith(BackofficeUserRoles.admin))
        await expect(requireAuthUserAccess('autre')).resolves.toBeTruthy()
    })

    it('laisse passer le propriétaire, refuse les autres et les ids vides', async () => {
        getSessionMock.mockResolvedValue(artistSession(7, 'u1'))
        await expect(requireAuthUserAccess('u1')).resolves.toBeTruthy()
        await expect(requireAuthUserAccess('u2')).rejects.toThrow(UnauthorizedError)
        await expect(requireAuthUserAccess('')).rejects.toThrow(UnauthorizedError)
        await expect(requireAuthUserAccess(null)).rejects.toThrow(UnauthorizedError)
    })
})
