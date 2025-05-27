/**
 * Calcule le temps de lecture estimé d'un contenu HTML
 * @param htmlContent - Le contenu HTML complet de l'article
 * @returns Le temps de lecture en minutes (minimum 1 minute)
 */
export function calculateReadingTime(htmlContent: string): number {
    if (!htmlContent || htmlContent.trim() === '') {
        return 1
    }

    // Supprimer les balises HTML pour obtenir le texte brut
    const textContent = htmlContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer les scripts
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Supprimer les styles
        .replace(/<[^>]*>/g, ' ') // Supprimer toutes les balises HTML
        .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
        .trim()

    // Compter les mots (séparer par les espaces et filtrer les chaînes vides)
    const words = textContent.split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length

    // Vitesse de lecture moyenne : 200-250 mots par minute
    // Nous utilisons 220 mots par minute comme moyenne
    const wordsPerMinute = 220

    // Calculer le temps de lecture en minutes
    const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute)

    // S'assurer que le minimum est 1 minute
    return Math.max(1, readingTimeMinutes)
}

/**
 * Calcule le temps de lecture à partir du contenu JSON du blog
 * @param blogContentJson - Le contenu JSON du blog
 * @returns Le temps de lecture en minutes (minimum 1 minute)
 */
export function calculateReadingTimeFromBlogContent(blogContentJson: string): number {
    if (!blogContentJson || blogContentJson.trim() === '') {
        return 1
    }

    try {
        const blogContent = JSON.parse(blogContentJson)

        // Extraire tout le texte du contenu du blog
        let textContent = ''

        if (Array.isArray(blogContent)) {
            blogContent.forEach((section: any) => {
                if (section.elements && Array.isArray(section.elements)) {
                    section.elements.forEach((element: any) => {
                        switch (element.type) {
                            case 'paragraph':
                                textContent += (element.content || '') + ' '
                                break
                            case 'h2':
                            case 'h3':
                                textContent += (element.content || '') + ' '
                                break
                            case 'list':
                                if (element.items && Array.isArray(element.items)) {
                                    textContent += element.items.join(' ') + ' '
                                }
                                break
                            case 'accordion':
                                if (element.items && Array.isArray(element.items)) {
                                    element.items.forEach((item: any) => {
                                        textContent += (item.title || '') + ' ' + (item.content || '') + ' '
                                    })
                                }
                                break
                            default:
                                // Pour les autres types d'éléments, essayer d'extraire le contenu textuel
                                if (element.content) {
                                    textContent += element.content + ' '
                                }
                                break
                        }
                    })
                }
            })
        }

        // Supprimer les balises HTML restantes et nettoyer le texte
        textContent = textContent
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

        // Compter les mots
        const words = textContent.split(/\s+/).filter(word => word.length > 0)
        const wordCount = words.length

        // Calculer le temps de lecture (220 mots par minute)
        const readingTimeMinutes = Math.ceil(wordCount / 220)

        // S'assurer que le minimum est 1 minute
        return Math.max(1, readingTimeMinutes)
    } catch (error) {
        console.error('Erreur lors du parsing du contenu JSON pour le calcul du temps de lecture:', error)
        return 1
    }
} 