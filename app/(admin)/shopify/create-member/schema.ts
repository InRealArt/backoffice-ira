import { z } from 'zod'

export const memberSchema = z.object({
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Format d\'email invalide'),
    role: z.enum(['artist', 'galleryManager', 'admin']),
    artistId: z.number().nullable().optional()
}).refine((data) => {
    if (data.role === 'artist') {
        return data.artistId !== null && data.artistId !== undefined
    }
    return true
}, {
    message: 'Veuillez sélectionner un artiste',
    path: ['artistId']
})

export type MemberFormData = z.infer<typeof memberSchema> 