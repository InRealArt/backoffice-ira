import { z } from 'zod'

// Validation pour le prix (nombre positif avec ou sans décimales)
const priceRegex = /^\d+(\.\d{1,2})?$/

export const artworkSchema = z.object({
    title: z.string()
        .min(1, "Le titre de l'œuvre est obligatoire")
        .max(100, "Le titre ne doit pas dépasser 100 caractères"),
    description: z.string()
        .min(10, "La description doit contenir au moins 10 caractères")
        .max(2000, "La description ne doit pas dépasser 2000 caractères"),
    price: z.string()
        .min(1, "Le prix est obligatoire")
        .regex(/^\d+$/, "Le prix doit être un nombre entier"),
    artist: z.string()
        .min(1, "Le nom de l'artiste est obligatoire")
        .max(100, "Le nom de l'artiste ne doit pas dépasser 100 caractères"),
    medium: z.string()
        .min(1, "Le support/medium est obligatoire")
        .max(100, "Le support/medium ne doit pas dépasser 100 caractères"),
    width: z.string()
        .optional()
        .refine((val) => !val || !isNaN(parseFloat(val)), "La largeur doit être un nombre valide"),
    height: z.string()
        .optional()
        .refine((val) => !val || !isNaN(parseFloat(val)), "La hauteur doit être un nombre valide"),
    weight: z.string().optional(),
    year: z.string()
        .optional()
        .refine(
            (val) => !val || (/^\d{4}$/.test(val) && parseInt(val) <= new Date().getFullYear()),
            "L'année doit être valide et ne pas dépasser l'année en cours"
        ),
    creationDate: z.string().optional(),
    intellectualProperty: z.boolean(),
    intellectualPropertyEndDate: z.string()
        .optional()
        .refine(
            (val) => !val || new Date(val) > new Date(),
            "La date de fin des droits doit être dans le futur"
        ),
    edition: z.string().optional(),
    images: z.instanceof(FileList).nullable()
        .refine((files) => files && files.length > 0, "Au moins une image est requise"),
    certificate: z.instanceof(FileList).nullable()
        .refine((files) => files && files.length > 0, "Le certificat d'authenticité est obligatoire"),
    artworkSupport: z.string().optional()
})

export type ArtworkFormData = z.infer<typeof artworkSchema>