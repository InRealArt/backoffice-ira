import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
    getSession: vi.fn(),
    send: vi.fn(),
    getSignedUrl: vi.fn(),
    prisma: {
        auditClient: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findUniqueOrThrow: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            delete: vi.fn(),
        },
        auditFile: { findUnique: vi.fn() },
    },
}))

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: m.getSession } } }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: m.prisma }))
vi.mock('@/lib/r2/client', () => ({ r2Client: { send: m.send }, R2_BUCKET_NAME: 'bucket' }))
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: m.getSignedUrl }))

import * as actions from '@/lib/actions/audit-client-actions'

const calls: Array<[string, () => Promise<unknown>]> = [
    ['getAllAuditClients', () => actions.getAllAuditClients()],
    ['getAuditClientById', () => actions.getAuditClientById('a1')],
    [
        'createAuditClient',
        () => actions.createAuditClient({ clientName: 'A', clientEmail: 'a@b.fr', paymentType: 'FULL', dueDate: '2030-01-01' }),
    ],
    ['regenerateAuditLink', () => actions.regenerateAuditLink('a1')],
    ['revokeAuditLink', () => actions.revokeAuditLink('a1')],
    ['extendAuditExpiration', () => actions.extendAuditExpiration('a1', '2999-01-01')],
    ['reopenAudit', () => actions.reopenAudit('a1')],
    ['getAuditFileDownloadUrl', () => actions.getAuditFileDownloadUrl('f1')],
    ['deleteAuditClient', () => actions.deleteAuditClient('a1')],
]

const withRole = (role: string | null) =>
    m.getSession.mockResolvedValue(role ? { user: { id: 'u', role } } : null)

const touched = () =>
    [...Object.values(m.prisma.auditClient), ...Object.values(m.prisma.auditFile), m.send, m.getSignedUrl].some(
        (fn) => (fn as ReturnType<typeof vi.fn>).mock.calls.length > 0,
    )

beforeEach(() => {
    vi.clearAllMocks()
    for (const fn of [...Object.values(m.prisma.auditClient), ...Object.values(m.prisma.auditFile), m.send, m.getSignedUrl]) {
        ;(fn as ReturnType<typeof vi.fn>).mockReset()
    }
})

describe.each(calls)('%s : garde admin', (_name, call) => {
    it('refuse sans session, sans toucher base ni R2', async () => {
        withRole(null)
        await expect(call()).rejects.toThrow('Non authentifié')
        expect(touched()).toBe(false)
    })

    it.each(['artist', 'galleryManager'])('refuse le rôle %s, sans toucher base ni R2', async (role) => {
        withRole(role)
        await expect(call()).rejects.toThrow()
        expect(touched()).toBe(false)
    })
})

describe('préfixe R2', () => {
    beforeEach(() => withRole('admin'))

    it('refuse le téléchargement d\'une clé hors audits/', async () => {
        m.prisma.auditFile.findUnique.mockResolvedValue({ r2Key: 'artists/x/secret.pdf', filename: 'secret.pdf' })
        const res = await actions.getAuditFileDownloadUrl('f1')
        expect(res.success).toBe(false)
        expect(m.getSignedUrl).not.toHaveBeenCalled()
    })

    it('signe une clé audits/ valide', async () => {
        m.prisma.auditFile.findUnique.mockResolvedValue({ r2Key: 'audits/a1/u-cv.pdf', filename: 'cv.pdf' })
        m.getSignedUrl.mockResolvedValue('https://signed')
        expect(await actions.getAuditFileDownloadUrl('f1')).toEqual({ success: true, url: 'https://signed' })
    })

    it('interrompt la suppression si une clé sort du dossier de l\'audit, sans rien effacer', async () => {
        m.prisma.auditClient.findUnique.mockResolvedValue({ files: [{ r2Key: 'audits/AUTRE/f.pdf' }] })
        const res = await actions.deleteAuditClient('a1')
        expect(res.success).toBe(false)
        expect(m.send).not.toHaveBeenCalled()
        expect(m.prisma.auditClient.delete).not.toHaveBeenCalled()
    })

    it('supprime le dossier R2 (y compris objets orphelins) avant la ligne en base', async () => {
        m.prisma.auditClient.findUnique.mockResolvedValue({ files: [{ r2Key: 'audits/a1/u-cv.pdf' }] })
        m.send
            .mockResolvedValueOnce({ Contents: [{ Key: 'audits/a1/u-cv.pdf' }, { Key: 'audits/a1/orphelin.pdf' }], IsTruncated: false })
            .mockResolvedValueOnce({})
        const res = await actions.deleteAuditClient('a1')
        expect(res.success).toBe(true)
        const deleteInput = m.send.mock.calls[1][0].input
        expect(deleteInput.Delete.Objects).toEqual([{ Key: 'audits/a1/u-cv.pdf' }, { Key: 'audits/a1/orphelin.pdf' }])
        expect(m.prisma.auditClient.delete).toHaveBeenCalledWith({ where: { id: 'a1' } })
    })

    it('révoque le lien avant de lister et d\'effacer R2', async () => {
        m.prisma.auditClient.findUnique.mockResolvedValue({ files: [] })
        m.prisma.auditClient.update.mockResolvedValue({})
        m.send.mockResolvedValueOnce({ Contents: [] })
        await actions.deleteAuditClient('a1')
        expect(m.prisma.auditClient.update.mock.invocationCallOrder[0]).toBeLessThan(m.send.mock.invocationCallOrder[0])
        expect(m.prisma.auditClient.update.mock.calls[0][0].data.revokedAt).toBeInstanceOf(Date)
    })

    it('garde la ligne en base si R2 signale une erreur de suppression', async () => {
        m.prisma.auditClient.findUnique.mockResolvedValue({ files: [] })
        m.send
            .mockResolvedValueOnce({ Contents: [{ Key: 'audits/a1/x.pdf' }] })
            .mockResolvedValueOnce({ Errors: [{ Key: 'audits/a1/x.pdf' }] })
        const res = await actions.deleteAuditClient('a1')
        expect(res.success).toBe(false)
        expect(m.prisma.auditClient.delete).not.toHaveBeenCalled()
    })
})

describe('règles métier', () => {
    beforeEach(() => withRole('admin'))

    it('refuse une expiration dans le passé', async () => {
        const res = await actions.extendAuditExpiration('a1', '2000-01-01')
        expect(res.success).toBe(false)
        expect(m.prisma.auditClient.update).not.toHaveBeenCalled()
    })

    it('ne rouvre qu\'un audit soumis', async () => {
        m.prisma.auditClient.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() + 1e9) })
        m.prisma.auditClient.updateMany.mockResolvedValue({ count: 0 })
        const res = await actions.reopenAudit('a1')
        expect(res.success).toBe(false)
        expect(m.prisma.auditClient.updateMany.mock.calls[0][0].where).toEqual({ id: 'a1', status: 'SUBMITTED' })
    })

    it('repousse l\'expiration d\'un lien régénéré sur un audit expiré', async () => {
        m.prisma.auditClient.findUniqueOrThrow.mockResolvedValue({ expiresAt: new Date(0) })
        m.prisma.auditClient.update.mockResolvedValue({})
        const res = await actions.regenerateAuditLink('a1')
        expect(res.success).toBe(true)
        expect(m.prisma.auditClient.update.mock.calls[0][0].data.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('ne stocke que le hash du jeton, jamais le jeton en clair', async () => {
        m.prisma.auditClient.create.mockResolvedValue({ id: 'a1' })
        const res = await actions.createAuditClient({
            clientName: 'A', clientEmail: 'a@b.fr', paymentType: 'FULL', dueDate: '2030-01-01',
        })
        if (!res.success) throw new Error('création attendue')
        const token = res.link.split('/audit/')[1]
        const stored = m.prisma.auditClient.create.mock.calls[0][0].data.tokenHash
        expect(stored).toMatch(/^[0-9a-f]{64}$/)
        expect(JSON.stringify(m.prisma.auditClient.create.mock.calls[0][0])).not.toContain(token)
    })
})
