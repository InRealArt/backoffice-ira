import { z } from 'zod'

export const memberSchema = z.object({
    firstName: z.string()
        .min(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
        .max(50, { message: 'Le prénom ne peut pas dépasser 50 caractères' }),
    lastName: z.string()
        .min(2, { message: 'Le nom doit contenir au moins 2 caractères' })
        .max(50, { message: 'Le nom ne peut pas dépasser 50 caractères' }),
    email: z.string()
        .email({ message: 'Veuillez saisir une adresse email valide' }),
    role: z.enum(['artist', 'galleryManager', 'admin'], {
        errorMap: () => ({ message: 'Veuillez sélectionner un type valide' })
    })
})

export type MemberFormData = z.infer<typeof memberSchema> 