import { prisma } from '@/lib/prisma'
import InvoicesClient from './InvoicesClient'
import { Invoice, InvoiceItem } from '@prisma/client'

export const metadata = {
  title: 'Liste des factures | Administration',
  description: 'Gérez les factures émises sur la marketplace',
}

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  let invoices: (Invoice & { items: InvoiceItem[] })[] = []
  
  try {
    invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: true,
      },
    }) || []

    // Conversion des valeurs Decimal pour la sérialisation
    const serializedInvoices = invoices.map(invoice => ({
      ...invoice,
      subtotalPrice: invoice.subtotalPrice.toString(),
      vatAmount: invoice.vatAmount.toString(),
      totalPrice: invoice.totalPrice.toString(),
      vatRate: invoice.vatRate.toString(),
      items: invoice.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice.toString(),
        vatRate: item.vatRate.toString(),
        vatAmount: item.vatAmount.toString(),
        totalPrice: item.totalPrice.toString(),
      }))
    }))
    
    return <InvoicesClient invoices={serializedInvoices as any} />
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error)
    return <InvoicesClient invoices={[]} />
  }
} 