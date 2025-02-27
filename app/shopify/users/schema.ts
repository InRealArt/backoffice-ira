import { z } from 'zod'

export const userEditSchema = z.object({
    id: z.string(),
    firstName: z.string()
        .min(2, { message: 'Le prénom doit comporter au moins 2 caractères' })
        .max(50, { message: 'Le prénom ne peut pas dépasser 50 caractères' }),
    lastName: z.string()
        .min(2, { message: 'Le nom doit comporter au moins 2 caractères' })
        .max(50, { message: 'Le nom ne peut pas dépasser 50 caractères' }),
    email: z.string()
        .email({ message: 'Format d\'email invalide' }),
    role: z.string()
        .min(1, { message: 'Le rôle est requis' }),
    walletAddress: z.string().optional(),
})

export type UserEditFormData = z.infer<typeof userEditSchema> 