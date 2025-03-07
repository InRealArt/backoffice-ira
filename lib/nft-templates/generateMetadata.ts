interface Attribute {
    trait_type: string;
    value: string | number;
    display_type?: 'number' | 'boost_percentage' | 'date';
}

interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    external_url?: string;
    attributes: Attribute[];
}

/**
 * Génère un objet de métadonnées NFT conforme au standard avec les attributs spécifiques
 */
export function generateNFTMetadata(params: {
    name: string;
    description: string;
    imageCID: string;
    certificateUri: string;
    externalUrl?: string;
}): NFTMetadata {
    const {
        name,
        description,
        imageCID,
        certificateUri,
        externalUrl
    } = params;

    // Attributes spécifiques demandés
    const attributes: Attribute[] = [
        {
            trait_type: "certificateUri",
            value: certificateUri
        }
    ];

    const metadata: NFTMetadata = {
        name,
        description,
        image: `ipfs://${imageCID}`,
        attributes
    };

    if (externalUrl) metadata.external_url = externalUrl;

    return metadata;
}

/**
 * Convertit les métadonnées en format JSON valide
 */
export function metadataToJSON(metadata: NFTMetadata): string {
    return JSON.stringify(metadata, null, 2);
}

/**
 * Exemple d'utilisation avec les attributs spécifiques
 */
export function generateExampleMetadata(): NFTMetadata {
    return generateNFTMetadata({
        name: "Nom de l'œuvre d'art",
        description: "Description détaillée de l'œuvre d'art",
        imageCID: "QmYourImageCID",
        certificateUri: "ipfs://CID_DU_CERTIFICAT_AUTHENTICITE",
        externalUrl: "https://votre-site-galerie.com/oeuvre/123"
    });
} 