import { z } from 'zod'

// Validation pour le prix (nombre positif avec ou sans décimales)
const priceRegex = /^\d+(\.\d{1,2})?$/

export const artworkSchema = z.object({
    title: z.string()
        .min(3, { message: 'Le titre doit contenir au moins 3 caractères' })
        .max(100, { message: 'Le titre ne peut pas dépasser 100 caractères' }),

    description: z.string()
        .min(10, { message: 'La description doit contenir au moins 10 caractères' })
        .max(5000, { message: 'La description ne peut pas dépasser 5000 caractères' }),

    price: z.string()
        .refine((val) => priceRegex.test(val), {
            message: 'Le prix doit être un nombre positif (ex: 1500 ou 1500.99)',
        }),

    artist: z.string()
        .min(2, { message: 'Le nom de l\'artiste doit contenir au moins 2 caractères' })
        .max(100, { message: 'Le nom de l\'artiste ne peut pas dépasser 100 caractères' }),

    medium: z.string()
        .min(2, { message: 'Le support doit contenir au moins 2 caractères' })
        .max(100, { message: 'Le support ne peut pas dépasser 100 caractères' }),

    dimensions: z.string().min(1, "Les dimensions sont requises"),

    weight: z.string().optional().refine(
        (val) => !val || !isNaN(parseFloat(val.replace(',', '.'))),
        { message: "Le poids doit être un nombre valide" }
    ),

    year: z.string()
        .regex(/^\d{4}$/, { message: 'L\'année doit être au format YYYY (ex: 2023)' })
        .optional()
        .or(z.literal('')),

    edition: z.string()
        .max(100, { message: 'L\'édition ne peut pas dépasser 100 caractères' })
        .optional()
        .or(z.literal('')),

    tags: z.string()
        .max(200, { message: 'Les tags ne peuvent pas dépasser 200 caractères' })
        .optional()
        .or(z.literal('')),

    images: z.instanceof(FileList)
        .refine((files) => files.length > 0, {
            message: 'Au moins une image est requise',
        })
        .refine((files) => files.length <= 10, {
            message: 'Vous ne pouvez pas télécharger plus de 10 images',
        })
        .refine(
            (files) => {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    if (file.size > 5 * 1024 * 1024) {
                        return false
                    }
                }
                return true
            },
            {
                message: 'Chaque image ne doit pas dépasser 5 MB',
            }
        )
})

export type ArtworkFormData = z.infer<typeof artworkSchema>