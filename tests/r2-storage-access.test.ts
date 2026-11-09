import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = { artist: { findUnique: vi.fn(), findMany: vi.fn() } }
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const { assertStorageAccess } = await import('@/lib/r2/storage-access')
const { canonicalFolderKey, artistFolderKey, validateNewArtistName } = await import('@/lib/r2/folder-keys')
const { UnauthorizedError } = await import('@/lib/auth-helpers')

const UUID = '3f2c9a1e-5b7d-4c3a-9e21-0a1b2c3d4e5f'
const session = (role: string, artistId: number | null) => ({ user: { role, artistId } })
const artistSession = session('artist', 7)
const gilles = { name: 'Gilles', surname: 'Bruno', pseudo: 'GillesB' }
const alain = { name: 'Alain', surname: 'Pontecorvo', pseudo: null }

beforeEach(() => {
    prismaMock.artist.findUnique.mockReset().mockResolvedValue(gilles)
    prismaMock.artist.findMany.mockReset().mockResolvedValue([gilles, alain])
})

describe('canonicalFolderKey', () => {
    it('ramène toutes les variantes de dossier à la même clé', () => {
        for (const v of ['Gilles Bruno', 'Gilles  Bruno ', 'gilles-bruno', 'gillesbruno', 'gillesBruno', 'GILLES BRUNO']) {
            expect(canonicalFolderKey(v)).toBe('gillesbruno')
        }
        expect(canonicalFolderKey('Agnès Canu')).toBe('agnescanu')
        expect(canonicalFolderKey('Agnès Canu')).toBe('agnescanu') // accent décomposé (NFD)
        expect(canonicalFolderKey("Alain' Halter")).toBe('alainhalter')
        expect(canonicalFolderKey(null)).toBe('')
        // alphabets non latins et lettres non décomposables conservés
        expect(canonicalFolderKey('Søren Łukasz')).toBe('sørenłukasz')
        expect(canonicalFolderKey('Иван Smith')).not.toBe(canonicalFolderKey('Пётр Smith'))
    })

    it('la clé d\'artiste ne dépend que du prénom et du nom (pas du pseudo)', () => {
        expect(artistFolderKey({ name: 'Gilles', surname: 'Bruno' })).toBe('gillesbruno')
        expect(artistFolderKey({ name: 'Catherine ', surname: ' Sénéchal ' })).toBe('catherinesenechal')
        expect(artistFolderKey({ name: 'Horéa', surname: '' })).toBe('horea')
        expect(artistFolderKey({ name: null, surname: null })).toBe('')
    })
})

describe('assertStorageAccess — artiste avec profil', () => {
    const ok = (path: string, op: 'write' | 'delete' = 'write') => assertStorageAccess(artistSession, path, op)

    it('accepte les variantes du dossier de son artiste', async () => {
        for (const path of [
            'artists/Gilles Bruno/profile.webp',
            'artists/Gilles  Bruno /landing/x.webp',
            'artists/gilles-bruno/x.webp',
            'marketplace/gillesbruno/oeuvre/main-x.webp',
        ]) {
            await expect(ok(path)).resolves.toBeUndefined()
            await expect(ok(path, 'delete')).resolves.toBeUndefined()
        }
    })

    it('refuse le dossier d\'un autre artiste, en écriture comme en suppression', async () => {
        for (const path of ['artists/Alain Pontecorvo/profile.webp', 'marketplace/alainpontecorvo/o/x.webp', 'artists/Gilles Bruno2/x.webp']) {
            await expect(ok(path)).rejects.toThrow(UnauthorizedError)
            await expect(ok(path, 'delete')).rejects.toThrow(UnauthorizedError)
        }
    })

    it('refuse les chemins sans dossier ou sans fichier, et les dossiers vides', async () => {
        for (const path of ['artists/Gilles Bruno', 'artists/Gilles Bruno/', 'artists//x.webp', 'artists/ /x.webp', 'artists/---/x.webp']) {
            await expect(ok(path)).rejects.toThrow(UnauthorizedError)
        }
    })

    it('refuse le dossier d\'un autre artiste même si le pseudo est choisi pour y ressembler', async () => {
        for (const pseudo of ['alain-pontecorvo', 'ALAIN PONTECORVO', 'Alain Pontecorvo']) {
            prismaMock.artist.findUnique.mockResolvedValue({ ...gilles, pseudo })
            await expect(ok('artists/Alain Pontecorvo/x.webp')).rejects.toThrow(UnauthorizedError)
            await expect(ok('marketplace/alainpontecorvo/o/x.webp', 'delete')).rejects.toThrow(UnauthorizedError)
        }
    })

    it('refuse un artiste introuvable en base', async () => {
        prismaMock.artist.findUnique.mockResolvedValue(null)
        await expect(ok('artists/Gilles Bruno/x.webp')).rejects.toThrow(UnauthorizedError)
    })

    it('n\'accepte temp/ qu\'avec un uuid et un nom de fichier', async () => {
        await expect(ok(`temp/${UUID}/photo.jpg`)).resolves.toBeUndefined()
        await expect(ok(`temp/${UUID}/photo.jpg`, 'delete')).resolves.toBeUndefined()
        for (const path of ['temp/photo.jpg', 'temp/abc/photo.jpg', `temp/${UUID}`, `temp/${UUID}/`]) {
            await expect(ok(path)).rejects.toThrow(UnauthorizedError)
        }
    })

    it('refuse team/ et les préfixes admin', async () => {
        for (const path of ['team/x.webp', 'exhibitions/e/x.webp', 'artistsUGC/u/x.webp']) {
            await expect(ok(path)).rejects.toThrow(UnauthorizedError)
        }
    })
})

describe('assertStorageAccess — admin et responsable de galerie', () => {
    it('admin : aucune restriction de dossier, mais la structure reste contrôlée', async () => {
        const admin = session('admin', null)
        await expect(assertStorageAccess(admin, 'artists/Alain Pontecorvo/x.webp', 'delete')).resolves.toBeUndefined()
        await expect(assertStorageAccess(admin, 'exhibitions/e/x.webp', 'write')).resolves.toBeUndefined()
        await expect(assertStorageAccess(admin, 'artists/../x', 'write')).rejects.toThrow(UnauthorizedError)
    })

    it('responsable de galerie : même cloisonnement que l\'artiste', async () => {
        const gm = session('galleryManager', 7)
        await expect(assertStorageAccess(gm, 'artists/Gilles Bruno/x.webp', 'write')).resolves.toBeUndefined()
        await expect(assertStorageAccess(gm, 'artists/Alain Pontecorvo/x.webp', 'write')).rejects.toThrow(UnauthorizedError)
        const gmNoArtist = session('galleryManager', null)
        await expect(assertStorageAccess(gmNoArtist, 'artists/Nouveau Nom/x.webp', 'write')).rejects.toThrow(UnauthorizedError)
    })
})

describe('assertStorageAccess — artiste sans profil (création de profil)', () => {
    const noProfile = session('artist', null)
    const write = (path: string) => assertStorageAccess(noProfile, path, 'write')

    it('peut écrire les fichiers de profil dans un nouveau dossier, un seul niveau', async () => {
        for (const file of ['Nouvelle Artiste.webp', 'Nouvelle Artiste_secondary.webp', 'Nouvelle Artiste_studio.webp']) {
            await expect(write(`artists/Nouvelle Artiste/${file}`)).resolves.toBeUndefined()
        }
    })

    it('refuse un dossier d\'artiste existant, quelle que soit la variante', async () => {
        for (const folder of ['Alain Pontecorvo', 'alain-pontecorvo', 'gillesbruno', 'Gilles  Bruno ']) {
            await expect(write(`artists/${folder}/${folder}.webp`)).rejects.toThrow(UnauthorizedError)
        }
    })

    it('refuse un fichier qui ne porte pas le nom du dossier, ou un sous-dossier', async () => {
        await expect(write('artists/Nouvelle Artiste/x.webp')).rejects.toThrow(UnauthorizedError)
        await expect(write('artists/Nouvelle Artiste/profile.webp')).rejects.toThrow(UnauthorizedError)
        await expect(write('artists/Nouvelle Artiste/landing/Nouvelle Artiste.webp')).rejects.toThrow(UnauthorizedError)
    })

    it('ne peut rien supprimer ni écrire sous marketplace/', async () => {
        await expect(assertStorageAccess(noProfile, 'artists/Nouvelle Artiste/Nouvelle Artiste.webp', 'delete')).rejects.toThrow(UnauthorizedError)
        await expect(write('marketplace/nouvelleartiste/o/x.webp')).rejects.toThrow(UnauthorizedError)
    })

    it('peut utiliser temp/ avec un uuid', async () => {
        await expect(write(`temp/${UUID}/a.jpg`)).resolves.toBeUndefined()
    })
})

describe('validateNewArtistName', () => {
    const existing = [gilles, alain]

    it('accepte un nom nouveau, y compris avec accents, point et alphabets non latins', () => {
        for (const [name, surname] of [['Nouvelle', 'Artiste'], ['J. R.', 'Smith'], ['Søren', 'Łukasz'], ['Иван', 'Петров']]) {
            expect(validateNewArtistName({ name, surname }, existing)).toBeNull()
        }
    })

    it('refuse un nom vide ou sans lettres ni chiffres', () => {
        expect(validateNewArtistName({ name: '', surname: '' }, existing)).toMatch(/lettres ou des chiffres/)
        expect(validateNewArtistName({ name: '--', surname: '..' }, existing)).toMatch(/lettres ou des chiffres/)
        expect(validateNewArtistName({ name: null, surname: undefined }, existing)).toMatch(/lettres ou des chiffres/)
    })

    it('refuse les séparateurs de chemin', () => {
        expect(validateNewArtistName({ name: 'a/b', surname: 'c' }, existing)).toMatch(/caractères/)
        expect(validateNewArtistName({ name: 'a', surname: 'c\\d' }, existing)).toMatch(/caractères/)
    })

    it('refuse un nom équivalent à celui d\'un artiste existant (casse, accents, séparateurs)', () => {
        for (const [name, surname] of [['Alain', 'Pontecorvo'], ['alain', 'PONTECORVO'], ['Alain-', 'Pontécorvo'], ['Ala', 'in Pontecorvo'], ['Gilles ', ' Bruno']]) {
            expect(validateNewArtistName({ name, surname }, existing)).toMatch(/existe déjà/)
        }
        expect(validateNewArtistName({ name: 'Alain', surname: 'Pontecorvo 2' }, existing)).toBeNull()
    })
})

describe('assertStorageAccess — noms particuliers (artiste sans profil)', () => {
    const noProfile = session('artist', null)

    it('accepte un nom avec point et un dossier qui est le préfixe du nom de fichier', async () => {
        await expect(assertStorageAccess(noProfile, 'artists/J. R. Smith/J. R. Smith.webp', 'write')).resolves.toBeUndefined()
        await expect(assertStorageAccess(noProfile, 'artists/Alain/Alain Autre.webp', 'write')).resolves.toBeUndefined()
    })

    it('refuse un nom avec séparateur (plus de 3 segments)', async () => {
        await expect(assertStorageAccess(noProfile, 'artists/A/B C/A/B C.webp', 'write')).rejects.toThrow(UnauthorizedError)
    })
})
