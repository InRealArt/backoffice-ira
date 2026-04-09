/**
 * Single source of truth for BackofficeUserRoles.
 *
 * Importing from `browser.ts` (enums only, no PrismaClient) makes this file
 * safe to use in both Server Components and Client Components.
 *
 * When a new role is added in prisma/schema.prisma and `prisma generate` is
 * run, it automatically appears here — no application code to update.
 */
import { BackofficeUserRoles } from '@/src/generated/prisma/browser'
import { z } from 'zod'

export { BackofficeUserRoles }

/** Zod schema derived directly from the Prisma enum — never drift again. */
export const roleSchema = z.nativeEnum(BackofficeUserRoles)

export type BackofficeUserRole = z.infer<typeof roleSchema>

/**
 * Human-readable labels for each role.
 * The Record type ensures exhaustiveness: TypeScript will error if a new
 * role is added to the enum but not to this map.
 */
export const ROLE_LABELS: Record<BackofficeUserRole, string> = {
  [BackofficeUserRoles.admin]: 'Administrateur',
  [BackofficeUserRoles.artist]: 'Artiste',
  [BackofficeUserRoles.galleryManager]: 'Responsable de galerie',
  [BackofficeUserRoles.galleryLjManager]: 'Responsable galerie LJ',
}

/** Ordered list of roles for <select> rendering. */
export const ROLE_OPTIONS = Object.values(BackofficeUserRoles).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}))
