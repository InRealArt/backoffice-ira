import { z } from 'zod'

const dateField = z.coerce.date()

export const createAuditClientSchema = z.object({
    clientName: z.string().trim().min(1, 'Le nom est requis').max(255),
    clientEmail: z.string().trim().toLowerCase().email('E-mail invalide').max(255),
    auditorName: z.string().trim().max(255).optional().or(z.literal('')),
    paymentType: z.enum(['DEPOSIT', 'FULL']),
    paidAt: dateField.nullable().optional(),
    dueDate: dateField,
    expiresAt: z.coerce
        .date()
        .refine((d) => d.getTime() > Date.now(), 'La date d’expiration doit être dans le futur')
        .nullable()
        .optional(),
})

export type CreateAuditClientInput = z.input<typeof createAuditClientSchema>

/** Une expiration passée désactiverait le lien : refusée. */
const futureDate = z.coerce.date().refine((d) => d.getTime() > Date.now(), 'La date d’expiration doit être dans le futur')

export const extendExpirationSchema = z.object({
    expiresAt: futureDate,
})
