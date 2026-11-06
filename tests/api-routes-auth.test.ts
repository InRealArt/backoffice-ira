import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: getSessionMock } } }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const generateInventoryExcel = vi.fn()
const generateSelfAddedInventoryExcel = vi.fn()
vi.mock('@/lib/actions/inventory-actions', () => ({ generateInventoryExcel, generateSelfAddedInventoryExcel }))

const withRole = (role: string | null) => getSessionMock.mockResolvedValue(role ? { user: { id: 'u', role } } : null)

const routes = [
    {
        name: 'GET /api/inventory/export',
        load: async () => (await import('@/app/api/inventory/export/route')).GET(),
        action: generateInventoryExcel,
    },
    {
        name: 'GET /api/inventory/export-self-added',
        load: async () => (await import('@/app/api/inventory/export-self-added/route')).GET(),
        action: generateSelfAddedInventoryExcel,
    },
    {
        name: 'POST /api/tools/webp-converter',
        load: async () =>
            (await import('@/app/api/tools/webp-converter/route')).POST(
                new NextRequest('http://localhost/api/tools/webp-converter', { method: 'POST', body: new FormData() }),
            ),
        action: null,
    },
]

describe.each(routes)('$name', ({ load, action }) => {
    beforeEach(() => {
        getSessionMock.mockReset()
        generateInventoryExcel.mockReset().mockResolvedValue(Buffer.from('xlsx'))
        generateSelfAddedInventoryExcel.mockReset().mockResolvedValue(Buffer.from('xlsx'))
    })

    it('renvoie 401 sans session, sans exécuter le traitement', async () => {
        withRole(null)
        const res = await load()
        expect(res.status).toBe(401)
        if (action) expect(action).not.toHaveBeenCalled()
    })

    it('renvoie 403 pour un rôle non admin', async () => {
        withRole('artist')
        const res = await load()
        expect(res.status).toBe(403)
        if (action) expect(action).not.toHaveBeenCalled()
    })

    it('laisse passer un admin (pas de 401/403)', async () => {
        withRole('admin')
        const res = await load()
        expect([401, 403]).not.toContain(res.status)
    })
})
