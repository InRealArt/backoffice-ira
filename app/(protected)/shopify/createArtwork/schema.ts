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
    metaTitle: z.string()
        .min(1, "Le titre SEO est obligatoire")
        .max(60, "Le titre SEO ne doit pas dépasser 60 caractères"),
    metaDescription: z.string()
        .min(10, "La description SEO doit contenir au moins 10 caractères")
        .max(160, "La description SEO ne doit pas dépasser 160 caractères"),
    artistId: z.string().min(1, "L'artiste est obligatoire"),
    price: z.number().positive("Le prix doit être supérieur à 0").or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Format de prix invalide")),
    status: z.string().min(1, "Le statut est obligatoire"),
    depth: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), "La profondeur doit être un nombre valide"),
    isYearEstimated: z.boolean().optional(),
    framable: z.boolean().optional(),
    isFramed: z.boolean().optional(),
    isSigned: z.boolean().optional(),
    inventoryNumber: z.string().optional(),
    isFeatured: z.boolean().optional(),
    pricePhysicalBeforeTax: z.string()
        .optional()
        .refine(val => !val || val === '' || /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    priceNftBeforeTax: z.string()
        .optional()
        .refine(val => !val || val === '' || /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    priceNftPlusPhysicalBeforeTax: z.string()
        .optional()
        .refine(val => !val || val === '' || /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    hasPhysicalOnly: z.boolean().optional(),
    hasNftOnly: z.boolean().optional(),
    hasNftPlusPhysical: z.boolean().optional(),
    medium: z.string()
        .max(100, "Le support/medium ne doit pas dépasser 100 caractères")
        .optional(),
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
    creationYear: z.string()
        .optional()
        .refine(
            (val) => !val || (/^\d{4}$/.test(val) && parseInt(val) <= new Date().getFullYear()),
            "L'année de création doit être valide et ne pas dépasser l'année en cours"
        ),
    intellectualProperty: z.boolean(),
    intellectualPropertyEndDate: z.string()
        .optional()
        .refine(
            (val) => !val || new Date(val) > new Date(),
            "La date de fin des droits doit être dans le futur"
        ),
    edition: z.string().optional(),
    images: z.any()
        .refine(
            (val) => val instanceof FileList && val.length > 0,
            "Veuillez sélectionner au moins une image pour votre œuvre"
        ),
    certificate: z.any()
        .refine(
            (val) => val instanceof FileList && val.length > 0,
            "Le certificat d'authenticité est obligatoire"
        ),
    artworkSupport: z.string().optional()
})
    // Validation qu'au moins une option de tarification est sélectionnée
    .refine((data) => {
        return data.hasPhysicalOnly || data.hasNftOnly || data.hasNftPlusPhysical;
    }, {
        message: "Vous devez sélectionner au moins une option de tarification",
        path: ["pricingOption"]
    })
    // Validation du prix pour l'option Œuvre physique seule
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.pricePhysicalBeforeTax && data.pricePhysicalBeforeTax !== '';
        }
        return true;
    }, {
        message: "Le prix est obligatoire pour l'option Œuvre physique seule",
        path: ["pricePhysicalBeforeTax"]
    })
    // Validation du prix pour l'option NFT seul
    .refine((data) => {
        if (data.hasNftOnly) {
            return !!data.priceNftBeforeTax && data.priceNftBeforeTax !== '';
        }
        return true;
    }, {
        message: "Le prix est obligatoire pour l'option NFT seul",
        path: ["priceNftBeforeTax"]
    })
    // Validation du prix pour l'option NFT + Œuvre physique
    .refine((data) => {
        if (data.hasNftPlusPhysical) {
            return !!data.priceNftPlusPhysicalBeforeTax && data.priceNftPlusPhysicalBeforeTax !== '';
        }
        return true;
    }, {
        message: "Le prix est obligatoire pour l'option NFT + Œuvre physique",
        path: ["priceNftPlusPhysicalBeforeTax"]
    })
    // Validation des dimensions pour les options avec œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly || data.hasNftPlusPhysical) {
            return !!data.width && !!data.height && !!data.weight;
        }
        return true;
    }, {
        message: "Les dimensions (largeur, hauteur) et le poids sont obligatoires pour une œuvre physique",
        path: ["physicalDimensions"]
    });

export type ArtworkFormData = z.infer<typeof artworkSchema>