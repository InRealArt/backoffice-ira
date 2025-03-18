'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './NftsToMintClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { ItemStatus, ResourceNftStatuses } from '@prisma/client'

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
  
  // Fonction pour obtenir le badge en fonction du statut
  const getStatusBadge = (status: ItemStatus) => {
    switch(status) {
      case 'created':
        return <span className={`${styles.statusBadge} ${styles.createdBadge}`}>Créé</span>
      case 'pending':
        return <span className={`${styles.statusBadge} ${styles.pendingBadge}`}>En attente</span>
      case 'minted':
        return <span className={`${styles.statusBadge} ${styles.mintedBadge}`}>Minté</span>
      case 'listed':
        return <span className={`${styles.statusBadge} ${styles.listedBadge}`}>Listé</span>
      default:
        return <span className={`${styles.statusBadge} ${styles.defaultBadge}`}>{status}</span>
    }
  }
  
  // Fonction pour obtenir le badge en fonction du statut de la ressource NFT
  const getNftResourceStatusBadge = (nftResource: { status: ResourceNftStatuses } | null) => {
    if (!nftResource) return null

    const status = nftResource.status
    
    // Orange pour UPLOADIPFS, UPLOADCERTIFICATE, et UPLOADMETADATA
    if (['UPLOADIPFS', 'UPLOADCERTIFICATE', 'UPLOADMETADATA'].includes(status)) {
      return <span className={`${styles.statusBadge} ${styles.uploadBadge}`}>{status}</span>
    }
    
    // Jaune pour MINED
    if (status === 'MINED') {
      return <span className={`${styles.statusBadge} ${styles.minedBadge}`}>{status}</span>
    }
    
    // Vert pour LISTED
    if (status === 'LISTED') {
      return <span className={`${styles.statusBadge} ${styles.listedBadge}`}>{status}</span>
    }
    
    // Défaut pour les autres statuts
    return <span className={`${styles.statusBadge} ${styles.defaultBadge}`}>{status}</span>
  }
  
  // Fonction pour tronquer l'adresse du contrat
  function truncateAddress(address: string | undefined): string {
    if (!address) return 'Non défini'
    if (address.length <= 16) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }
  
  return (
    <div className={styles.productsContainer}>
      <div className={styles.productsHeader}>
        <div>
          <h1 className={styles.pageTitle}>Liste des oeuvres (à minter)</h1>
          <p className={styles.subtitle}>
            Gérez les uploads des oeuvres sur IPFS et mint des NFT
          </p>
        </div>
        
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="status-filter" className={styles.filterLabel}>
              Filtrer par statut:
            </label>
            <select 
              id="status-filter" 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'all')}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="minted">Minté</option>
              <option value="listed">Listé</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="smartcontract-filter" className={styles.filterLabel}>
              Smart Contract:
            </label>
            <select
              id="smartcontract-filter"
              className={styles.filterSelect}
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
      
      <div className={styles.productsContent}>
        {!safeProducts.length || filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ID Shopify</th>
                  <th className={styles.hiddenMobile}>Utilisateur</th>
                  <th>Statut</th>
                  <th className={styles.hiddenMobile}>NFT associé</th>
                  <th className={styles.hiddenMobile}>Statut NFT</th>
                  <th>Smart Contract (Factory address)</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLoading = loadingItemId === product.id
                  console.log('ID product :', product.id)
                  console.log('Factory Address:', product.nftResource)
                  return (
                    <tr 
                      key={product.id} 
                      onClick={() => !loadingItemId && handleItemClick(product.id)}
                      className={`${styles.clickableRow} ${isLoading ? styles.loadingRow : ''} ${loadingItemId && !isLoading ? styles.disabledRow : ''}`}
                    >
                      <td>
                        <div className={styles.idCell}>
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? styles.loadingText : ''}>
                            {product.id}
                          </span>
                        </div>
                      </td>
                      <td>{String(product.idShopify)}</td>
                      <td className={styles.hiddenMobile}>
                        {product.user ? 
                          `${product.user.firstName || ''} ${product.user.lastName || ''} ${product.user.email ? `(${product.user.email})` : ''}`.trim() : 
                          `ID: ${product.idUser}`
                        }
                      </td>
                      <td>
                        <div className={styles.statusCell}>
                          {getStatusBadge(product.status)}
                        </div>
                      </td>
                      <td className={styles.hiddenMobile}>
                        {product.nftResource 
                          ? product.nftResource.name 
                          : product.idNftResource 
                            ? `ID: ${product.idNftResource}` 
                            : 'Non associé'
                        }
                      </td>
                      <td className={styles.hiddenMobile}>
                        {product.nftResource 
                          ? getNftResourceStatusBadge(product.nftResource) 
                          : 'N/A'
                        }
                      </td>
                      <td className={styles.hiddenMobile}>
                        <div className={styles.smartContractCell}>
                          {product.nftResource?.collection?.smartContract ? (
                            <>
                              <span className={styles.truncatedAddress}>
                                {truncateAddress(product.nftResource.collection.smartContract.factoryAddress)}
                              </span>
                              &nbsp;&nbsp;
                              <span className={`${styles.statusBadge} ${product.nftResource.collection.smartContract.active 
                                ? styles.activeBadge 
                                : styles.inactiveBadge}`}>
                                {product.nftResource.collection.smartContract.active ? 'Actif' : 'Inactif'}
                              </span>
                            </>
                          ) : (
                            'N/A'
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