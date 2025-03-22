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