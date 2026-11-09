import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { decideAccess, getAccessRequirement, splitLocale } from '@/lib/proxy-access'

describe('splitLocale', () => {
    it.each([
        ['/fr/dashboard', 'fr', '/dashboard'],
        ['/en/art/my-artworks', 'en', '/art/my-artworks'],
        ['/fr', 'fr', '/'],
        ['/dashboard', null, '/dashboard'],
        ['/', null, '/'],
        ['/fr/', 'fr', '/'],
        ['/french/page', null, '/french/page'],
        ['//fr//dashboard', 'fr', '/dashboard'],
        ['/%66r/dashboard', 'fr', '/dashboard'],
    ])('%s → locale %s, chemin %s', (input, locale, path) => {
        expect(splitLocale(input)).toEqual({ locale, path })
    })

    it('ne lève pas sur un chemin malformé', () => {
        expect(() => splitLocale('/fr/%zz')).not.toThrow()
    })
})

describe('getAccessRequirement', () => {
    it.each([
        '/', '/fr', '/en', '/sign-in', '/fr/sign-in', '/en/sign-up', '/fr/forgot-password',
        '/en/reset-password', '/fr/sign-out', '/fr/sign-in/',
    ])('%s est public', (p) => {
        expect(getAccessRequirement(p)).toBe('public')
    })

    it.each([
        '/dashboard', '/fr/dashboard', '/en/dashboard', '/profile', '/chemin-inconnu', '/fr/sign-in-evil',
    ])('%s exige une session (refus par défaut)', (p) => {
        expect(getAccessRequirement(p)).toBe('auth')
    })

    it.each([
        '/fr/art/my-artworks', '/art/create-presale-artwork', '/fr/art/editPhysicalArtwork/12',
        '/en/art/edit-artist-profile', '/art', '/fr/ART/addresses',
    ])('%s est réservé aux utilisateurs du backoffice', (p) => {
        expect(getAccessRequirement(p)).toBe('backoffice')
    })

    it.each([
        '/dataAdministration/artists', '/fr/dataAdministration/artists/57/edit', '/landing/seo-posts',
        '/landing', '/marketplace/invoices', '/boAdmin/users', '/tools/webp-converter', '/blockchain/factories',
        '/admin-art', '/presale-artworks', '/presale-artworks/new', '/en/landing/exhibitions', '//dataAdministration', '/dataAdministration/',
        '/DataAdministration/artists', '/%64ataAdministration/artists',
    ])('%s est réservé aux admins', (p) => {
        expect(getAccessRequirement(p)).toBe('admin')
    })

    it('ne confond pas une racine admin avec un chemin qui commence pareil', () => {
        expect(getAccessRequirement('/landingpage')).toBe('auth')
        expect(getAccessRequirement('/toolsbox')).toBe('auth')
        expect(getAccessRequirement('/artists')).toBe('auth')
    })

    it("un chemin malformé n'est jamais public", () => {
        expect(getAccessRequirement('/sign-in%zz')).toBe('auth')
    })
})

describe('decideAccess', () => {
    it('laisse passer les pages publiques sans session', () => {
        expect(decideAccess('/fr/sign-in', null)).toEqual({ action: 'allow' })
        expect(decideAccess('/', null)).toEqual({ action: 'allow' })
    })

    it('redirige vers la connexion sans session, dans la locale demandée', () => {
        expect(decideAccess('/fr/dashboard', null)).toEqual({ action: 'sign-in', locale: 'fr' })
        expect(decideAccess('/en/art/my-artworks', null)).toEqual({ action: 'sign-in', locale: 'en' })
        expect(decideAccess('/dashboard', null)).toEqual({ action: 'sign-in', locale: 'fr' })
        expect(decideAccess('/dataAdministration/artists', null)).toEqual({ action: 'sign-in', locale: 'fr' })
    })

    it('autorise un utilisateur connecté sur les pages non admin', () => {
        for (const role of ['admin', 'artist', 'galleryManager', null, undefined]) {
            expect(decideAccess('/fr/dashboard', { role })).toEqual({ action: 'allow' })
        }
    })

    it("refuse les sections admin à tout rôle autre qu'admin", () => {
        for (const role of ['artist', 'galleryManager', null, undefined, 'ADMIN']) {
            expect(decideAccess('/dataAdministration/artists', { role })).toEqual({ action: 'forbidden', locale: 'fr' })
            expect(decideAccess('/en/landing/faq', { role })).toEqual({ action: 'forbidden', locale: 'en' })
        }
    })

    it('réserve /art aux rôles du backoffice (pas aux comptes sans rôle)', () => {
        for (const role of ['admin', 'artist', 'galleryManager']) {
            expect(decideAccess('/fr/art/my-artworks', { role })).toEqual({ action: 'allow' })
        }
        for (const role of [null, undefined, 'visitor']) {
            expect(decideAccess('/fr/art/my-artworks', { role })).toEqual({ action: 'forbidden', locale: 'fr' })
        }
    })

    it('autorise un admin partout', () => {
        expect(decideAccess('/dataAdministration/artists', { role: 'admin' })).toEqual({ action: 'allow' })
        expect(decideAccess('/fr/landing/faq', { role: 'admin' })).toEqual({ action: 'allow' })
        expect(decideAccess('/fr/dashboard', { role: 'admin' })).toEqual({ action: 'allow' })
    })
})

describe('proxy', () => {
    const getSessionMock = vi.fn()
    const i18nMock = vi.fn()

    beforeEach(() => {
        vi.resetModules()
        getSessionMock.mockReset()
        i18nMock.mockReset().mockImplementation(() => new Response(null, { status: 200, headers: { 'x-i18n': '1' } }))
        vi.doMock('@/lib/auth', () => ({ auth: { api: { getSession: getSessionMock } } }))
        vi.doMock('next-intl/middleware', () => ({ default: () => i18nMock }))
    })

    const run = async (path: string, method = 'GET') => {
        const { proxy } = await import('../proxy')
        return proxy(new NextRequest(new URL(path, 'http://localhost:3000'), { method }))
    }
    const as = (role: string | null) =>
        getSessionMock.mockResolvedValue(role ? { user: { id: 'u1', role } } : null)

    it('redirige /fr/dashboard sans session (contournement via la locale corrigé)', async () => {
        as(null)
        const res = await run('/fr/dashboard')
        expect(res.status).toBe(307)
        expect(new URL(res.headers.get('location')!).pathname).toBe('/fr/sign-in')
        expect(i18nMock).not.toHaveBeenCalled()
    })

    it('redirige aussi les requêtes HEAD sans session', async () => {
        as(null)
        const res = await run('/fr/art/my-artworks', 'HEAD')
        expect(res.status).toBe(307)
        expect(new URL(res.headers.get('location')!).pathname).toBe('/fr/sign-in')
    })

    it('laisse la page de connexion publique, sans lire la session', async () => {
        as(null)
        const res = await run('/fr/sign-in')
        expect(res.headers.get('x-i18n')).toBe('1')
        expect(getSessionMock).not.toHaveBeenCalled()
    })

    it('renvoie un artiste connecté vers le tableau de bord depuis une section admin', async () => {
        as('artist')
        const res = await run('/dataAdministration/artists')
        expect(res.status).toBe(307)
        expect(new URL(res.headers.get('location')!).pathname).toBe('/fr/dashboard')
    })

    it('laisse passer un admin sur une section admin, sans routage i18n', async () => {
        as('admin')
        const res = await run('/dataAdministration/artists')
        expect(res.status).toBe(200)
        expect(i18nMock).not.toHaveBeenCalled()
    })

    it('ne laisse pas un segment `_next` ou `favicon.ico` contourner le contrôle', async () => {
        as(null)
        for (const path of ['/dataAdministration/artists/_next/edit', '/fr/art/editPhysicalArtwork/_next/', '/fr/dashboard/favicon.ico', '/fr/art/x/_next/y']) {
            const res = await run(path)
            expect(res.status, path).toBe(307)
            expect(new URL(res.headers.get('location')!).pathname).toBe('/fr/sign-in')
        }
    })

    it('le matcher couvre les chemins avec un point, pas les ressources statiques', async () => {
        const { config } = await import('../proxy')
        const re = new RegExp(`^${config.matcher[0]}$`)
        for (const covered of ['/fr/art/editPhysicalArtwork/1.5', '/dataAdministration/artists/a.b/edit', '/fr/dashboard', '/', '/fr/art/x.pdf/edit']) {
            expect(re.test(covered), covered).toBe(true)
        }
        for (const excluded of ['/_next/static/chunk.js', '/img/logo.svg', '/robots.txt', '/favicon.ico', '/_vercel/insights/script.js']) {
            expect(re.test(excluded), excluded).toBe(false)
        }
    })

    it('applique le routage i18n à un utilisateur connecté sur une page localisée', async () => {
        as('artist')
        const res = await run('/fr/art/my-artworks')
        expect(res.headers.get('x-i18n')).toBe('1')
    })

    it('ignore /api/*, les fichiers statiques et les POST (gardés par les actions)', async () => {
        as(null)
        for (const [path, method] of [['/api/anything', 'GET'], ['/_next/static/x.js', 'GET'], ['/fr/dashboard', 'POST']] as const) {
            const res = await run(path, method)
            expect(res.status).not.toBe(307)
        }
        expect(getSessionMock).not.toHaveBeenCalled()
    })
})
