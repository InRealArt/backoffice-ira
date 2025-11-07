import { z } from 'zod'

// Validation pour le prix (nombre positif avec ou sans décimales)
const priceRegex = /^\d+(\.\d{1,2})?$/

// Schéma principal pour la création d'œuvres d'art physiques uniquement
export const artworkSchema = z.object({
    title: z.string().optional(),
    name: z.string()
        .min(1, "Le nom de l'œuvre est obligatoire")
        .max(100, "Le nom ne doit pas dépasser 100 caractères"),
    description: z.string()
        .min(10, "La description doit contenir au moins 10 caractères")
        .max(2000, "La description ne doit pas dépasser 2000 caractères"),
    metaTitle: z.string()
        .min(1, "Le titre SEO est obligatoire")
        .max(60, "Le titre SEO ne doit pas dépasser 60 caractères"),
    metaDescription: z.string()
        .min(10, "La description SEO doit contenir au moins 10 caractères")
        .max(160, "La description SEO ne doit pas dépasser 160 caractères"),
    price: z.number().positive("Le prix doit être supérieur à 0").or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Format de prix invalide")).optional(),
    pricePhysicalBeforeTax: z.string()
        .min(1, "Le prix est obligatoire")
        .refine(val => val !== '' && /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    initialQty: z.string()
        .min(1, "La quantité initiale est obligatoire")
        .refine(val => val !== '' && (/^\d+$/.test(val) && parseInt(val) > 0), "La quantité doit être un nombre entier positif"),
    hasPhysicalOnly: z.boolean().default(true),
    medium: z.string()
        .max(100, "Le support/medium ne doit pas dépasser 100 caractères")
        .optional(),
    mediumId: z.string()
        .min(1, "Le support/medium est requis"),
    styleId: z.string()
        .min(1, "Le style est requis"),
    techniqueId: z.string()
        .min(1, "La technique est requise"),
    width: z.string()
        .min(1, "La largeur est obligatoire")
        .refine((val) => !isNaN(parseFloat(val)), "La largeur doit être un nombre valide"),
    height: z.string()
        .min(1, "La hauteur est obligatoire")
        .refine((val) => !isNaN(parseFloat(val)), "La hauteur doit être un nombre valide"),
    weight: z.string()
        .min(1, "Le poids est obligatoire"),
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
    images: z.instanceof(FileList).nullable().optional()
        .refine(val => val !== null && val !== undefined && val.length > 0, {
            message: "L'image principale est requise"
        }),
    physicalCertificate: z.union([
        z.instanceof(FileList).refine(fileList => fileList.length > 0, { message: 'Un certificat d\'œuvre physique est requis' }),
        z.null()
    ]).optional(),
    artworkSupport: z.string().optional(),
    shippingAddressId: z.string()
        .min(1, "L'adresse d'expédition est obligatoire")
        .refine(val => val !== '', "L'adresse d'expédition doit être sélectionnée")
})
    // Validation du certificat pour l'option Œuvre physique
    .refine((data) => {
        return data.physicalCertificate && data.physicalCertificate instanceof FileList && data.physicalCertificate.length > 0;
    }, {
        message: "Le certificat d'œuvre physique est obligatoire",
        path: ["physicalCertificate"]
    });

// Schéma alternatif pour l'édition d'œuvres d'art (image principale optionnelle)
export const artworkEditSchema = z.object({
    title: z.string().optional(),
    name: z.string()
        .min(1, "Le nom de l'œuvre est obligatoire")
        .max(100, "Le nom ne doit pas dépasser 100 caractères"),
    description: z.string()
        .min(10, "La description doit contenir au moins 10 caractères")
        .max(2000, "La description ne doit pas dépasser 2000 caractères"),
    metaTitle: z.string()
        .min(1, "Le titre SEO est obligatoire")
        .max(60, "Le titre SEO ne doit pas dépasser 60 caractères"),
    metaDescription: z.string()
        .min(10, "La description SEO doit contenir au moins 10 caractères")
        .max(160, "La description SEO ne doit pas dépasser 160 caractères"),
    price: z.number().positive("Le prix doit être supérieur à 0").or(z.string().regex(/^\d+(\.\d{1,2})?$/, "Format de prix invalide")).optional(),
    pricePhysicalBeforeTax: z.string()
        .min(1, "Le prix est obligatoire")
        .refine(val => val !== '' && /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    initialQty: z.string()
        .min(1, "La quantité initiale est obligatoire")
        .refine(val => val !== '' && (/^\d+$/.test(val) && parseInt(val) > 0), "La quantité doit être un nombre entier positif"),
    hasPhysicalOnly: z.boolean().default(true),
    medium: z.string()
        .max(100, "Le support/medium ne doit pas dépasser 100 caractères")
        .optional(),
    mediumId: z.string()
        .min(1, "Le support/medium est requis"),
    styleId: z.string()
        .min(1, "Le style est requis"),
    techniqueId: z.string()
        .min(1, "La technique est requise"),
    width: z.string()
        .min(1, "La largeur est obligatoire")
        .refine((val) => !isNaN(parseFloat(val)), "La largeur doit être un nombre valide"),
    height: z.string()
        .min(1, "La hauteur est obligatoire")
        .refine((val) => !isNaN(parseFloat(val)), "La hauteur doit être un nombre valide"),
    weight: z.string()
        .min(1, "Le poids est obligatoire"),
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
    images: z.instanceof(FileList).nullable().optional(),
    physicalCertificate: z.union([
        z.instanceof(FileList),
        z.null()
    ]).optional(),
    artworkSupport: z.string().optional(),
    shippingAddressId: z.string()
        .min(1, "L'adresse d'expédition est obligatoire")
        .refine(val => val !== '', "L'adresse d'expédition doit être sélectionnée")
});

// Type unifié pour représenter les données du formulaire, compatible avec les deux schémas
export type ArtworkFormData = {
    title?: string;
    name: string;
    description: string;
    metaTitle: string;
    metaDescription: string;
    price?: string | number;
    pricePhysicalBeforeTax?: string;
    initialQty?: string;
    hasPhysicalOnly?: boolean;
    medium?: string;
    mediumId?: string;
    styleId?: string;
    techniqueId?: string;
    width?: string;
    height?: string;
    weight?: string;
    creationYear?: string;
    intellectualProperty: boolean;
    intellectualPropertyEndDate?: string;
    edition?: string;
    images: FileList | null | undefined;
    physicalCertificate?: FileList | null;
    artworkSupport?: string;
    certificateUrl?: string;
    physicalCertificateUrl?: string;
    secondaryImagesFiles?: FileList;
    shippingAddressId?: string;
}


