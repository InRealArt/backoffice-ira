'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './NftsToMintClient.module.scss'
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
    <div className={styles.productsContainer}>
      <div className={styles.productsHeader}>
        <div>
          <h1 className={styles.pageTitle}>Liste des oeuvres (à minter)</h1>
          <p className={styles.subtitle}>
            Gérez les uploads des oeuvres sur IPFS et mint des NFT
          </p>
        </div>
      </div>
      
      <div className={styles.filterSection}>
        <div className={styles.filterItem}>
          <label htmlFor="status-filter" className={styles.filterLabel}>
            Filtrer par statut:
          </label>
          <div className={styles.selectWrapper}>
            <select 
              id="status-filter" 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'all')}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="listed">Listé</option>
            </select>
          </div>
        </div>
        
        <div className={styles.filterItem}>
          <label htmlFor="smartcontract-filter" className={styles.filterLabel}>
            Smart Contract:
          </label>
          <div className={styles.selectWrapper}>
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
                      className={`${styles.clickableRow} 
                        ${isLoading ? styles.loadingRow : ''} 
                        ${loadingItemId && !isLoading ? styles.disabledRow : ''}
                        ${!product.nftResource ? styles.naStatusRow : ''}`}
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
                          {getItemStatusBadge(product.status)}
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
                          ? <NftStatusBadge status={product.nftResource.status} /> 
                          : 'N/A'
                        }
                      </td>
                      <td className={styles.hiddenMobile}>
                        <div className={styles.smartContractCell}>
                          {product.nftResource?.collection?.smartContract ? (
                            <>
                              <span className={styles.truncatedAddress}>
                                {product.nftResource.collection.smartContract.factoryAddress ? truncateAddress(product.nftResource.collection.smartContract.factoryAddress) : 'Non défini'}
                              </span>
                              &nbsp;&nbsp;
                              {getActiveBadge(product.nftResource.collection.smartContract.active)}
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