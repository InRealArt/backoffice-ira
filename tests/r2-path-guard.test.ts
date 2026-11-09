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

    it('réserve team/ à l\'admin', () => {
        expect(isAllowedStoragePath('team/jean-12-1.webp', admin)).toBe(true)
        expect(isAllowedStoragePath('team/jean-12-1.webp', artist)).toBe(false)
        expect(isAllowedStoragePath('team/jean-12-1.webp', null)).toBe(false)
    })

    it('refuse les préfixes inconnus, y compris pour l\'admin', () => {
        for (const path of ['secrets/key.txt', 'Artists/x.webp', 'artists', 'artists/', 'x/artists/a.webp']) {
            expect(isAllowedStoragePath(path, admin)).toBe(false)
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
