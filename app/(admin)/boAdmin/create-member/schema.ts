import { z } from 'zod'

export const memberSchema = z.object({
    email: z.string().email('Format d\'email invalide'),
    role: z.enum(['artist', 'galleryManager', 'admin']),
    artistId: z.number().nullable().optional()
})

export type MemberFormData = z.infer<typeof memberSchema> 