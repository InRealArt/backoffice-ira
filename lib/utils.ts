import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Valide une URL (gère les entités HTML comme &amp;)
 * @param val - L'URL à valider (peut être une chaîne vide ou undefined)
 * @returns true si l'URL est valide ou vide, false sinon
 */
export function validateUrl(val: string | undefined): boolean {
    if (val === "" || !val) return true
    // Décoder les entités HTML comme &amp; en &
    const decoded = val.replace(/&amp;/g, "&")
    try {
        new URL(decoded)
        return true
    } catch {
        return false
    }
}


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
 * Génère un slug SEO-friendly à partir d'un texte (titre, nom, etc.).
 * - Ligatures (œ, æ) → équivalents ASCII (oe, ae)
 * - Apostrophes (', ', ') → supprimées (élision française : "l'exploitation" → "lexploitation")
 * - Accents et caractères spéciaux → normalisés ou supprimés
 * - Espaces → tirets
 * Conforme aux bonnes pratiques : URLs descriptives, caractères unreserved (RFC 3986),
 * pas d’apostrophe dans le chemin pour éviter problèmes de partage et d’encodage.
 * @param name - Le texte source (ex. titre d'article)
 * @returns Le slug généré (minuscules, tirets, alphanumériques)
 */
export function generateSlug(name: string): string {
    return name
        .replace(/\u0153/g, 'oe')   // œ -> oe
        .replace(/\u0152/g, 'oe')   // Œ -> oe
        .replace(/\u00e6/g, 'ae')   // æ -> ae
        .replace(/\u00c6/g, 'ae')   // Æ -> ae
        .replace(/[\u0027\u2018\u2019\u201B]/g, '')  // Apostrophes (ASCII + typographiques) -> supprimées (élision)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')        // Plusieurs tirets consécutifs -> un seul
        .replace(/^-|-$/g, '')
}

/**
 * Convertit une chaîne en slug (utilisé sur le site web inrealart.com)
 * Cette fonction doit correspondre exactement à celle utilisée sur le site web
 * @param str - La chaîne à convertir
 * @returns Le slug généré
 */
export function stringToSlug(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (accents)
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-') // Replace multiple - with single -
}

/**
 * Convertit une chaîne en camelCase
 * @param str - La chaîne à convertir
 * @returns La chaîne en camelCase
 */
export function toCamelCase(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-zA-Z0-9\s]/g, '') // Supprime les caractères spéciaux
        .split(/\s+/)
        .map((word, index) => {
            if (index === 0) {
                return word.toLowerCase()
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join('')
}

/**
 * Type pour un pays avec son code ISO et son nom
 */
export interface Country {
    code: string
    name: string
}

/**
 * Retourne la liste des pays selon la norme ISO 3166-1 alpha-2
 * @returns Liste des pays avec leur code ISO et nom en français
 */
export function getCountries(): Country[] {
    return [
        { code: 'AF', name: 'Afghanistan' },
        { code: 'AX', name: 'Îles Åland' },
        { code: 'AL', name: 'Albanie' },
        { code: 'DZ', name: 'Algérie' },
        { code: 'AS', name: 'Samoa américaines' },
        { code: 'AD', name: 'Andorre' },
        { code: 'AO', name: 'Angola' },
        { code: 'AI', name: 'Anguilla' },
        { code: 'AQ', name: 'Antarctique' },
        { code: 'AG', name: 'Antigua-et-Barbuda' },
        { code: 'AR', name: 'Argentine' },
        { code: 'AM', name: 'Arménie' },
        { code: 'AW', name: 'Aruba' },
        { code: 'AU', name: 'Australie' },
        { code: 'AT', name: 'Autriche' },
        { code: 'AZ', name: 'Azerbaïdjan' },
        { code: 'BS', name: 'Bahamas' },
        { code: 'BH', name: 'Bahreïn' },
        { code: 'BD', name: 'Bangladesh' },
        { code: 'BB', name: 'Barbade' },
        { code: 'BY', name: 'Biélorussie' },
        { code: 'BE', name: 'Belgique' },
        { code: 'BZ', name: 'Belize' },
        { code: 'BJ', name: 'Bénin' },
        { code: 'BM', name: 'Bermudes' },
        { code: 'BT', name: 'Bhoutan' },
        { code: 'BO', name: 'Bolivie' },
        { code: 'BQ', name: 'Bonaire, Saint-Eustache et Saba' },
        { code: 'BA', name: 'Bosnie-Herzégovine' },
        { code: 'BW', name: 'Botswana' },
        { code: 'BV', name: 'Île Bouvet' },
        { code: 'BR', name: 'Brésil' },
        { code: 'IO', name: 'Territoire britannique de l\'océan Indien' },
        { code: 'BN', name: 'Brunéi Darussalam' },
        { code: 'BG', name: 'Bulgarie' },
        { code: 'BF', name: 'Burkina Faso' },
        { code: 'BI', name: 'Burundi' },
        { code: 'KH', name: 'Cambodge' },
        { code: 'CM', name: 'Cameroun' },
        { code: 'CA', name: 'Canada' },
        { code: 'CV', name: 'Cap-Vert' },
        { code: 'KY', name: 'Îles Caïmans' },
        { code: 'CF', name: 'République centrafricaine' },
        { code: 'TD', name: 'Tchad' },
        { code: 'CL', name: 'Chili' },
        { code: 'CN', name: 'Chine' },
        { code: 'CX', name: 'Île Christmas' },
        { code: 'CC', name: 'Îles Cocos (Keeling)' },
        { code: 'CO', name: 'Colombie' },
        { code: 'KM', name: 'Comores' },
        { code: 'CG', name: 'Congo' },
        { code: 'CD', name: 'République démocratique du Congo' },
        { code: 'CK', name: 'Îles Cook' },
        { code: 'CR', name: 'Costa Rica' },
        { code: 'CI', name: 'Côte d\'Ivoire' },
        { code: 'HR', name: 'Croatie' },
        { code: 'CU', name: 'Cuba' },
        { code: 'CW', name: 'Curaçao' },
        { code: 'CY', name: 'Chypre' },
        { code: 'CZ', name: 'République tchèque' },
        { code: 'DK', name: 'Danemark' },
        { code: 'DJ', name: 'Djibouti' },
        { code: 'DM', name: 'Dominique' },
        { code: 'DO', name: 'République dominicaine' },
        { code: 'EC', name: 'Équateur' },
        { code: 'EG', name: 'Égypte' },
        { code: 'SV', name: 'El Salvador' },
        { code: 'GQ', name: 'Guinée équatoriale' },
        { code: 'ER', name: 'Érythrée' },
        { code: 'EE', name: 'Estonie' },
        { code: 'ET', name: 'Éthiopie' },
        { code: 'FK', name: 'Îles Falkland (Malvinas)' },
        { code: 'FO', name: 'Îles Féroé' },
        { code: 'FJ', name: 'Fidji' },
        { code: 'FI', name: 'Finlande' },
        { code: 'FR', name: 'France' },
        { code: 'GF', name: 'Guyane française' },
        { code: 'PF', name: 'Polynésie française' },
        { code: 'TF', name: 'Terres australes françaises' },
        { code: 'GA', name: 'Gabon' },
        { code: 'GM', name: 'Gambie' },
        { code: 'GE', name: 'Géorgie' },
        { code: 'DE', name: 'Allemagne' },
        { code: 'GH', name: 'Ghana' },
        { code: 'GI', name: 'Gibraltar' },
        { code: 'GR', name: 'Grèce' },
        { code: 'GL', name: 'Groenland' },
        { code: 'GD', name: 'Grenade' },
        { code: 'GP', name: 'Guadeloupe' },
        { code: 'GU', name: 'Guam' },
        { code: 'GT', name: 'Guatemala' },
        { code: 'GG', name: 'Guernesey' },
        { code: 'GN', name: 'Guinée' },
        { code: 'GW', name: 'Guinée-Bissau' },
        { code: 'GY', name: 'Guyana' },
        { code: 'HT', name: 'Haïti' },
        { code: 'HM', name: 'Îles Heard et McDonald' },
        { code: 'VA', name: 'Saint-Siège (État de la Cité du Vatican)' },
        { code: 'HN', name: 'Honduras' },
        { code: 'HK', name: 'Hong Kong' },
        { code: 'HU', name: 'Hongrie' },
        { code: 'IS', name: 'Islande' },
        { code: 'IN', name: 'Inde' },
        { code: 'ID', name: 'Indonésie' },
        { code: 'IR', name: 'Iran' },
        { code: 'IQ', name: 'Irak' },
        { code: 'IE', name: 'Irlande' },
        { code: 'IM', name: 'Île de Man' },
        { code: 'IL', name: 'Israël' },
        { code: 'IT', name: 'Italie' },
        { code: 'JM', name: 'Jamaïque' },
        { code: 'JP', name: 'Japon' },
        { code: 'JE', name: 'Jersey' },
        { code: 'JO', name: 'Jordanie' },
        { code: 'KZ', name: 'Kazakhstan' },
        { code: 'KE', name: 'Kenya' },
        { code: 'KI', name: 'Kiribati' },
        { code: 'KP', name: 'Corée du Nord' },
        { code: 'KR', name: 'Corée du Sud' },
        { code: 'KW', name: 'Koweït' },
        { code: 'KG', name: 'Kirghizistan' },
        { code: 'LA', name: 'Laos' },
        { code: 'LV', name: 'Lettonie' },
        { code: 'LB', name: 'Liban' },
        { code: 'LS', name: 'Lesotho' },
        { code: 'LR', name: 'Libéria' },
        { code: 'LY', name: 'Libye' },
        { code: 'LI', name: 'Liechtenstein' },
        { code: 'LT', name: 'Lituanie' },
        { code: 'LU', name: 'Luxembourg' },
        { code: 'MO', name: 'Macao' },
        { code: 'MK', name: 'Macédoine du Nord' },
        { code: 'MG', name: 'Madagascar' },
        { code: 'MW', name: 'Malawi' },
        { code: 'MY', name: 'Malaisie' },
        { code: 'MV', name: 'Maldives' },
        { code: 'ML', name: 'Mali' },
        { code: 'MT', name: 'Malte' },
        { code: 'MH', name: 'Îles Marshall' },
        { code: 'MQ', name: 'Martinique' },
        { code: 'MR', name: 'Mauritanie' },
        { code: 'MU', name: 'Maurice' },
        { code: 'YT', name: 'Mayotte' },
        { code: 'MX', name: 'Mexique' },
        { code: 'FM', name: 'Micronésie' },
        { code: 'MD', name: 'Moldavie' },
        { code: 'MC', name: 'Monaco' },
        { code: 'MN', name: 'Mongolie' },
        { code: 'ME', name: 'Monténégro' },
        { code: 'MS', name: 'Montserrat' },
        { code: 'MA', name: 'Maroc' },
        { code: 'MZ', name: 'Mozambique' },
        { code: 'MM', name: 'Myanmar' },
        { code: 'NA', name: 'Namibie' },
        { code: 'NR', name: 'Nauru' },
        { code: 'NP', name: 'Népal' },
        { code: 'NL', name: 'Pays-Bas' },
        { code: 'NC', name: 'Nouvelle-Calédonie' },
        { code: 'NZ', name: 'Nouvelle-Zélande' },
        { code: 'NI', name: 'Nicaragua' },
        { code: 'NE', name: 'Niger' },
        { code: 'NG', name: 'Nigeria' },
        { code: 'NU', name: 'Niue' },
        { code: 'NF', name: 'Île Norfolk' },
        { code: 'MP', name: 'Îles Mariannes du Nord' },
        { code: 'NO', name: 'Norvège' },
        { code: 'OM', name: 'Oman' },
        { code: 'PK', name: 'Pakistan' },
        { code: 'PW', name: 'Palaos' },
        { code: 'PS', name: 'Palestine' },
        { code: 'PA', name: 'Panama' },
        { code: 'PG', name: 'Papouasie-Nouvelle-Guinée' },
        { code: 'PY', name: 'Paraguay' },
        { code: 'PE', name: 'Pérou' },
        { code: 'PH', name: 'Philippines' },
        { code: 'PN', name: 'Pitcairn' },
        { code: 'PL', name: 'Pologne' },
        { code: 'PT', name: 'Portugal' },
        { code: 'PR', name: 'Porto Rico' },
        { code: 'QA', name: 'Qatar' },
        { code: 'RE', name: 'Réunion' },
        { code: 'RO', name: 'Roumanie' },
        { code: 'RU', name: 'Russie' },
        { code: 'RW', name: 'Rwanda' },
        { code: 'BL', name: 'Saint-Barthélemy' },
        { code: 'SH', name: 'Sainte-Hélène, Ascension et Tristan da Cunha' },
        { code: 'KN', name: 'Saint-Kitts-et-Nevis' },
        { code: 'LC', name: 'Sainte-Lucie' },
        { code: 'MF', name: 'Saint-Martin (partie française)' },
        { code: 'PM', name: 'Saint-Pierre-et-Miquelon' },
        { code: 'VC', name: 'Saint-Vincent-et-les Grenadines' },
        { code: 'WS', name: 'Samoa' },
        { code: 'SM', name: 'Saint-Marin' },
        { code: 'ST', name: 'Sao Tomé-et-Principe' },
        { code: 'SA', name: 'Arabie saoudite' },
        { code: 'SN', name: 'Sénégal' },
        { code: 'RS', name: 'Serbie' },
        { code: 'SC', name: 'Seychelles' },
        { code: 'SL', name: 'Sierra Leone' },
        { code: 'SG', name: 'Singapour' },
        { code: 'SX', name: 'Saint-Martin (partie néerlandaise)' },
        { code: 'SK', name: 'Slovaquie' },
        { code: 'SI', name: 'Slovénie' },
        { code: 'SB', name: 'Îles Salomon' },
        { code: 'SO', name: 'Somalie' },
        { code: 'ZA', name: 'Afrique du Sud' },
        { code: 'GS', name: 'Géorgie du Sud et les îles Sandwich du Sud' },
        { code: 'SS', name: 'Soudan du Sud' },
        { code: 'ES', name: 'Espagne' },
        { code: 'LK', name: 'Sri Lanka' },
        { code: 'SD', name: 'Soudan' },
        { code: 'SR', name: 'Suriname' },
        { code: 'SJ', name: 'Svalbard et Jan Mayen' },
        { code: 'SZ', name: 'Eswatini' },
        { code: 'SE', name: 'Suède' },
        { code: 'CH', name: 'Suisse' },
        { code: 'SY', name: 'Syrie' },
        { code: 'TW', name: 'Taïwan' },
        { code: 'TJ', name: 'Tadjikistan' },
        { code: 'TZ', name: 'Tanzanie' },
        { code: 'TH', name: 'Thaïlande' },
        { code: 'TL', name: 'Timor-Leste' },
        { code: 'TG', name: 'Togo' },
        { code: 'TK', name: 'Tokelau' },
        { code: 'TO', name: 'Tonga' },
        { code: 'TT', name: 'Trinité-et-Tobago' },
        { code: 'TN', name: 'Tunisie' },
        { code: 'TR', name: 'Turquie' },
        { code: 'TM', name: 'Turkménistan' },
        { code: 'TC', name: 'Îles Turques-et-Caïques' },
        { code: 'TV', name: 'Tuvalu' },
        { code: 'UG', name: 'Ouganda' },
        { code: 'UA', name: 'Ukraine' },
        { code: 'AE', name: 'Émirats arabes unis' },
        { code: 'GB', name: 'Royaume-Uni' },
        { code: 'US', name: 'États-Unis' },
        { code: 'UM', name: 'Îles mineures éloignées des États-Unis' },
        { code: 'UY', name: 'Uruguay' },
        { code: 'UZ', name: 'Ouzbékistan' },
        { code: 'VU', name: 'Vanuatu' },
        { code: 'VE', name: 'Venezuela' },
        { code: 'VN', name: 'Viêt Nam' },
        { code: 'VG', name: 'Îles Vierges britanniques' },
        { code: 'VI', name: 'Îles Vierges des États-Unis' },
        { code: 'WF', name: 'Wallis-et-Futuna' },
        { code: 'EH', name: 'Sahara occidental' },
        { code: 'YE', name: 'Yémen' },
        { code: 'ZM', name: 'Zambie' },
        { code: 'ZW', name: 'Zimbabwe' }
    ]
} 