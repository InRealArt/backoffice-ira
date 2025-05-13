import { notFound } from 'next/navigation'
import { getInvoiceById } from '../../actions'
import InvoiceViewClient from './InvoiceViewClient'

export const metadata = {
  title: 'Détail de la facture | Administration',
  description: 'Consultez les détails de la facture',
}

// Utiliser JSX au lieu de TSX pour éviter les problèmes de type
export default async function Page(props) {
  // Accéder à l'ID de la facture depuis les paramètres
  const { id } = props.params

  if (!id) {
    notFound()
  }

  const invoiceId = parseInt(id)
  if (isNaN(invoiceId)) {
    notFound()
  }
  
  const invoice = await getInvoiceById(invoiceId)
  
  if (!invoice) {
    notFound()
  }
  
  // Conversion des valeurs pour la sérialisation JSON
  const serializedInvoice = {
    ...invoice,
    subtotalPrice: String(invoice.subtotalPrice),
    vatAmount: String(invoice.vatAmount),
    totalPrice: String(invoice.totalPrice),
    vatRate: String(invoice.vatRate),
    items: invoice.items?.map(item => ({
      ...item,
      unitPrice: String(item.unitPrice),
      vatRate: String(item.vatRate),
      vatAmount: String(item.vatAmount),
      totalPrice: String(item.totalPrice),
    })) || []
  }
  
  return <InvoiceViewClient invoice={serializedInvoice} />
}
