import { beforeEach, describe, expect, it, vi } from 'vitest'

// betterAuth(config) renvoie directement sa config : on teste le hook databaseHooks.user.create.before
vi.mock('better-auth', () => ({ betterAuth: (config: unknown) => config }))
vi.mock('better-auth/api', () => ({
    APIError: class APIError extends Error {
        constructor(public status: string, body?: { message?: string }) {
            super(body?.message)
        }
    },
}))
vi.mock('better-auth/adapters/prisma', () => ({ prismaAdapter: vi.fn() }))
vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('@/lib/services/brevo', () => ({ sendEmailViaBrevo: vi.fn() }))
vi.mock('@/lib/templates/reset-password-email', () => ({ getResetPasswordEmailTemplate: vi.fn() }))

const findFirst = vi.fn()
vi.mock('@/lib/prisma', () => ({ prisma: { whiteListedUser: { findFirst } } }))

type Hook = (user: { email: string; role?: string }) => Promise<{ data: { role: unknown; artistId: unknown } }>

async function getHook(): Promise<Hook> {
    const { auth } = await import('@/lib/auth')
    return (auth as any).databaseHooks.user.create.before
}

describe('sign-up : liste blanche appliquée côté serveur', () => {
    beforeEach(() => findFirst.mockReset())

    it('refuse un email absent de la liste blanche', async () => {
        findFirst.mockResolvedValue(null)
        const before = await getHook()
        await expect(before({ email: 'intrus@example.com' })).rejects.toThrow(/pas autorisé/)
    })

    it('impose le rôle et l\'artistId de la liste blanche', async () => {
        findFirst.mockResolvedValue({ role: 'artist', artistId: 42 })
        const before = await getHook()
        const result = await before({ email: 'artiste@example.com' })
        expect(result).toEqual({ data: { role: 'artist', artistId: 42 } })
    })

    it('ignore un rôle admin fourni par le client (élévation de privilèges)', async () => {
        findFirst.mockResolvedValue({ role: 'artist', artistId: null })
        const before = await getHook()
        const result = await before({ email: 'artiste@example.com', role: 'admin' })
        expect(result.data.role).toBe('artist')
    })

    it('cherche l\'email sans tenir compte de la casse, après trim', async () => {
        findFirst.mockResolvedValue({ role: null, artistId: null })
        const before = await getHook()
        await before({ email: '  Artiste@Example.com ' })
        expect(findFirst).toHaveBeenCalledWith(
            expect.objectContaining({ where: { email: { equals: 'Artiste@Example.com', mode: 'insensitive' } } }),
        )
    })

    it('renvoie role/artistId null si la liste blanche n\'en définit pas', async () => {
        findFirst.mockResolvedValue({ role: null, artistId: null })
        const before = await getHook()
        expect((await before({ email: 'x@y.z' })).data).toEqual({ role: null, artistId: null })
    })
})
