import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: getSessionMock } } }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const { requireAdmin, requireRole, UnauthorizedError } = await import('@/lib/auth-helpers')
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
