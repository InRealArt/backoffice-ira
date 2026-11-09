import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: getSessionMock } } }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const prismaMock = {
    seoCategory: { findMany: vi.fn() },
    seoPost: { count: vi.fn(), findMany: vi.fn() },
    authCertificatePhysicalArtwork: { findUnique: vi.fn() },
    physicalItem: { findUnique: vi.fn() },
    item: { findUnique: vi.fn() },
}
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const s3Send = vi.fn()
vi.mock('@/lib/r2/client', () => ({ r2Client: { send: s3Send }, R2_BUCKET_NAME: 'bucket' }))
vi.mock('@aws-sdk/client-s3', () => ({
    DeleteObjectCommand: class { constructor(public input: unknown) {} },
    PutObjectCommand: class { constructor(public input: unknown) {} },
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn(async () => 'https://signed.example/upload') }))

const as = (role: string | null, extra: Record<string, unknown> = {}) =>
    getSessionMock.mockResolvedValue(role ? { user: { id: 'u1', role, artistId: 7, ...extra } } : null)

const json = (url: string, method: string, body: unknown) =>
    new Request(url, { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
    getSessionMock.mockReset()
    s3Send.mockReset().mockResolvedValue({})
    prismaMock.seoCategory.findMany.mockReset().mockResolvedValue([])
    prismaMock.seoPost.count.mockReset().mockResolvedValue(0)
    prismaMock.authCertificatePhysicalArtwork.findUnique.mockReset()
    prismaMock.physicalItem.findUnique.mockReset()
    prismaMock.item.findUnique.mockReset()
})

describe.each([
    ['GET /api/blog-posts', async () => (await import('@/app/api/blog-posts/route')).GET()],
    ['GET /api/admin/landing/blog-categories', async () => (await import('@/app/api/admin/landing/blog-categories/route')).GET()],
])('%s (admin seulement)', (_name, call) => {
    it('401 sans session, 403 pour un artiste, 200 pour un admin', async () => {
        as(null)
        expect((await call()).status).toBe(401)
        as('artist')
        expect((await call()).status).toBe(403)
        as('admin')
        expect((await call()).status).toBe(200)
    })
})

describe('/api/r2/presign', () => {
    const call = async (path: unknown) =>
        (await import('@/app/api/r2/presign/route')).POST(
            json('http://localhost/api/r2/presign', 'POST', { storagePath: path, contentType: 'image/webp', fileSize: 1000 }),
        )

    it('401 sans session', async () => {
        as(null)
        expect((await call('artists/A B/x.webp')).status).toBe(401)
    })

    it('accepte un chemin légitime pour un artiste', async () => {
        as('artist')
        expect((await call('artists/A B/x.webp')).status).toBe(200)
    })

    it('403 pour team/ (artiste), traversée et préfixe inconnu', async () => {
        as('artist')
        expect((await call('team/x.webp')).status).toBe(403)
        expect((await call('artists/../team/x.webp')).status).toBe(403)
        expect((await call('secrets/x')).status).toBe(403)
        as('admin')
        expect((await call('team/x.webp')).status).toBe(200)
        expect((await call('artists/../x')).status).toBe(403)
    })
})

describe('/api/r2/delete', () => {
    const call = async (path: unknown) =>
        (await import('@/app/api/r2/delete/route')).DELETE(json('http://localhost/api/r2/delete', 'DELETE', { storagePath: path }))

    it('401 sans session, sans toucher au bucket', async () => {
        as(null)
        expect((await call('artists/A B/x.webp')).status).toBe(401)
        expect(s3Send).not.toHaveBeenCalled()
    })

    it('403 sur chemin non autorisé, sans toucher au bucket', async () => {
        as('artist')
        expect((await call('team/x.webp')).status).toBe(403)
        expect((await call('artists/../x')).status).toBe(403)
        expect(s3Send).not.toHaveBeenCalled()
    })

    it('supprime un chemin autorisé', async () => {
        as('artist')
        expect((await call('artists/A B/x.webp')).status).toBe(200)
        expect(s3Send).toHaveBeenCalledOnce()
    })
})

describe('/api/certificates/[id]', () => {
    const call = async () =>
        (await import('@/app/api/certificates/[id]/route')).GET(new Request('http://localhost/api/certificates/5'), {
            params: Promise.resolve({ id: '5' }),
        })

    beforeEach(() => {
        prismaMock.authCertificatePhysicalArtwork.findUnique.mockResolvedValue({ id: 5, physicalItemId: 9, file: Buffer.from('%PDF') })
        prismaMock.physicalItem.findUnique.mockResolvedValue({ itemId: 3 })
    })

    it('401 sans session', async () => {
        as(null)
        expect((await call()).status).toBe(401)
    })

    it('200 pour le propriétaire, 403 pour un autre artiste, 200 pour un admin', async () => {
        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'u1', artistId: 7 })
        as('artist')
        expect((await call()).status).toBe(200)

        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'autre', artistId: 99 })
        expect((await call()).status).toBe(403)

        as('admin')
        expect((await call()).status).toBe(200)
    })
})

