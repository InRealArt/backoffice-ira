'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Invoice, InvoiceType, InvoiceItem } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { updateInvoicePaymentStatus, downloadInvoice } from '../../actions'
import { toast } from 'react-hot-toast'

// Types pour les factures sérialisées
type SerializedInvoiceItem = Omit<InvoiceItem, 'unitPrice' | 'vatRate' | 'vatAmount' | 'totalPrice'> & {
  unitPrice: string
  vatRate: string
  vatAmount: string
  totalPrice: string
}

type SerializedInvoice = Omit<Invoice, 'subtotalPrice' | 'vatAmount' | 'totalPrice' | 'vatRate'> & {
  subtotalPrice: string
  vatAmount: string
  totalPrice: string
  vatRate: string
  items: SerializedInvoiceItem[]
}

interface InvoiceViewClientProps {
  invoice: SerializedInvoice
}

export default function InvoiceViewClient({ invoice }: InvoiceViewClientProps) {
  const router = useRouter()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Formater la date avec l'heure
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Traduire le type de facture
  const getInvoiceTypeLabel = (type: InvoiceType) => {
    switch (type) {
      case 'INVOICE': return 'Facture'
      case 'CREDIT_NOTE': return 'Avoir'
      case 'PROFORMA': return 'Proforma'
      case 'RECEIPT': return 'Reçu'
      default: return type
    }
  }
  
  // Gérer le retour à la liste
  const handleBackToList = () => {
    router.push('/marketplace/invoices')
  }
  
  // Mettre à jour le statut de paiement
  const handleUpdatePaymentStatus = async () => {
    setIsUpdatingStatus(true)
    
    try {
      const result = await updateInvoicePaymentStatus(invoice.id, !invoice.isPaid)
      
      if (result.success) {
        toast.success(`La facture a été marquée comme ${!invoice.isPaid ? 'payée' : 'non payée'}`)
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      toast.error('Une erreur est survenue lors de la mise à jour')
    } finally {
      setIsUpdatingStatus(false)
    }
  }
  
  // Télécharger la facture
  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      const result = await downloadInvoice(invoice.id)
      
      if (result.success) {
        toast.success(result.message || 'Téléchargement initié')
      } else {
        toast.error(result.message || 'Une erreur est survenue lors du téléchargement')
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      toast.error('Une erreur est survenue lors du téléchargement')
    } finally {
      setIsDownloading(false)
    }
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <button 
            className="btn btn-secondary btn-small"
            onClick={handleBackToList}
          >
            ← Retour à la liste
          </button>
          <h1 className="page-title ml-4">
            {getInvoiceTypeLabel(invoice.invoiceType)} n°{invoice.invoiceNumber}
          </h1>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary btn-small mr-2"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <LoadingSpinner size="small" message="Téléchargement..." inline />
            ) : (
              'Télécharger le PDF'
            )}
          </button>
          <button
            className={`btn ${invoice.isPaid ? 'btn-warning' : 'btn-success'} btn-small`}
            onClick={handleUpdatePaymentStatus}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <LoadingSpinner size="small" message="Mise à jour..." inline />
            ) : (
              invoice.isPaid ? 'Marquer comme non payée' : 'Marquer comme payée'
            )}
          </button>
        </div>
      </div>
      
      <div className="page-content">
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="card-title">Informations générales</h2>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Numéro de facture:</span>
                <span className="info-value">{invoice.invoiceNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date d'émission:</span>
                <span className="info-value">{formatFullDate(invoice.createdAt.toString())}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type de document:</span>
                <span className="info-value">{getInvoiceTypeLabel(invoice.invoiceType)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Statut de paiement:</span>
                <span className={`badge ${invoice.isPaid ? 'badge-success' : 'badge-danger'}`}>
                  {invoice.isPaid ? 'Payée' : 'Non payée'}
                </span>
              </div>
              {invoice.paidAt && (
                <div className="info-item">
                  <span className="info-label">Date de paiement:</span>
                  <span className="info-value">{formatFullDate(invoice.paidAt.toString())}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Méthode de paiement:</span>
                <span className="info-value">{invoice.paymentMethod}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Numéro de commande:</span>
                <span className="info-value">{invoice.orderNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date de commande:</span>
                <span className="info-value">{formatDate(invoice.orderDate.toString())}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-group">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Informations client</h2>
            </div>
            <div className="card-content">
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Nom:</span>
                  <span className="info-value">{invoice.customerName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{invoice.customerEmail}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">ID client:</span>
                  <span className="info-value">{invoice.customerId}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Adresse de facturation</h2>
            </div>
            <div className="card-content">
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Nom complet:</span>
                  <span className="info-value">{invoice.billingAddressFullname}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Adresse:</span>
                  <span className="info-value">{invoice.billingAddressStreet}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ville:</span>
                  <span className="info-value">{invoice.billingAddressCity}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Code postal:</span>
                  <span className="info-value">{invoice.billingAddressPostCode}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Pays:</span>
                  <span className="info-value">{invoice.billingAddressCountry}</span>
                </div>
                {invoice.billingAddressVatNumber && (
                  <div className="info-item">
                    <span className="info-label">N° TVA:</span>
                    <span className="info-value">{invoice.billingAddressVatNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Informations vendeur</h2>
            </div>
            <div className="card-content">
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Nom:</span>
                  <span className="info-value">{invoice.sellerName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Adresse:</span>
                  <span className="info-value">{invoice.sellerAddress}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{invoice.sellerEmail}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">SIRET:</span>
                  <span className="info-value">{invoice.sellerSiret}</span>
                </div>
                {invoice.sellerVatNumber && (
                  <div className="info-item">
                    <span className="info-label">N° TVA:</span>
                    <span className="info-value">{invoice.sellerVatNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="card mt-4">
          <div className="card-header">
            <h2 className="card-title">Articles facturés</h2>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Prix unitaire HT</th>
                    <th>Taux TVA</th>
                    <th>Montant TVA</th>
                    <th>Prix TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.isNft ? 'NFT' : 'Physique'}</td>
                      <td>{parseFloat(String(item.unitPrice)).toFixed(2)} €</td>
                      <td>{parseFloat(String(item.vatRate)).toFixed(2)} %</td>
                      <td>{parseFloat(String(item.vatAmount)).toFixed(2)} €</td>
                      <td>{parseFloat(String(item.totalPrice)).toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>Total</strong></td>
                    <td><strong>{parseFloat(String(invoice.subtotalPrice)).toFixed(2)} €</strong></td>
                    <td><strong>{parseFloat(String(invoice.vatRate)).toFixed(2)} %</strong></td>
                    <td><strong>{parseFloat(String(invoice.vatAmount)).toFixed(2)} €</strong></td>
                    <td><strong>{parseFloat(String(invoice.totalPrice)).toFixed(2)} €</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        
        <div className="card mt-4">
          <div className="card-header">
            <h2 className="card-title">Mentions légales</h2>
          </div>
          <div className="card-content">
            <div className="info-text">
              <p>{invoice.legalMentions}</p>
            </div>
          </div>
        </div>
        
        <div className="card mt-4">
          <div className="card-header">
            <h2 className="card-title">Conditions de paiement</h2>
          </div>
          <div className="card-content">
            <div className="info-text">
              <p>{invoice.paymentTerms}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}