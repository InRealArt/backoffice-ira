import { describe, expect, it } from 'vitest'
import { isAllowedStoragePath } from '@/lib/r2/path-guard'
import { BackofficeUserRoles } from '@/lib/types/roles'

const { admin, artist, galleryManager } = BackofficeUserRoles

describe('isAllowedStoragePath', () => {
    it('accepte les chemins légitimes des artistes', () => {
        for (const path of [
            'artists/Gilles Bruno/profile.webp',
            'artists/Gilles Bruno/landing/test1.webp',
            'marketplace/gilles-bruno/oeuvre/main-x.webp',
            'temp/3f2c-uuid/photo.jpg',
        ]) {
            expect(isAllowedStoragePath(path, artist)).toBe(true)
            expect(isAllowedStoragePath(path, galleryManager)).toBe(true)
            expect(isAllowedStoragePath(path, admin)).toBe(true)
        }
    })

    it('laisse l\'admin écrire partout (dossiers admin) mais pas un non-admin', () => {
        for (const path of ['team/jean-12-1.webp', 'exhibitions/x/y.webp', 'agency-events/e/y.webp', 'ARTITUDE/a/b/c.webp', 'artistsUGC/u/v.webp']) {
            expect(isAllowedStoragePath(path, admin)).toBe(true)
            expect(isAllowedStoragePath(path, artist)).toBe(false)
            expect(isAllowedStoragePath(path, null)).toBe(false)
        }
    })

    it('refuse les préfixes proches ou vides pour un non-admin', () => {
        for (const path of ['secrets/key.txt', 'Artists/x.webp', 'artists', 'artists/', 'x/artists/a.webp']) {
            expect(isAllowedStoragePath(path, artist)).toBe(false)
        }
    })

    it('refuse traversée, chemins absolus et caractères suspects', () => {
        for (const path of [
            'artists/../team/x.webp',
            'artists/./a.webp',
            '/artists/a.webp',
            'artists//a.webp',
            'artists\\a.webp',
            'artists/a\u0000.webp',
            'artists/a\n.webp',
        ]) {
            expect(isAllowedStoragePath(path, admin)).toBe(false)
        }
    })

    it('refuse les valeurs non texte ou trop longues', () => {
        expect(isAllowedStoragePath(undefined, admin)).toBe(false)
        expect(isAllowedStoragePath(42, admin)).toBe(false)
        expect(isAllowedStoragePath('', admin)).toBe(false)
        expect(isAllowedStoragePath('artists/' + 'a'.repeat(1100), admin)).toBe(false)
    })
})
