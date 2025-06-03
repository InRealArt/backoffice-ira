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
        }
    ]

    return landingModels
} 