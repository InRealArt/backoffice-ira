import { describe, expect, it } from 'vitest'
import { resolveAuthUrls } from '@/lib/auth-urls'

describe('resolveAuthUrls', () => {
  it("production : BETTER_AUTH_URL puis domaine officiel, aucune origine de preview", () => {
    expect(resolveAuthUrls({ VERCEL_ENV: 'production', BETTER_AUTH_URL: 'https://prod.example.com', VERCEL_URL: 'x.vercel.app' }))
      .toEqual({ baseURL: 'https://prod.example.com', previewOrigins: [] })
    expect(resolveAuthUrls({ VERCEL_ENV: 'production' }).baseURL).toBe('https://backoffice-inrealart.vercel.app')
  })

  it("local : aucune origine de preview, BETTER_AUTH_URL conservée", () => {
    expect(resolveAuthUrls({ BETTER_AUTH_URL: 'http://localhost:3000', VERCEL_URL: 'x.vercel.app', VERCEL_BRANCH_URL: 'y.vercel.app' }))
      .toEqual({ baseURL: 'http://localhost:3000', previewOrigins: [] })
    expect(resolveAuthUrls({}).baseURL).toBeUndefined()
  })

  it("preview : URL de branche, ignore BETTER_AUTH_URL, autorise les deux hôtes", () => {
    expect(resolveAuthUrls({ VERCEL_ENV: 'preview', BETTER_AUTH_URL: 'https://prod.example.com', VERCEL_URL: 'app-abc123.vercel.app', VERCEL_BRANCH_URL: 'app-git-feat-team.vercel.app' }))
      .toEqual({
        baseURL: 'https://app-git-feat-team.vercel.app',
        previewOrigins: ['https://app-abc123.vercel.app', 'https://app-git-feat-team.vercel.app']
      })
  })

  it("preview sans URL de branche : retombe sur l'URL du déploiement, jamais sur la production", () => {
    const result = resolveAuthUrls({ VERCEL_ENV: 'preview', BETTER_AUTH_URL: 'https://prod.example.com', VERCEL_URL: 'app-abc123.vercel.app' })
    expect(result.baseURL).toBe('https://app-abc123.vercel.app')
    expect(result.previewOrigins).toEqual(['https://app-abc123.vercel.app'])
  })

  it("n'autorise jamais de joker", () => {
    const { previewOrigins } = resolveAuthUrls({ VERCEL_ENV: 'preview', VERCEL_URL: 'a.vercel.app' })
    expect(previewOrigins.some((origin) => origin.includes('*'))).toBe(false)
  })
})
