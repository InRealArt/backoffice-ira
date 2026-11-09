import { describe, expect, it, vi } from 'vitest'

// Le schéma d'œuvre référence FileList (objet du navigateur) : on le simule dans l'environnement Node
vi.stubGlobal('FileList', class FileList {})

const { physicalArtworkSchema } = await import('@/app/components/art/schema')
const { memberSchema } = await import('@/app/(admin)/boAdmin/create-member/schema')
const { roleSchema, BackofficeUserRoles } = await import('@/lib/types/roles')

/**
 * Comportement des schémas zod après la migration vers zod 4 : ces tests verrouillent les points
 * où zod 4 diffère de zod 3 (.default() ne valide plus la valeur par défaut → .prefault(), messages).
 */
describe('physicalArtworkSchema (zod 4)', () => {
    const base = {
        name: 'Œuvre test', description: 'Une description suffisante', pricePhysicalBeforeTax: '1000', initialQty: '1',
        hasPhysicalOnly: true, mediumId: '1', styleIds: [1], techniqueIds: [1], themeIds: [1],
        width: '80', height: '100', weight: '5', intellectualProperty: false, mainImageUrl: 'artists/x/y.webp',
        supportId: '1', shippingAddressId: '2', physicalCollectionId: '3',
    }
    const messages = (input: unknown) => {
        const r = physicalArtworkSchema.safeParse(input)
        return r.success ? [] : r.error.issues.map((i) => i.message)
    }

    it('accepte un formulaire complet et applique le statut commercial par défaut', () => {
        const r = physicalArtworkSchema.safeParse(base)
        expect(r.success).toBe(true)
        if (r.success) expect(r.data.commercialStatus).toBe('AVAILABLE')
    })

    it('exige au moins un style, une technique et un thème, y compris quand le champ est absent', () => {
        expect(messages({ ...base, styleIds: [] })).toContain('Au moins un style est requis')
        expect(messages({ ...base, techniqueIds: [] })).toContain('Au moins une technique est requise')
        expect(messages({ ...base, themeIds: [] })).toContain('Au moins un thème est requis')
        const { styleIds, techniqueIds, themeIds, ...sans } = base
        void styleIds; void techniqueIds; void themeIds
        const msgs = messages(sans)
        expect(msgs).toContain('Au moins un style est requis')
        expect(msgs).toContain('Au moins une technique est requise')
        expect(msgs).toContain('Au moins un thème est requis')
    })

    it('conserve les messages de validation en français', () => {
        expect(messages({ ...base, name: '' })).toContain("Le nom de l'œuvre est obligatoire")
        expect(messages({ ...base, description: 'court' })).toContain('La description doit contenir au moins 10 caractères')
        expect(messages({ ...base, pricePhysicalBeforeTax: '12,5' })).toContain('Le prix doit être un nombre entier')
    })

    it('refuse un statut commercial invalide', () => {
        expect(physicalArtworkSchema.safeParse({ ...base, commercialStatus: 'AUTRE' }).success).toBe(false)
    })
})

describe('memberSchema et roleSchema (zod 4)', () => {
    it('accepte un membre valide, avec ou sans artistId', () => {
        expect(memberSchema.safeParse({ email: 'a@b.fr', role: BackofficeUserRoles.artist }).success).toBe(true)
        expect(memberSchema.safeParse({ email: 'a@b.fr', role: BackofficeUserRoles.artist, artistId: null }).success).toBe(true)
        expect(memberSchema.safeParse({ email: 'a@b.fr', role: BackofficeUserRoles.admin, artistId: 57 }).success).toBe(true)
    })

    it("refuse un email invalide avec le message d'origine et un rôle inconnu", () => {
        const r = memberSchema.safeParse({ email: 'pas-un-email', role: BackofficeUserRoles.artist })
        expect(r.success).toBe(false)
        if (!r.success) expect(r.error.issues.map((i) => i.message)).toContain("Format d'email invalide")
        expect(roleSchema.safeParse('superadmin').success).toBe(false)
        expect(roleSchema.safeParse(BackofficeUserRoles.galleryManager).success).toBe(true)
    })
})
