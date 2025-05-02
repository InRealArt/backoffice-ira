'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Invoice, InvoiceType } from '@prisma/client'

/**
 * Récupère une facture par son ID
 */
export async function getInvoiceById(id: number): Promise<Invoice | null> {
    try {
        return await prisma.invoice.findUnique({
            where: { id },
            include: {
                items: true
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de la facture:', error)
        return null
    }
}

/**
 * Met à jour le statut de paiement d'une facture
 */
export async function updateInvoicePaymentStatus(id: number, isPaid: boolean) {
    try {
        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: {
                isPaid,
                paidAt: isPaid ? new Date() : null
            }
        })

        revalidatePath('/marketplace/invoices')
        revalidatePath(`/marketplace/invoices/${id}/view`)

        return {
            success: true,
            invoice: updatedInvoice
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de paiement:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour du statut de paiement'
        }
    }
}

/**
 * Télécharge une facture (simulation - à implémenter avec un système de génération de PDF)
 */
export async function downloadInvoice(id: number) {
    try {
        // Vérifier si la facture existe
        const invoice = await prisma.invoice.findUnique({
            where: { id }
        })

        if (!invoice) {
            return {
                success: false,
                message: 'Facture introuvable'
            }
        }

        // Dans une implémentation réelle, on générerait un PDF ici
        return {
            success: true,
            message: 'Le téléchargement de la facture est en cours de développement'
        }
    } catch (error) {
        console.error('Erreur lors du téléchargement de la facture:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors du téléchargement de la facture'
        }
    }
}

/**
 * Recherche des factures avec des filtres optionnels
 */
export async function searchInvoices(filters: {
    customerEmail?: string
    invoiceNumber?: string
    isPaid?: boolean
    startDate?: Date
    endDate?: Date
}) {
    try {
        const { customerEmail, invoiceNumber, isPaid, startDate, endDate } = filters

        // Construction des conditions de recherche
        const where: any = {}

        if (customerEmail) {
            where.customerEmail = {
                contains: customerEmail,
                mode: 'insensitive'
            }
        }

        if (invoiceNumber) {
            where.invoiceNumber = {
                contains: invoiceNumber,
                mode: 'insensitive'
            }
        }

        if (isPaid !== undefined) {
            where.isPaid = isPaid
        }

        // Filtrage par date de création
        if (startDate || endDate) {
            where.createdAt = {}

            if (startDate) {
                where.createdAt.gte = startDate
            }

            if (endDate) {
                where.createdAt.lte = endDate
            }
        }

        const invoices = await prisma.invoice.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                items: true
            }
        })

        return {
            success: true,
            invoices
        }
    } catch (error) {
        console.error('Erreur lors de la recherche des factures:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la recherche des factures',
            invoices: []
        }
    }
} 