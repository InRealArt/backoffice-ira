/**
 * Clés canoniques de dossiers R2 (fonctions pures, importables côté serveur comme côté test).
 *
 * Les dossiers sont construits côté client sous plusieurs formes (« Prénom Nom », sans accents,
 * kebab-case, minuscules collées, camelCase, espaces parasites…). On compare donc une clé
 * canonique : minuscules, accents décomposables retirés, uniquement lettres et chiffres Unicode
 * (les alphabets non latins et des lettres comme Ø, Ł, ß sont conservés). « Gilles  Bruno »,
 * « gilles-bruno », « gillesbruno » et « Gilles Bruno » donnent tous « gillesbruno ».
 */

/** Clé canonique d'un nom ou d'un nom de dossier : minuscules, sans accents, lettres/chiffres uniquement. */
export function canonicalFolderKey(value: string | null | undefined): string {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // retire les accents (combinés, après NFD)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]/gu, '')
}

type ArtistNames = { name: string | null; surname: string | null }

/**
 * Clé de dossier d'un artiste : « prénom + nom » uniquement.
 * Le pseudo n'en fait volontairement pas partie : l'artiste peut le modifier lui-même, il
 * permettrait de s'approprier le dossier d'un autre. Chaîne vide si le nom est inexploitable.
 */
export function artistFolderKey(artist: ArtistNames): string {
    return canonicalFolderKey(`${artist.name ?? ''}${artist.surname ?? ''}`)
}

/**
 * Valide le nom d'un nouvel artiste (création de profil par l'artiste lui-même).
 * Le nom sert de clé de dossier de stockage : il doit être exploitable, ne pas contenir de
 * séparateur de chemin et ne pas correspondre (accents, casse, séparateurs près) à un artiste existant.
 *
 * @returns un message d'erreur, ou null si le nom est acceptable
 */
export function validateNewArtistName(
    candidate: { name: string | null | undefined; surname: string | null | undefined },
    existingArtists: ArtistNames[]
): string | null {
    const name = candidate.name ?? ''
    const surname = candidate.surname ?? ''
    if (/[\\/]/.test(name) || /[\\/]/.test(surname)) {
        return 'Le prénom et le nom ne peuvent pas contenir les caractères / ou \\'
    }
    const key = artistFolderKey({ name, surname })
    if (!key) return 'Le prénom et le nom doivent contenir des lettres ou des chiffres'
    if (existingArtists.some((artist) => artistFolderKey(artist) === key)) {
        return 'Un artiste portant ce nom existe déjà'
    }
    return null
}
