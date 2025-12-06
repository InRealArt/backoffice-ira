import { z } from 'zod'

// Validation pour le prix (nombre positif avec ou sans décimales)
const priceRegex = /^\d+(\.\d{1,2})?$/

// Schéma principal pour la création d'œuvres d'art physiques uniquement
export const physicalArtworkSchema = z.object({
    title: z.string().optional(),
    name: z.string()
        .min(1, "Le nom de l'œuvre est obligatoire")
        .max(100, "Le nom ne doit pas dépasser 100 caractères"),
    description: z.string()
        .min(10, "La description doit contenir au moins 10 caractères")
        .max(2000, "La description ne doit pas dépasser 2000 caractères"),
    metaTitle: z.string()
        .max(60, "Le titre SEO ne doit pas dépasser 60 caractères")
        .optional(),
    metaDescription: z.string()
        .max(160, "La description SEO ne doit pas dépasser 160 caractères")
        .optional(),
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
    styleIds: z.array(z.union([z.string(), z.number()]))
        .min(1, "Au moins un style est requis")
        .default([]),
    techniqueIds: z.array(z.union([z.string(), z.number()]))
        .min(1, "Au moins une technique est requise")
        .default([]),
    themeIds: z.array(z.union([z.string(), z.number()]))
        .optional(),
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
    mainImageUrl: z.string()
        .min(1, "L'image principale est requise"),
    images: z.instanceof(FileList).nullable().optional(),
    physicalCertificate: z.union([
        z.instanceof(FileList),
        z.null()
    ]).optional(),
    artworkSupport: z.string().optional(),
    supportId: z.string().optional(),
    shippingAddressId: z.string()
        .min(1, "L'adresse d'expédition est obligatoire")
        .refine(val => val !== '', "L'adresse d'expédition doit être sélectionnée"),
    physicalCollectionId: z.string()
        .min(1, "La collection est obligatoire")
        .refine(val => val !== '', "La collection doit être sélectionnée")
});

// Schéma alternatif pour l'édition d'œuvres d'art (image principale optionnelle)
export const physicalArtworkEditSchema = z.object({
    title: z.string().optional(),
    name: z.string()
        .min(1, "Le nom de l'œuvre est obligatoire")
        .max(100, "Le nom ne doit pas dépasser 100 caractères"),
    description: z.string()
        .min(10, "La description doit contenir au moins 10 caractères")
        .max(2000, "La description ne doit pas dépasser 2000 caractères"),
    metaTitle: z.string()
        .max(60, "Le titre SEO ne doit pas dépasser 60 caractères")
        .optional(),
    metaDescription: z.string()
        .max(160, "La description SEO ne doit pas dépasser 160 caractères")
        .optional(),
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
    styleIds: z.array(z.union([z.string(), z.number()]))
        .min(1, "Au moins un style est requis")
        .default([]),
    techniqueIds: z.array(z.union([z.string(), z.number()]))
        .min(1, "Au moins une technique est requise")
        .default([]),
    themeIds: z.array(z.union([z.string(), z.number()]))
        .optional(),
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
    mainImageUrl: z.string()
        .min(1, "L'image principale est requise"),
    images: z.instanceof(FileList).nullable().optional(),
    physicalCertificate: z.union([
        z.instanceof(FileList),
        z.null()
    ]).optional(),
    artworkSupport: z.string().optional(),
    supportId: z.string().optional(),
    shippingAddressId: z.string()
        .min(1, "L'adresse d'expédition est obligatoire")
        .refine(val => val !== '', "L'adresse d'expédition doit être sélectionnée"),
    physicalCollectionId: z.string()
        .min(1, "La collection est obligatoire")
        .refine(val => val !== '', "La collection doit être sélectionnée")
});

// Type unifié pour représenter les données du formulaire, compatible avec les deux schémas
export type PhysicalArtworkFormData = {
    title?: string;
    name: string;
    description: string;
    metaTitle?: string;
    metaDescription?: string;
    price?: string | number;
    pricePhysicalBeforeTax?: string;
    initialQty?: string;
    hasPhysicalOnly?: boolean;
    medium?: string;
    mediumId?: string;
    styleIds: (string | number)[];
    techniqueIds: (string | number)[];
    themeIds?: (string | number)[];
    width?: string;
    height?: string;
    weight?: string;
    creationYear?: string;
    intellectualProperty: boolean;
    intellectualPropertyEndDate?: string;
    edition?: string;
    images: FileList | null | undefined;
    physicalCertificate?: FileList | null;
    nftCertificate?: FileList | null;
    artworkSupport?: string;
    supportId?: string;
    certificateUrl?: string;
    physicalCertificateUrl?: string;
    nftCertificateUrl?: string;
    secondaryImagesFiles?: FileList;
    shippingAddressId?: string;
    physicalCollectionId?: string;
    mainImageUrl?: string;
}


