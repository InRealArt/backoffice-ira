/**
 * Formate une date en format français
 * @param dateString - La date à formater (peut être un string, Date ou timestamp)
 * @returns La date formatée en français (JJ/MM/AAAA)
 */
export function formatDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

/**
 * Normalise une chaîne de caractères (supprime les accents, met en minuscules et remplace les espaces/caractères spéciaux par des tirets)
 * @param str - La chaîne à normaliser
 * @returns La chaîne normalisée
 */
export function normalizeString(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères non alphanumériques par des tirets
        .replace(/^-|-$/g, '') // Supprime les tirets au début et à la fin
}

/**
 * Génère un slug à partir du prénom et du nom
 * @param name - Le prénom
 * @param surname - Le nom de famille
 * @returns Le slug généré (prénom-nom sans accents et en minuscules)
 */
export function generateSlug(name: string, surname: string): string {
    return `${normalizeString(name)}-${normalizeString(surname)}`
} 