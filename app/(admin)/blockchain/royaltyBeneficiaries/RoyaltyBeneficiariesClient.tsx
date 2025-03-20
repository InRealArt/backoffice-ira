'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import styles from './RoyaltyBeneficiariesClient.module.scss'
import { SmartContract } from '@prisma/client'
import { truncateAddress } from '@/lib/blockchain/utils'

// Types pour les relations imbriquées
type NftCollection = {
  id: number
  name: string
  symbol: string
  smartContract: SmartContract | null
  contractAddress?: string
}

type NftResource = {
  id: number
  name: string
  tokenId?: number
  collection: NftCollection
}

type RoyaltyBeneficiaryWithRelations = {
  id: number
  wallet: string
  percentage: number
  totalPercentage: number
  txHash?: string
  nftResourceId: number
  nftResource?: NftResource
}

interface RoyaltyBeneficiariesClientProps {
  royaltyBeneficiaries: RoyaltyBeneficiaryWithRelations[]
  smartContracts: SmartContract[]
}

export default function RoyaltyBeneficiariesClient({ 
  royaltyBeneficiaries = [], 
  smartContracts = [] 
}: RoyaltyBeneficiariesClientProps) {
  // Debug: afficher exactement ce qui est reçu
  console.log('Type de royaltyBeneficiaries:', typeof royaltyBeneficiaries, Array.isArray(royaltyBeneficiaries))
  console.log('Longueur:', royaltyBeneficiaries?.length)
  console.log('Premier élément:', royaltyBeneficiaries?.[0])

  const [isMobile, setIsMobile] = useState(false)
  const [selectedSmartContractId, setSelectedSmartContractId] = useState<number | null>(null)
  
  // Détection du mode mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  // Filtrage des bénéficiaries comme dans CollectionsClient
  const filteredBeneficiaries = selectedSmartContractId
    ? (Array.isArray(royaltyBeneficiaries) 
       ? royaltyBeneficiaries.filter(beneficiary => 
           beneficiary?.nftResource?.collection?.smartContract?.id === selectedSmartContractId
         )
       : [])
    : (Array.isArray(royaltyBeneficiaries) ? royaltyBeneficiaries : [])
  
  console.log('Bénéficiaires filtrés:', filteredBeneficiaries?.length, filteredBeneficiaries?.[0])
  
  // Obtenir le smart contract associé à un bénéficiaire
  const getSmartContract = (beneficiary: RoyaltyBeneficiaryWithRelations) => {
    return beneficiary?.nftResource?.collection?.smartContract
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Bénéficiaires de Royalties</h1>
      </div>
      
      <div className={styles.filterSection}>
        <div className={styles.filterItem}>
          <label htmlFor="smartContractFilter" className={styles.filterLabel}>
            Filtrer par smart contract:
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="smartContractFilter"
              className={styles.filterSelect}
              value={selectedSmartContractId || ''}
              onChange={(e) => setSelectedSmartContractId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Tous les smart contracts</option>
              {smartContracts.map(smartContract => (
                <option key={smartContract.id} value={smartContract.id}>
                  {smartContract.active ? '🟢 ' : '🔴 '} {formatChainName(smartContract.network)} - {truncateAddress(smartContract.factoryAddress)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        {!Array.isArray(filteredBeneficiaries) || filteredBeneficiaries.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun bénéficiaire de royalties trouvé.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Bénéficiaire</th>
                <th>Part (%)</th>
                <th>% total du prix du NFT</th>
                <th className={styles.hiddenMobile}>Transaction Hash</th>
                <th className={styles.hiddenMobile}>NFT Resource</th>
                <th className={styles.hiddenMobile}>Token ID</th>
                <th className={styles.hiddenMobile}>Collection</th>
                <th className={styles.hiddenMobile}>Factory Address</th>
                <th className={styles.hiddenMobile}>Réseau</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeneficiaries.map((beneficiary) => {
                const smartContract = getSmartContract(beneficiary)
                return (
                  <tr key={beneficiary?.id} className={styles.tableRow}>
                    <td>{beneficiary?.id}</td>
                    <td>
                      <BlockchainAddress 
                        address={beneficiary?.wallet} 
                        network={smartContract?.network || 'sepolia'} 
                      />
                    </td>
                    <td>{beneficiary?.percentage}%</td>
                    <td>{beneficiary?.totalPercentage}%</td>
                    <td className={styles.hiddenMobile}>
                      {beneficiary?.txHash ? (
                        <BlockchainAddress 
                          address={beneficiary.txHash} 
                          network={smartContract?.network || 'sepolia'} 
                          isTransaction={true}
                          showExplorerLink={true}
                        />
                      ) : (
                        <span className={styles.noData}>Non défini</span>
                      )}
                    </td>
                    <td className={styles.hiddenMobile}>
                      {beneficiary?.nftResource?.name || 'Non défini'}
                    </td>
                    <td className={styles.hiddenMobile}>
                      {beneficiary?.nftResource?.tokenId || 'Non défini'}
                    </td>
                    <td className={styles.hiddenMobile}>
                      {beneficiary?.nftResource?.collection?.contractAddress ? (
                        <BlockchainAddress 
                          address={beneficiary.nftResource.collection.contractAddress} 
                          network={smartContract?.network || 'sepolia'} 
                          showExplorerLink={true}
                        />
                      ) : (
                        <span className={styles.noData}>Non déployée</span>
                      )}
                    </td>
                    <td className={styles.hiddenMobile}>
                      {smartContract ? (
                        <div className={styles.smartContractCell}>
                          <BlockchainAddress 
                            address={smartContract.factoryAddress} 
                            network={smartContract.network} 
                            showExplorerLink={true}
                          />
                          <span className={`${styles.statusBadge} ${smartContract.active 
                            ? styles.activeBadge 
                            : styles.inactiveBadge}`}>
                            {smartContract.active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.noData}>Aucun</span>
                      )}
                    </td>
                    <td className={styles.hiddenMobile}>
                      {smartContract ? (
                        <span className={styles.network}>
                          {formatChainName(smartContract.network)}
                        </span>
                      ) : (
                        <span className={styles.noData}>-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
} 