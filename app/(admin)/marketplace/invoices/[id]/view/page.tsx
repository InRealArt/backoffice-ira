import { notFound } from 'next/navigation'
import { getInvoiceById } from '../../actions'
import InvoiceViewClient from './InvoiceViewClient'

export const metadata = {
  title: 'Détail de la facture | Administration',
  description: 'Consultez les détails de la facture',
}

export default async function InvoiceViewPage({ params }: { params: { id: string } }) {
  const invoiceId = parseInt(params.id)
  
  if (isNaN(invoiceId)) {
    notFound()
  }
  
  const invoice = await getInvoiceById(invoiceId)
  
  if (!invoice) {
    notFound()
  }
  
  // Conversion des valeurs Decimal pour la sérialisation
  const serializedInvoice = {
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
  }
  
  return <InvoiceViewClient invoice={serializedInvoice as any} />
} 