import { z } from 'zod'
import { roleSchema } from '@/lib/types/roles'

export const memberSchema = z.object({
    email: z.string().email('Format d\'email invalide'),
    role: roleSchema,
    artistId: z.number().nullable().optional()
})

export type MemberFormData = z.infer<typeof memberSchema>
