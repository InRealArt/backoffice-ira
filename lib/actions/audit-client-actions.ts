'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2/client'
import { requireAdmin } from '@/lib/auth-helpers'
import { createAuditClientSchema, extendExpirationSchema, type CreateAuditClientInput } from '@/lib/audit/schemas'
import { buildAuditUrl, defaultExpiresAt, generateAuditToken, hashAuditToken } from '@/lib/audit/token'
import type { AuditPaymentType, AuditStatus, AuditFileKind } from '@/src/generated/prisma/client'

const LIST_PATH = '/audits'
const SIGNED_URL_TTL_SECONDS = 300

/** Vue d'un audit côté admin : `tokenHash` n'est jamais renvoyé au navigateur. */
export interface AuditClientSummary {
    id: string
    createdAt: Date
    clientName: string
    clientEmail: string
    auditorName: string | null
    paymentType: AuditPaymentType
    paidAt: Date | null
    dueDate: Date
    expiresAt: Date
    revokedAt: Date | null
    status: AuditStatus
    submittedAt: Date | null
}

export interface AuditFileView {
    id: string
    kind: AuditFileKind
    filename: string
    mimeType: string
    sizeBytes: number
    createdAt: Date
}

export interface AuditClientDetail extends AuditClientSummary {
    questionnaireVersion: number
    answers: Record<string, unknown>
    consentAt: Date | null
    signatureName: string | null
    files: AuditFileView[]
}

type ActionResult<T = object> = ({ success: true } & T) | { success: false; message: string }

const summarySelect = {
    id: true,
    createdAt: true,
    clientName: true,
    clientEmail: true,
    auditorName: true,
    paymentType: true,
    paidAt: true,
    dueDate: true,
    expiresAt: true,
    revokedAt: true,
    status: true,
    submittedAt: true,
} as const

export async function getAllAuditClients(): Promise<AuditClientSummary[]> {
    await requireAdmin()

    return prisma.auditClient.findMany({
        select: summarySelect,
        orderBy: { createdAt: 'desc' },
    })
}

export async function getAuditClientById(id: string): Promise<AuditClientDetail | null> {
    await requireAdmin()

    const audit = await prisma.auditClient.findUnique({
        where: { id },
        select: {
            ...summarySelect,
            questionnaireVersion: true,
            answers: true,
            consentAt: true,
            signatureName: true,
            files: {
                select: { id: true, kind: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true },
                orderBy: { createdAt: 'asc' },
            },
        },
    })
    if (!audit) return null

    const answers =
        audit.answers && typeof audit.answers === 'object' && !Array.isArray(audit.answers)
            ? (audit.answers as Record<string, unknown>)
            : {}
    return { ...audit, answers }
}

/** Crée l'audit et renvoie le lien privé : c'est la seule fois où le jeton en clair existe. */
export async function createAuditClient(
    input: CreateAuditClientInput
): Promise<ActionResult<{ id: string; link: string }>> {
    await requireAdmin()

    const parsed = createAuditClientSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, message: parsed.error.issues[0]?.message ?? 'Données invalides' }
    }
    const data = parsed.data

    try {
        const token = generateAuditToken()
        const audit = await prisma.auditClient.create({
            data: {
                clientName: data.clientName,
                clientEmail: data.clientEmail,
                auditorName: data.auditorName || null,
                paymentType: data.paymentType,
                paidAt: data.paidAt ?? null,
                dueDate: data.dueDate,
                expiresAt: data.expiresAt ?? defaultExpiresAt(data.dueDate),
                tokenHash: hashAuditToken(token),
            },
            select: { id: true },
        })
        revalidatePath(LIST_PATH)
        return { success: true, id: audit.id, link: buildAuditUrl(token) }
    } catch {
        console.error("Erreur lors de la création de l'audit")
        return { success: false, message: "Erreur lors de la création de l'audit" }
    }
}

/** Remplace le jeton (l'ancien lien cesse de fonctionner) et lève une éventuelle révocation. */
export async function regenerateAuditLink(id: string): Promise<ActionResult<{ link: string }>> {
    await requireAdmin()

    try {
        const token = generateAuditToken()
        const current = await prisma.auditClient.findUniqueOrThrow({ where: { id }, select: { expiresAt: true } })
        await prisma.auditClient.update({
            where: { id },
            data: {
                tokenHash: hashAuditToken(token),
                revokedAt: null,
                // Un lien régénéré sur un audit expiré serait un 404 : on repousse l'expiration
                ...(current.expiresAt < new Date() ? { expiresAt: defaultExpiresAt(new Date()) } : {}),
            },
        })
        revalidatePath(LIST_PATH)
        revalidatePath(`${LIST_PATH}/${id}`)
        return { success: true, link: buildAuditUrl(token) }
    } catch {
        return { success: false, message: 'Audit introuvable ou erreur lors de la régénération' }
    }
}

export async function revokeAuditLink(id: string): Promise<ActionResult> {
    await requireAdmin()

    try {
        await prisma.auditClient.update({ where: { id }, data: { revokedAt: new Date() } })
        revalidatePath(LIST_PATH)
        revalidatePath(`${LIST_PATH}/${id}`)
        return { success: true }
    } catch {
        return { success: false, message: 'Audit introuvable ou erreur lors de la révocation' }
    }
}

export async function extendAuditExpiration(id: string, expiresAt: Date | string): Promise<ActionResult> {
    await requireAdmin()

    const parsed = extendExpirationSchema.safeParse({ expiresAt })
    if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? 'Date invalide' }

    try {
        await prisma.auditClient.update({ where: { id }, data: { expiresAt: parsed.data.expiresAt } })
        revalidatePath(LIST_PATH)
        revalidatePath(`${LIST_PATH}/${id}`)
        return { success: true }
    } catch {
        return { success: false, message: 'Audit introuvable ou erreur lors de la mise à jour' }
    }
}

/**
 * Rouvre un audit soumis : repasse en brouillon et génère un nouveau lien
 * (l'ancien est invalidé, comme prévu par la spec).
 */
export async function reopenAudit(id: string): Promise<ActionResult<{ link: string }>> {
    await requireAdmin()

    try {
        const token = generateAuditToken()
        const current = await prisma.auditClient.findUnique({ where: { id }, select: { expiresAt: true } })
        const { count } = await prisma.auditClient.updateMany({
            where: { id, status: 'SUBMITTED' },
            data: {
                status: 'DRAFT',
                submittedAt: null,
                revokedAt: null,
                tokenHash: hashAuditToken(token),
                ...(current && current.expiresAt < new Date() ? { expiresAt: defaultExpiresAt(new Date()) } : {}),
            },
        })
        if (count === 0) return { success: false, message: "Seul un audit soumis peut être rouvert" }
        revalidatePath(LIST_PATH)
        revalidatePath(`${LIST_PATH}/${id}`)
        return { success: true, link: buildAuditUrl(token) }
    } catch {
        return { success: false, message: 'Audit introuvable ou erreur lors de la réouverture' }
    }
}

/** URL signée de courte durée vers une pièce jointe (clé relue en base, jamais fournie par le client). */
export async function getAuditFileDownloadUrl(fileId: string): Promise<ActionResult<{ url: string }>> {
    await requireAdmin()

    const file = await prisma.auditFile.findUnique({
        where: { id: fileId },
        select: { r2Key: true, filename: true },
    })
    if (!file || !file.r2Key.startsWith('audits/')) {
        return { success: false, message: 'Fichier introuvable' }
    }

    try {
        const url = await getSignedUrl(
            r2Client,
            new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: file.r2Key,
                ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
            }),
            { expiresIn: SIGNED_URL_TTL_SECONDS }
        )
        return { success: true, url }
    } catch {
        return { success: false, message: 'Impossible de générer le lien de téléchargement' }
    }
}

/**
 * Suppression complète : objets R2 d'abord, puis ligne en base (fichiers en cascade).
 * Si un objet R2 ne peut pas être supprimé, rien n'est effacé en base pour permettre de réessayer.
 */
export async function deleteAuditClient(id: string): Promise<ActionResult> {
    await requireAdmin()

    const audit = await prisma.auditClient.findUnique({
        where: { id },
        select: { files: { select: { r2Key: true } } },
    })
    if (!audit) return { success: false, message: 'Audit introuvable' }

    const prefix = `audits/${id}/`
    try {
        for (const file of audit.files) {
            if (!file.r2Key.startsWith(prefix)) {
                return { success: false, message: 'Clé de fichier inattendue, suppression interrompue' }
            }
        }

        // Coupe d'abord l'accès du client : plus aucun dépôt ne peut arriver pendant le nettoyage
        await prisma.auditClient.update({ where: { id }, data: { revokedAt: new Date() } })

        // Efface tout le dossier de l'audit, y compris les objets téléversés mais jamais enregistrés en base
        let continuationToken: string | undefined
        do {
            const page = await r2Client.send(
                new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, Prefix: prefix, ContinuationToken: continuationToken })
            )
            const keys = (page.Contents ?? []).map((o) => o.Key).filter((k): k is string => !!k && k.startsWith(prefix))
            if (keys.length > 0) {
                const res = await r2Client.send(
                    new DeleteObjectsCommand({
                        Bucket: R2_BUCKET_NAME,
                        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
                    })
                )
                if (res.Errors && res.Errors.length > 0) throw new Error('Suppression R2 incomplète')
            }
            continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
        } while (continuationToken)

        await prisma.auditClient.delete({ where: { id } })
        revalidatePath(LIST_PATH)
        return { success: true }
    } catch {
        console.error("Erreur lors de la suppression de l'audit")
        return { success: false, message: "Erreur lors de la suppression de l'audit" }
    }
}
