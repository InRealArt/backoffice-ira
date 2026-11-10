import { afterEach, describe, expect, it, vi } from 'vitest'
import { getClientBaseUrl } from '@/lib/app-url'

describe('getClientBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("utilise NEXT_PUBLIC_APP_URL hors prévisualisation", () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://prod.example.com')
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production')
    expect(getClientBaseUrl()).toBe('https://prod.example.com')
  })

  it("ignore NEXT_PUBLIC_APP_URL en prévisualisation Vercel et reste sur l'origine courante", () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://prod.example.com')
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
    vi.stubGlobal('window', { location: { origin: 'https://preview.example.com' } })
    expect(getClientBaseUrl()).toBe('https://preview.example.com')
  })

  it("retombe sur l'origine courante sans variable", () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } })
    expect(getClientBaseUrl()).toBe('http://localhost:3000')
  })

  it("renvoie une chaîne vide côté serveur sans variable", () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(getClientBaseUrl()).toBe('')
  })
})
