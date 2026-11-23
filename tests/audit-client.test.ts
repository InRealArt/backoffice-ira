import { describe, expect, it } from 'vitest'
import { buildAuditUrl, defaultExpiresAt, generateAuditToken, hashAuditToken } from '@/lib/audit/token'
import { createAuditClientSchema } from '@/lib/audit/schemas'
import { getLinkState } from '@/lib/audit/labels'

describe('jeton d\'audit', () => {
    it('fait 43 caractères base64url et ne se répète pas', () => {
        const a = generateAuditToken()
        const b = generateAuditToken()
        expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
        expect(a).not.toBe(b)
    })

    it('est haché en SHA-256 hexadécimal, de façon déterministe', () => {
        const hash = hashAuditToken('abc')
        expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
        expect(hash).not.toContain('abc')
    })

    it('construit le lien privé', () => {
        expect(buildAuditUrl('tok')).toMatch(/\/audit\/tok$/)
    })

    it('expire 30 jours après l\'échéance par défaut', () => {
        const due = new Date('2026-12-01T00:00:00Z')
        const exp = defaultExpiresAt(due)
        expect(Math.round((exp.getTime() - due.getTime()) / 86400000)).toBe(30)
    })
})

describe('createAuditClientSchema', () => {
    const valid = { clientName: 'A', clientEmail: 'A@b.fr', paymentType: 'FULL', dueDate: '2026-12-01' }

    it('accepte une saisie valide et normalise l\'e-mail', () => {
        const r = createAuditClientSchema.safeParse(valid)
        expect(r.success).toBe(true)
        if (r.success) expect(r.data.clientEmail).toBe('a@b.fr')
    })

    it('refuse e-mail invalide, type de paiement inconnu et échéance absente', () => {
        expect(createAuditClientSchema.safeParse({ ...valid, clientEmail: 'x' }).success).toBe(false)
        expect(createAuditClientSchema.safeParse({ ...valid, paymentType: 'CASH' }).success).toBe(false)
        expect(createAuditClientSchema.safeParse({ ...valid, dueDate: undefined }).success).toBe(false)
    })
})

describe('getLinkState', () => {
    const future = new Date(Date.now() + 86400000)
    it('distingue actif, expiré et révoqué', () => {
        expect(getLinkState({ revokedAt: null, expiresAt: future })).toBe('active')
        expect(getLinkState({ revokedAt: null, expiresAt: new Date(0) })).toBe('expired')
        expect(getLinkState({ revokedAt: new Date(), expiresAt: future })).toBe('revoked')
    })
})
