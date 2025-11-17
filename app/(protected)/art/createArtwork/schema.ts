import { z } from 'zod'

// Validation pour le prix (nombre positif avec ou sans décimales)
const priceRegex = /^\d+(\.\d{1,2})?$/

// Schéma principal pour la création d'œuvres d'art
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
        .optional()
        .refine(val => !val || val === '' || /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    priceNftBeforeTax: z.string()
        .optional()
        .refine(val => !val || val === '' || /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    initialQty: z.string()
        .optional()
        .refine(val => !val || val === '' || (/^\d+$/.test(val) && parseInt(val) > 0), "La quantité doit être un nombre entier positif"),
    hasPhysicalOnly: z.boolean().optional(),
    hasNftOnly: z.boolean().optional(),
    medium: z.string()
        .max(100, "Le support/medium ne doit pas dépasser 100 caractères")
        .optional(),
    mediumId: z.string()
        .min(1, "Le support/medium est requis"),
    styleIds: z.array(z.union([z.string(), z.number()]))
        .min(1, "Au moins un style est requis"),
    techniqueIds: z.array(z.union([z.string(), z.number()]))
        .min(1, "Au moins une technique est requise"),
    themeIds: z.array(z.union([z.string(), z.number()]))
        .optional(),
    width: z.string()
        .optional()
        .refine((val) => !val || !isNaN(parseFloat(val)), "La largeur doit être un nombre valide"),
    height: z.string()
        .optional()
        .refine((val) => !val || !isNaN(parseFloat(val)), "La hauteur doit être un nombre valide"),
    weight: z.string().optional(),
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
    nftCertificate: z.union([
        z.instanceof(FileList).refine(fileList => fileList.length > 0, { message: 'Un certificat NFT est requis' }),
        z.null()
    ]).optional(),
    artworkSupport: z.string().optional(),
    shippingAddressId: z.string()
        .optional()
        .refine(val => !val || val !== '', "L'adresse d'expédition doit être sélectionnée si renseignée")
})
    // Validation qu'au moins une option de tarification est sélectionnée
    .refine((data) => {
        return data.hasPhysicalOnly || data.hasNftOnly;
    }, {
        message: "Vous devez sélectionner au moins une option de tarification",
        path: ["pricingOption"]
    })
    // Validation du prix pour l'option Œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.pricePhysicalBeforeTax && data.pricePhysicalBeforeTax !== '';
        }
        return true;
    }, {
        message: "Le prix est obligatoire pour l'option Œuvre physique",
        path: ["pricePhysicalBeforeTax"]
    })
    // Validation du prix pour l'option NFT
    .refine((data) => {
        if (data.hasNftOnly) {
            return !!data.priceNftBeforeTax && data.priceNftBeforeTax !== '';
        }
        return true;
    }, {
        message: "Le prix est obligatoire pour l'option NFT",
        path: ["priceNftBeforeTax"]
    })
    // Validation de la quantité initiale pour les options avec œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.initialQty && data.initialQty !== '';
        }
        return true;
    }, {
        message: "La quantité initiale est obligatoire pour une œuvre physique",
        path: ["initialQty"]
    })
    // Validation des dimensions pour les options avec œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.width && !!data.height && !!data.weight;
        }
        return true;
    }, {
        message: "Les dimensions (largeur, hauteur) et le poids sont obligatoires pour une œuvre physique",
        path: ["physicalDimensions"]
    })
    // Validation de l'adresse d'expédition pour les options avec œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.shippingAddressId && data.shippingAddressId !== '';
        }
        return true;
    }, {
        message: "L'adresse d'expédition est obligatoire pour une œuvre physique",
        path: ["shippingAddressId"]
    })
    // Validation du certificat pour l'option Œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return data.physicalCertificate && data.physicalCertificate instanceof FileList && data.physicalCertificate.length > 0;
        }
        return true;
    }, {
        message: "Le certificat d'œuvre physique est obligatoire",
        path: ["physicalCertificate"]
    })
    // Validation du certificat pour l'option NFT
    .refine((data) => {
        if (data.hasNftOnly) {
            return data.nftCertificate && data.nftCertificate instanceof FileList && data.nftCertificate.length > 0;
        }
        return true;
    }, {
        message: "Le certificat NFT est obligatoire",
        path: ["nftCertificate"]
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
        .optional()
        .refine(val => !val || val === '' || /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    priceNftBeforeTax: z.string()
        .optional()
        .refine(val => !val || val === '' || /^\d+$/.test(val), "Le prix doit être un nombre entier"),
    initialQty: z.string()
        .optional()
        .refine(val => !val || val === '' || (/^\d+$/.test(val) && parseInt(val) > 0), "La quantité doit être un nombre entier positif"),
    hasPhysicalOnly: z.boolean().optional(),
    hasNftOnly: z.boolean().optional(),
    medium: z.string()
        .max(100, "Le support/medium ne doit pas dépasser 100 caractères")
        .optional(),
    mediumId: z.string()
        .min(1, "Le support/medium est requis"),
    styleIds: z.array(z.union([z.string(), z.number()]))
        .min(1, "Au moins un style est requis"),
    techniqueIds: z.array(z.union([z.string(), z.number()]))
        .min(1, "Au moins une technique est requise"),
    themeIds: z.array(z.union([z.string(), z.number()]))
        .optional(),
    width: z.string()
        .optional()
        .refine((val) => !val || !isNaN(parseFloat(val)), "La largeur doit être un nombre valide"),
    height: z.string()
        .optional()
        .refine((val) => !val || !isNaN(parseFloat(val)), "La hauteur doit être un nombre valide"),
    weight: z.string().optional(),
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
    nftCertificate: z.union([
        z.instanceof(FileList),
        z.null()
    ]).optional(),
    artworkSupport: z.string().optional(),
    shippingAddressId: z.string()
        .optional()
        .refine(val => !val || val !== '', "L'adresse d'expédition doit être sélectionnée si renseignée")
})
    // Validation qu'au moins une option de tarification est sélectionnée
    .refine((data) => {
        return data.hasPhysicalOnly || data.hasNftOnly;
    }, {
        message: "Vous devez sélectionner au moins une option de tarification",
        path: ["pricingOption"]
    })
    // Validation du prix pour l'option Œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.pricePhysicalBeforeTax && data.pricePhysicalBeforeTax !== '';
        }
        return true;
    }, {
        message: "Le prix est obligatoire pour l'option Œuvre physique",
        path: ["pricePhysicalBeforeTax"]
    })
    // Validation du prix pour l'option NFT
    .refine((data) => {
        if (data.hasNftOnly) {
            return !!data.priceNftBeforeTax && data.priceNftBeforeTax !== '';
        }
        return true;
    }, {
        message: "Le prix est obligatoire pour l'option NFT",
        path: ["priceNftBeforeTax"]
    })
    // Validation de la quantité initiale pour les options avec œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.initialQty && data.initialQty !== '';
        }
        return true;
    }, {
        message: "La quantité initiale est obligatoire pour une œuvre physique",
        path: ["initialQty"]
    })
    // Validation des dimensions pour les options avec œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.width && !!data.height && !!data.weight;
        }
        return true;
    }, {
        message: "Les dimensions (largeur, hauteur) et le poids sont obligatoires pour une œuvre physique",
        path: ["physicalDimensions"]
    })
    // Validation de l'adresse d'expédition pour les options avec œuvre physique
    .refine((data) => {
        if (data.hasPhysicalOnly) {
            return !!data.shippingAddressId && data.shippingAddressId !== '';
        }
        return true;
    }, {
        message: "L'adresse d'expédition est obligatoire pour une œuvre physique",
        path: ["shippingAddressId"]
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
    priceNftBeforeTax?: string;
    initialQty?: string;
    hasPhysicalOnly?: boolean;
    hasNftOnly?: boolean;
    medium?: string;
    mediumId?: string;
    styleIds?: (string | number)[];
    techniqueIds?: (string | number)[];
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
    certificateUrl?: string;
    physicalCertificateUrl?: string;
    nftCertificateUrl?: string;
    secondaryImagesFiles?: FileList;
    shippingAddressId?: string;
}