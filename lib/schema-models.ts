// Fonction pour récupérer les modèles du schéma Prisma 'landing'
export async function getSchemaModels() {
    // Liste des modèles du schéma 'landing', excluant Translation et Language
    const landingModels = [
        {
            name: 'Team',
            fields: [
                { name: 'role', type: 'String' },
                { name: 'intro', type: 'String' },
                { name: 'description', type: 'String' }
            ]
        },
        {
            name: 'Faq',
            fields: [
                { name: 'question', type: 'String' },
                { name: 'answer', type: 'String' }
            ]
        },
        {
            name: 'DetailedFaqHeader',
            fields: [
                { name: 'name', type: 'String' }
            ]
        },
        {
            name: 'DetailedFaqItem',
            fields: [
                { name: 'question', type: 'String' },
                { name: 'answer', type: 'String' }
            ]
        },
        {
            name: 'DetailedFaqPageItem',
            fields: [
                { name: 'question', type: 'String' },
                { name: 'answer', type: 'String' }
            ]
        },
        {
            name: 'DetailedGlossaryHeader',
            fields: [
                { name: 'name', type: 'String' }
            ]
        },
        {
            name: 'DetailedGlossaryItem',
            fields: [
                { name: 'question', type: 'String' },
                { name: 'answer', type: 'String' }
            ]
        },
        {
            name: 'PresaleArtwork',
            fields: [
                { name: 'name', type: 'String' },
                { name: 'description', type: 'String' }
            ]
        },
        {
            name: 'LandingArtist',
            fields: [
                { name: 'intro', type: 'String' },
                { name: 'description', type: 'String' },
                { name: 'artworkStyle', type: 'String' },
                { name: 'quoteFromInRealArt', type: 'String' },
                { name: 'biographyHeader1', type: 'String' },
                { name: 'biographyText1', type: 'String' },
                { name: 'biographyHeader2', type: 'String' },
                { name: 'biographyText2', type: 'String' },
                { name: 'biographyHeader3', type: 'String' },
                { name: 'biographyText3', type: 'String' },
                { name: 'biographyHeader4', type: 'String' },
                { name: 'biographyText4', type: 'String' },
                { name: 'mediumTags', type: 'String[]' }
            ]
        },
        {
            name: 'SeoCategory',
            fields: [
                { name: 'name', type: 'String' },
                { name: 'shortDescription', type: 'String' },
                { name: 'longDescription', type: 'String' },
                { name: 'textCTA', type: 'String' }
            ]
        },
        {
            name: 'ArtworkMedium',
            fields: [
                { name: 'name', type: 'String' }
            ]
        },
        {
            name: 'ArtworkStyle',
            fields: [
                { name: 'name', type: 'String' }
            ]
        },
        {
            name: 'ArtworkTechnique',
            fields: [
                { name: 'image', type: 'String' }
            ]
        },
        {
            name: 'ArtistCategory',
            fields: [
                { name: 'name', type: 'String' },
                { name: 'description', type: 'String' }
            ]
        },
        {
            name: 'StickyFooter',
            fields: [
                { name: 'title', type: 'String' },
                { name: 'text', type: 'String' },
                { name: 'textButton', type: 'String' }
            ]
        }
    ]

    return landingModels
} 