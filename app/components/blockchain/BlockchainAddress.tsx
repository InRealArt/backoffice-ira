'use client'

import { getBlockExplorerUrl } from '@/lib/blockchain/explorerUtils'

type BlockchainAddressProps = {
  address: string
  network?: string
  isTransaction?: boolean
  showExplorerLink?: boolean
  label?: string
  className?: string
}

export default function BlockchainAddress({
  address,
  network = 'sepolia',
  isTransaction = false,
  showExplorerLink = false,
  label,
  className
}: BlockchainAddressProps) {
  // Fonction pour tronquer l'adresse
  const truncateAddress = (address: string): string => {
    if (!address) return 'Non défini'
    if (address.length <= 16) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }
  
  // Fonction pour copier l'adresse dans le presse-papier
  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Adresse copiée dans le presse-papier')
      })
      .catch(err => {
        console.error('Erreur lors de la copie :', err)
      })
  }
  
  // Obtenir l'URL de l'explorateur
  const getExplorerUrl = (address: string, network: string, isTransaction: boolean): string => {
    if (!address) return '#'
    const url = getBlockExplorerUrl(network, address)
    return isTransaction ? url.replace('/address/', '/tx/') : url
  }
  
  if (!address) {
    return <span className="address-no-data">Non défini</span>
  }
  
  return (
    <div className={`blockchain-address ${className || ''}`}>
      {label && <span className="address-label">{label}</span>}
      <span className="address-text" title={address}>
        {truncateAddress(address)}
      </span>
      
      {showExplorerLink ? (
        <a
          className="address-action-button"
          href={getExplorerUrl(address, network, isTransaction)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`Voir ${isTransaction ? 'la transaction' : 'l\'adresse'} dans l'explorateur`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      ) : (
        <button
          className="address-action-button"
          onClick={(e) => copyToClipboard(address, e)}
          title="Copier l'adresse"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      )}
    </div>
  )
} 