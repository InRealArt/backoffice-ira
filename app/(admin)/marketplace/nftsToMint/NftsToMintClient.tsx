'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { ItemStatus, ResourceNftStatuses } from '@prisma/client'
import { truncateAddress } from '@/lib/blockchain/utils'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { getItemStatusBadge, getActiveBadge } from '@/app/components/StatusBadge'
import { Filters, FilterItem, SearchInput } from '@/app/components/Common'
import { StatusRow } from '@/app/components/Table'

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
      name?: string
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
  const [searchTerm, setSearchTerm] = useState('')
  
  // Ajout du filtre pour les collections
  const [collectionFilter, setCollectionFilter] = useState('all')
  
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
  
  // Filtrer les produits par statut, smart contract et terme de recherche
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
    
    // Filtre par collection
    let matchesCollection = true
    if (collectionFilter !== 'all') {
      const collectionName = product.nftResource?.collection?.name
      matchesCollection = collectionName === collectionFilter
    }
    
    // Filtre par recherche
    let matchesSearch = true
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim()
      
      // Recherche dans les champs pertinents
      const userName = `${product.user?.firstName || ''} ${product.user?.lastName || ''}`.toLowerCase()
      const userEmail = (product.user?.email || '').toLowerCase()
      const nftName = (product.nftResource?.name || '').toLowerCase()
      const idShopify = product.idShopify.toString()
      
      matchesSearch = 
        userName.includes(searchLower) || 
        userEmail.includes(searchLower) || 
        nftName.includes(searchLower) ||
        idShopify.includes(searchLower)
    }
    
    return matchesStatus && matchesSmartContract && matchesCollection && matchesSearch
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
      
      <Filters>
        <FilterItem
          id="status-filter" 
          label="Filtrer par statut:"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as ItemStatus | 'all')}
          options={[
            { value: 'all', label: 'Tous les statuts' },
            { value: 'pending', label: 'En attente' },
            { value: 'listed', label: 'Listé' }
          ]}
        />
          
        <FilterItem
          id="smartcontract-filter"
          label="Smart Contract:"
          value={smartContractFilter}
          onChange={(value) => setSmartContractFilter(value)}
          options={[
            { value: 'all', label: 'Tous' },
            ...safeProducts
              .filter(product => {
                const factoryAddress = product.nftResource?.collection?.smartContract?.factoryAddress
                return !!factoryAddress
              })
              .map(product => {
                const factoryAddress = product.nftResource?.collection?.smartContract?.factoryAddress || ''
                const isActive = product.nftResource?.collection?.smartContract?.active || false
                return {
                  value: factoryAddress,
                  label: `${isActive ? '🟢 ' : '🔴 '} ${truncateAddress(factoryAddress)}`
                }
              })
              .filter((option, index, self) => 
                index === self.findIndex(t => t.value === option.value)
              )
          ]}
        />
        
        <FilterItem
          id="collection-filter"
          label="Collection NFT:"
          value={collectionFilter}
          onChange={(value) => setCollectionFilter(value)}
          options={[
            { value: 'all', label: 'Toutes les collections' },
            ...safeProducts
              .filter(product => {
                const collectionName = product.nftResource?.collection?.name
                return !!collectionName
              })
              .map(product => ({
                value: product.nftResource?.collection?.name || '',
                label: product.nftResource?.collection?.name || 'Sans nom'
              }))
              .filter((option, index, self) => 
                index === self.findIndex(t => t.value === option.value)
              )
          ]}
        />
      </Filters>
      
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
                  <th className="hidden-mobile">Collection NFT</th>
                  <th>Smart Contract</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLoading = loadingItemId === product.id;
                  const smartContract = product.nftResource?.collection?.smartContract;
                  const isActive = smartContract?.active ?? true;
                  const isNftListed = product.nftResource?.status === 'LISTED';
                  const isGreenHighlight = isNftListed && isActive;
                  
                  return (
                    <StatusRow 
                      key={product.id}
                      isActive={isActive}
                      colorType="danger" 
                      onClick={() => !loadingItemId && handleItemClick(product.id)}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingItemId && !isLoading ? 'disabled-row' : ''} ${!product.nftResource ? 'highlight-row' : ''}`}
                      isSuccess={isGreenHighlight}
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
                      <td className="hidden-mobile">
                        {product.nftResource?.collection?.name 
                          ? product.nftResource.collection.name
                          : <span className="text-muted">Non définie</span>
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