'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { ItemStatus, ResourceNftStatuses } from '@prisma/client'
import { truncateAddress } from '@/lib/blockchain/utils'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { getItemStatusBadge, getActiveBadge } from '@/app/components/StatusBadge/StatusBadge'

interface Item {
  id: number
  status: ItemStatus
  idUser: number
  idShopify: bigint
  idNftResource: number | null
  user?: {
    email: string | null
    firstName: string | null
    lastName: string | null
  }
  nftResource?: {
    name: string
    status: ResourceNftStatuses
    collection?: {
      smartContract?: {
        active: boolean
        factoryAddress?: string
      } | null
    }
  } | null
}

interface ProductListingClientProps {
  products: Item[] | undefined
}

export default function NftsToMintClient({ products = [] }: ProductListingClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all')
  const [smartContractFilter, setSmartContractFilter] = useState('all')
  
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
  
  // Vérifier que products n'est pas undefined avant de filtrer
  const safeProducts = Array.isArray(products) ? products : []
  
  // Filtrer les produits par statut et smart contract
  const filteredProducts = safeProducts.filter(product => {
    // Filtre par statut
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    
    // Filtre par smart contract
    let matchesSmartContract = true
    if (smartContractFilter !== 'all') {
      // Vérifier si l'adresse de la factory correspond à celle sélectionnée
      const factoryAddress = product.nftResource?.collection?.smartContract?.factoryAddress
      matchesSmartContract = factoryAddress === smartContractFilter
    }
    
    return matchesStatus && matchesSmartContract
  })
  
  const handleItemClick = (itemId: number) => {
    setLoadingItemId(itemId)
    router.push(`/marketplace/nftsToMint/${itemId}/edit`)
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Liste des oeuvres (à minter)</h1>
        </div>
        <p className="page-subtitle">
          Gérez les uploads des oeuvres sur IPFS et mint des NFT
        </p>
      </div>
      
      <div className="filter-section">
        <div className="d-flex gap-md flex-wrap">
          <div className="filter-item">
            <label htmlFor="status-filter" className="filter-label">
              Filtrer par statut:
            </label>
            <div className="select-wrapper">
              <select 
                id="status-filter" 
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'all')}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="listed">Listé</option>
              </select>
            </div>
          </div>
          
          <div className="filter-item">
            <label htmlFor="smartcontract-filter" className="filter-label">
              Smart Contract:
            </label>
            <div className="select-wrapper">
              <select
                id="smartcontract-filter"
                className="filter-select"
                value={smartContractFilter}
                onChange={(e) => setSmartContractFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                {safeProducts.map((product) => {
                  const factoryAddress = product.nftResource?.collection?.smartContract?.factoryAddress
                  const isActive = product.nftResource?.collection?.smartContract?.active
                  if (factoryAddress) {
                    return (
                      <option key={factoryAddress} value={factoryAddress}>
                        {isActive ? '🟢 ' : '🔴 '} {truncateAddress(factoryAddress)}
                      </option>
                    )
                  }
                  return null
                })}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        {!safeProducts.length || filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ID Shopify</th>
                  <th className="hidden-mobile">Utilisateur</th>
                  <th>Statut</th>
                  <th className="hidden-mobile">NFT associé</th>
                  <th className="hidden-mobile">Statut NFT</th>
                  <th>Smart Contract</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLoading = loadingItemId === product.id;
                  
                  return (
                    <tr 
                      key={product.id} 
                      onClick={() => !loadingItemId && handleItemClick(product.id)}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingItemId && !isLoading ? 'disabled-row' : ''} ${!product.nftResource ? 'highlight-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {product.id}
                          </span>
                        </div>
                      </td>
                      <td>{String(product.idShopify)}</td>
                      <td className="hidden-mobile">
                        {product.user ? 
                          `${product.user.firstName || ''} ${product.user.lastName || ''} ${product.user.email ? `(${product.user.email})` : ''}`.trim() : 
                          `ID: ${product.idUser}`
                        }
                      </td>
                      <td>
                        <div className="status-badge-container">
                          {getItemStatusBadge(product.status)}
                        </div>
                      </td>
                      <td className="hidden-mobile">
                        {product.nftResource 
                          ? product.nftResource.name 
                          : product.idNftResource 
                            ? `ID: ${product.idNftResource}` 
                            : 'Non associé'
                        }
                      </td>
                      <td className="hidden-mobile">
                        {product.nftResource 
                          ? <NftStatusBadge status={product.nftResource.status} /> 
                          : 'N/A'
                        }
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {product.nftResource?.collection?.smartContract ? (
                            <>
                              <span className="text-monospace">
                                {product.nftResource.collection.smartContract.factoryAddress ? truncateAddress(product.nftResource.collection.smartContract.factoryAddress) : 'Non défini'}
                              </span>
                              {getActiveBadge(product.nftResource.collection.smartContract.active)}
                            </>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </div>
                      </td>
                    </tr>
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