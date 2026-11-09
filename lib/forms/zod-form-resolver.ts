import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

/**
 * Résolveur zod pour react-hook-form dont le type de valeurs est la SORTIE du schéma (z.infer).
 *
 * Avec zod 4 et @hookform/resolvers v5, zodResolver(schema) est typé avec l'ENTRÉE du schéma comme
 * valeurs du formulaire : un champ `z.boolean().default(false)` y devient `boolean | undefined`,
 * alors que nos formulaires sont écrits avec `useForm<z.infer<typeof schema>>` (champ `boolean`).
 * Le comportement à l'exécution est identique ; seul le type du résolveur est aligné sur la sortie.
 */
export function zodFormResolver<S extends z.ZodType<FieldValues>>(schema: S): Resolver<z.infer<S>> {
    return zodResolver(schema as never) as unknown as Resolver<z.infer<S>>
}
