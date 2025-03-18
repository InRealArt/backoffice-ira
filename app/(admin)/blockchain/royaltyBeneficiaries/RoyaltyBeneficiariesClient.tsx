'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import styles from './RoyaltyBeneficiariesClient.module.scss'
import { SmartContract } from '@prisma/client'

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
  
  // Fonction pour tronquer l'adresse
  const truncateAddress = (address: string): string => {
    if (!address) return 'Non défini'
    if (address.length <= 16) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }
  
  // Filtrage des bénéficiaires selon le smart contract sélectionné
  const filteredBeneficiaries = selectedSmartContractId
    ? royaltyBeneficiaries.filter(
        beneficiary => 
          beneficiary.nftResource?.collection?.smartContract?.id === selectedSmartContractId
      )
    : royaltyBeneficiaries
  
  // Obtenir le smart contract associé à un bénéficiaire
  const getSmartContract = (beneficiary: RoyaltyBeneficiaryWithRelations) => {
    return beneficiary.nftResource?.collection?.smartContract
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
        {filteredBeneficiaries.length === 0 ? (
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
                <th className={styles.hiddenMobile}>NFT Resource</th>
                <th className={styles.hiddenMobile}>Token ID</th>
                <th className={styles.hiddenMobile}>Collection</th>
                <th className={styles.hiddenMobile}>Smart Contract</th>
                <th className={styles.hiddenMobile}>Réseau</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeneficiaries.map((beneficiary) => {
                const smartContract = getSmartContract(beneficiary)
                return (
                  <tr key={beneficiary.id} className={styles.tableRow}>
                    <td>{beneficiary.id}</td>
                    <td>
                      <div className={styles.addressContainer}>
                        <span className={styles.address} title={beneficiary.wallet}>
                          {truncateAddress(beneficiary.wallet)}
                        </span>
                        <button
                          className={styles.copyButton}
                          onClick={(e) => copyToClipboard(beneficiary.wallet, e)}
                          title="Copier l'adresse"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td>{beneficiary.percentage}%</td>
                    <td>{beneficiary.totalPercentage}%</td>
                    <td className={styles.hiddenMobile}>
                      {beneficiary.nftResource?.name || 'Non défini'}
                    </td>
                    <td className={styles.hiddenMobile}>
                      {beneficiary.nftResource?.tokenId || 'Non défini'}
                    </td>
                    <td className={styles.hiddenMobile}>
                      {beneficiary.nftResource?.collection?.contractAddress ? (
                        <div className={styles.addressContainer}>
                          <span className={styles.address} title={beneficiary.nftResource?.collection.contractAddress}>
                            {truncateAddress(beneficiary.nftResource?.collection.contractAddress || '')}
                          </span>
                          <button
                            className={styles.copyButton}
                            onClick={(e) => beneficiary.nftResource?.collection?.contractAddress && 
                              copyToClipboard(beneficiary.nftResource.collection.contractAddress, e)}
                            title="Copier l'adresse"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        <span className={styles.noData}>Non déployée</span>
                      )}
                    </td>
                    <td className={styles.hiddenMobile}>
                      {smartContract ? (
                        <div className={styles.smartContractCell}>
                          <span className={styles.truncatedAddress}>
                            {truncateAddress(smartContract.factoryAddress)}
                          </span>
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