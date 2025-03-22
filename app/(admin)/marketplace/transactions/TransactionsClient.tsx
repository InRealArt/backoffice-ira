'use client'

import { useState, useEffect, useMemo } from 'react'
import { MarketPlaceTransaction, NftCollection, ResourceNftStatuses, SmartContract } from '@prisma/client'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import { truncateAddress } from '@/lib/blockchain/utils'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { getActiveBadge } from '@/app/components/StatusBadge'
import { Filters, FilterItem } from '@/app/components/Common/Filters'
import { StatusRow } from '@/app/components/Table'
import { formatDate } from '@/lib/utils'

// Type pour les transactions avec leurs relations
type TransactionWithRelations = MarketPlaceTransaction & {
  nftResource: {
    id: number
    name: string
    status: ResourceNftStatuses
    tokenId: number | null
    collection: {
      id: number
      name: string
      smartContractId: number | null
      smartContract?: {
        id: number
        active: boolean
        factoryAddress: string
        marketplaceAddress: string
        network: string
      } | null
    }
  }
}

interface TransactionsClientProps {
  transactions: TransactionWithRelations[]
  smartContracts: SmartContract[]
  collections: { id: number, name: string, smartContractId: number | null }[]
}

export default function TransactionsClient({ 
  transactions = [], 
  smartContracts = [],
  collections = []
}: TransactionsClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [selectedSmartContractId, setSelectedSmartContractId] = useState<number | null>(null)
  const [collectionFilter, setCollectionFilter] = useState<string>('')
  
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
  
  // Filtrage des transactions par smart contract et collection
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filtre par smart contract si sélectionné
      if (selectedSmartContractId) {
        const smartContractId = transaction.nftResource?.collection?.smartContractId;
        if (!smartContractId || smartContractId !== selectedSmartContractId) {
          return false;
        }
      }
      
      // Filtre par collection si sélectionnée
      if (collectionFilter && transaction.nftResource?.collection?.id) {
        return transaction.nftResource.collection.id.toString() === collectionFilter;
      }
      
      return true;
    });
  }, [transactions, selectedSmartContractId, collectionFilter]);

  // Extraction des collections filtrées par le smart contract sélectionné
  const filteredCollections = useMemo(() => {
    if (selectedSmartContractId) {
      return collections.filter(collection => 
        collection.smartContractId === selectedSmartContractId
      );
    }
    return collections;
  }, [collections, selectedSmartContractId]);
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Transactions Marketplace</h1>
        </div>
        <p className="page-subtitle">
          Liste des transactions effectuées sur la marketplace
        </p>
      </div>
      
      <Filters>
        <FilterItem
          id="smartContractFilter"
          label="Filtrer par smart contract:"
          value={selectedSmartContractId ? selectedSmartContractId.toString() : ''}
          onChange={(value) => {
            setSelectedSmartContractId(value ? parseInt(value) : null);
            // Réinitialiser le filtre de collection si on change de smart contract
            setCollectionFilter('');
          }}
          options={[
            { value: '', label: 'Tous les smart contracts' },
            ...smartContracts.map(smartContract => ({
              value: smartContract.id.toString(),
              label: `${smartContract.active ? '🟢 ' : '🔴 '} ${formatChainName(smartContract.network)} - ${truncateAddress(smartContract.factoryAddress)}`
            }))
          ]}
        />
        
        <FilterItem
          id="collectionFilter"
          label="Filtrer par collection:"
          value={collectionFilter}
          onChange={setCollectionFilter}
          options={[
            { value: '', label: 'Toutes les collections' },
            ...filteredCollections.map(collection => ({
              value: collection.id.toString(),
              label: collection.name
            }))
          ]}
        />
      </Filters>
      
      <div className="page-content">
        {!filteredTransactions.length ? (
          <div className="empty-state">
            <p>Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Date</th>
                  <th>NFT</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Collection</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Token ID</th>
                  <th>Fonction</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>De</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>À</th>
                  <th>Prix</th>
                  <th className={isMobile ? 'hidden-mobile' : ''}>Hash</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const smartContract = transaction.nftResource?.collection?.smartContract;
                  const isActive = smartContract?.active ?? true;
                  
                  return (
                    <StatusRow 
                      key={transaction.id} 
                      isActive={isActive}
                      colorType="info"
                    >
                      <td>{transaction.id}</td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {transaction.created_at ? formatDate(transaction.created_at.toString()) : 'N/A'}
                      </td>
                      <td>{transaction.nftResource?.name || 'N/A'}</td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {transaction.nftResource?.collection?.name || 'N/A'}
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {transaction.nftResource?.tokenId || 'N/A'}
                      </td>
                      <td>
                        <span className="function-name">{transaction.functionName || 'N/A'}</span>
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {transaction.from && (
                          <BlockchainAddress 
                            address={transaction.from} 
                            network={smartContract?.network || 'mainnet'}
                          />
                        )}
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {transaction.to && (
                          <BlockchainAddress 
                            address={transaction.to} 
                            network={smartContract?.network || 'mainnet'}
                          />
                        )}
                      </td>
                      <td>
                        {transaction.price 
                          ? `${transaction.price} ETH` 
                          : 'N/A'}
                      </td>
                      <td className={isMobile ? 'hidden-mobile' : ''}>
                        {transaction.transactionHash ? (
                          <BlockchainAddress 
                            address={transaction.transactionHash} 
                            network={smartContract?.network || 'mainnet'}
                            isTransaction
                          />
                        ) : 'N/A'}
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