import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()
const prismaMock = {
    presaleArtwork: { findUnique: vi.fn() },
    item: { findUnique: vi.fn() },
    physicalItem: { findUnique: vi.fn() },
    physicalCollection: { findUnique: vi.fn() },
    artistAddress: { findUnique: vi.fn() },
}

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: getSessionMock } } }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

const {
    requirePresaleArtworkAccess,
    requireItemAccess,
    requirePhysicalItemAccess,
    requirePhysicalCollectionAccess,
    requireArtistAddressAccess,
} = await import('@/lib/auth-ownership')
const { UnauthorizedError } = await import('@/lib/auth-helpers')
const { BackofficeUserRoles } = await import('@/lib/types/roles')

const artist = { user: { id: 'u1', email: 'a@b.c', role: BackofficeUserRoles.artist, artistId: 7 } }
const admin = { user: { id: 'adm', email: 'adm@b.c', role: BackofficeUserRoles.admin, artistId: null } }

beforeEach(() => {
    getSessionMock.mockReset()
    Object.values(prismaMock).forEach((m) => m.findUnique.mockReset())
})

describe('requirePresaleArtworkAccess', () => {
    it('accepte le propriétaire et l\'admin, refuse un autre artiste ou une œuvre inconnue', async () => {
        prismaMock.presaleArtwork.findUnique.mockResolvedValue({ artistId: 7 })
        getSessionMock.mockResolvedValue(artist)
        await expect(requirePresaleArtworkAccess(1)).resolves.toBeTruthy()
        getSessionMock.mockResolvedValue(admin)
        await expect(requirePresaleArtworkAccess(1)).resolves.toBeTruthy()

        prismaMock.presaleArtwork.findUnique.mockResolvedValue({ artistId: 8 })
        getSessionMock.mockResolvedValue(artist)
        await expect(requirePresaleArtworkAccess(1)).rejects.toThrow(UnauthorizedError)

        prismaMock.presaleArtwork.findUnique.mockResolvedValue(null)
        await expect(requirePresaleArtworkAccess(1)).rejects.toThrow(UnauthorizedError)
    })
})

describe('requireItemAccess', () => {
    it('accepte le compte propriétaire', async () => {
        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'u1', artistId: null })
        getSessionMock.mockResolvedValue(artist)
        await expect(requireItemAccess(1)).resolves.toBeTruthy()
    })

    it('accepte l\'artiste de l\'item même si le compte diffère', async () => {
        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'autre', artistId: 7 })
        getSessionMock.mockResolvedValue(artist)
        await expect(requireItemAccess(1)).resolves.toBeTruthy()
    })

    it('refuse un item d\'un autre compte et d\'un autre artiste', async () => {
        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'autre', artistId: 8 })
        getSessionMock.mockResolvedValue(artist)
        await expect(requireItemAccess(1)).rejects.toThrow(UnauthorizedError)
        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'autre', artistId: null })
        await expect(requireItemAccess(1)).rejects.toThrow(UnauthorizedError)
    })

    it('refuse un item inconnu et laisse passer l\'admin', async () => {
        prismaMock.item.findUnique.mockResolvedValue(null)
        getSessionMock.mockResolvedValue(artist)
        await expect(requireItemAccess(1)).rejects.toThrow(UnauthorizedError)
        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'autre', artistId: 8 })
        getSessionMock.mockResolvedValue(admin)
        await expect(requireItemAccess(1)).resolves.toBeTruthy()
    })
})

describe('requirePhysicalItemAccess', () => {
    it('suit la propriété de l\'item associé', async () => {
        prismaMock.physicalItem.findUnique.mockResolvedValue({ itemId: 5 })
        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'u1', artistId: null })
        getSessionMock.mockResolvedValue(artist)
        await expect(requirePhysicalItemAccess(BigInt(3))).resolves.toBeTruthy()

        prismaMock.item.findUnique.mockResolvedValue({ idUser: 'x', artistId: null })
        await expect(requirePhysicalItemAccess(BigInt(3))).rejects.toThrow(UnauthorizedError)

        prismaMock.physicalItem.findUnique.mockResolvedValue(null)
        await expect(requirePhysicalItemAccess(BigInt(3))).rejects.toThrow(UnauthorizedError)
    })
})

describe('requirePhysicalCollectionAccess', () => {
    it('compare l\'artistId du LandingArtist', async () => {
        getSessionMock.mockResolvedValue(artist)
        prismaMock.physicalCollection.findUnique.mockResolvedValue({ landingArtist: { artistId: 7 } })
        await expect(requirePhysicalCollectionAccess(1)).resolves.toBeTruthy()
        prismaMock.physicalCollection.findUnique.mockResolvedValue({ landingArtist: { artistId: 9 } })
        await expect(requirePhysicalCollectionAccess(1)).rejects.toThrow(UnauthorizedError)
        prismaMock.physicalCollection.findUnique.mockResolvedValue(null)
        await expect(requirePhysicalCollectionAccess(1)).rejects.toThrow(UnauthorizedError)
    })
})

describe('requireArtistAddressAccess', () => {
    it('compare le compte propriétaire de l\'adresse', async () => {
        getSessionMock.mockResolvedValue(artist)
        prismaMock.artistAddress.findUnique.mockResolvedValue({ backofficeAuthUserId: 'u1' })
        await expect(requireArtistAddressAccess(1)).resolves.toBeTruthy()
        prismaMock.artistAddress.findUnique.mockResolvedValue({ backofficeAuthUserId: 'u2' })
        await expect(requireArtistAddressAccess(1)).rejects.toThrow(UnauthorizedError)
        prismaMock.artistAddress.findUnique.mockResolvedValue(null)
        await expect(requireArtistAddressAccess(1)).rejects.toThrow(UnauthorizedError)
    })
})
