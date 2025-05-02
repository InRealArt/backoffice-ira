'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Invoice, InvoiceType } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { Filters, FilterItem } from '@/app/components/Common/Filters'
import { formatDate } from '@/lib/utils'
import { StatusRow } from '@/app/components/Table'

// Type pour les factures avec leurs éléments
type InvoiceWithItems = Invoice & {
  items: {
    id: number
    invoiceId: number
    title: string
    description: string | null
    isNft: boolean
    artworkId: number
    unitPrice: string
    vatRate: string
    vatAmount: string
    totalPrice: string
  }[]
}

interface InvoicesClientProps {
  invoices: InvoiceWithItems[]
}

export default function InvoicesClient({ invoices = [] }: InvoicesClientProps) {
  const router = useRouter()
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [paidFilter, setPaidFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  
  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Vérifier au chargement
    checkIfMobile()
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  // Gérer le clic sur une facture
  const handleInvoiceClick = (invoiceId: number) => {
    if (loadingInvoiceId !== null) return
    
    setLoadingInvoiceId(invoiceId)
    router.push(`/marketplace/invoices/${invoiceId}/view`)
  }
  
  // Filtrer les factures selon les critères
  const filteredInvoices = invoices.filter(invoice => {
    if (paidFilter !== '') {
      const isPaid = paidFilter === 'true'
      if (invoice.isPaid !== isPaid) return false
    }
    
    if (typeFilter !== '') {
      if (invoice.invoiceType !== typeFilter) return false
    }
    
    return true
  })
  
  // Obtenir le statut stylisé pour la facture
  const getInvoiceStatusBadge = (isPaid: boolean, type: InvoiceType) => {
    if (type === 'CREDIT_NOTE') return 'badge-warning'
    return isPaid ? 'badge-success' : 'badge-danger'
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
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Factures</h1>
        </div>
        <p className="page-subtitle">
          Liste des factures émises sur la marketplace
        </p>
      </div>
      
      <Filters>
        <FilterItem
          id="paidFilter"
          label="Statut de paiement:"
          value={paidFilter}
          onChange={setPaidFilter}
          options={[
            { value: '', label: 'Tous les statuts' },
            { value: 'true', label: 'Payée' },
            { value: 'false', label: 'Non payée' }
          ]}
        />
        
        <FilterItem
          id="typeFilter"
          label="Type de document:"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: '', label: 'Tous les types' },
            { value: 'INVOICE', label: 'Facture' },
            { value: 'CREDIT_NOTE', label: 'Avoir' },
            { value: 'PROFORMA', label: 'Proforma' },
            { value: 'RECEIPT', label: 'Reçu' }
          ]}
        />
      </Filters>
      
      <div className="page-content">
        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <p>Aucune facture trouvée</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Date</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Client</th>
                  <th>Montant</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Commande</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const isLoading = loadingInvoiceId === invoice.id
                  
                  return (
                    <StatusRow 
                      key={invoice.id} 
                      isActive={true}
                      colorType={invoice.isPaid ? 'success' : 'danger'}
                      onClick={() => !loadingInvoiceId && handleInvoiceClick(invoice.id)}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingInvoiceId && !isLoading ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {formatDate(invoice.createdAt.toString())}
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {invoice.customerName} {invoice.customerEmail ? `(${invoice.customerEmail})` : ''}
                      </td>
                      <td>
                        {parseFloat(invoice.totalPrice).toFixed(2)} €
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {getInvoiceTypeLabel(invoice.invoiceType)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getInvoiceStatusBadge(invoice.isPaid, invoice.invoiceType)}`}>
                          {invoice.isPaid ? 'Payée' : 'Non payée'}
                        </span>
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {invoice.orderNumber}
                      </td>
                    </StatusRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 