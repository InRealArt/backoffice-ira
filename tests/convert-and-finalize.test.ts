import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: getSessionMock } } }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const s3Send = vi.fn()
vi.mock('@/lib/r2/client', () => ({ r2Client: { send: s3Send }, R2_BUCKET_NAME: 'bucket' }))
vi.mock('@aws-sdk/client-s3', () => ({
    GetObjectCommand: class { constructor(public input: unknown) {} },
    PutObjectCommand: class { constructor(public input: unknown) {} },
    DeleteObjectCommand: class { constructor(public input: unknown) {} },
}))
vi.mock('sharp', () => ({ default: vi.fn() }))

const { convertAndFinalize } = await import('@/lib/r2/actions/convert-and-finalize')
const { UnauthorizedError } = await import('@/lib/auth-helpers')

const as = (role: string | null) => getSessionMock.mockResolvedValue(role ? { user: { id: 'u', role, artistId: 7 } } : null)

describe('convertAndFinalize', () => {
    beforeEach(() => {
        getSessionMock.mockReset()
        s3Send.mockReset().mockRejectedValue(new Error('stop: le bucket ne doit pas être appelé'))
    })

    it('refuse sans session, sans toucher au bucket', async () => {
        as(null)
        await expect(convertAndFinalize('temp/u/a.jpg', 'artists/A B/landing/x.webp')).rejects.toThrow(UnauthorizedError)
        expect(s3Send).not.toHaveBeenCalled()
    })

    it('refuse une tempKey hors temp/ (lecture/suppression arbitraire)', async () => {
        for (const role of ['artist', 'admin']) {
            as(role)
            await expect(convertAndFinalize('artists/Autre Artiste/profile.webp', 'artists/A B/x.webp')).rejects.toThrow('tempKey non autorisée')
            await expect(convertAndFinalize('temp/../artists/x.webp', 'artists/A B/x.webp')).rejects.toThrow('tempKey non autorisée')
        }
        expect(s3Send).not.toHaveBeenCalled()
    })

    it('refuse une finalKey hors préfixes autorisés pour un artiste, mais pas pour un admin', async () => {
        as('artist')
        await expect(convertAndFinalize('temp/u/a.jpg', 'team/x.webp')).rejects.toThrow('finalKey non autorisée')
        await expect(convertAndFinalize('temp/u/a.jpg', 'artists/../team/x.webp')).rejects.toThrow('finalKey non autorisée')
        expect(s3Send).not.toHaveBeenCalled()

        as('admin')
        // l'admin passe les contrôles : l'échec attendu vient du bucket mocké
        await expect(convertAndFinalize('temp/u/a.jpg', 'exhibitions/e/x.webp')).rejects.toThrow('stop')
        expect(s3Send).toHaveBeenCalled()
    })
})
