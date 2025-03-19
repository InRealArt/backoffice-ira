'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SmartContract } from '@prisma/client'
import styles from './SmartContractsClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import Link from 'next/link'

interface SmartContractsClientProps {
  smartContracts: SmartContract[]
}

export default function SmartContractsClient({ smartContracts }: SmartContractsClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingContractId, setLoadingContractId] = useState<number | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
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
  
  const handleContractEdit = (contractId: number) => {
    setLoadingContractId(contractId)
    router.push(`/blockchain/smartContracts/${contractId}`)
  }
  
  const handleAddSmartContract = () => {
    router.push('/blockchain/smartContracts/create')
  }
  
  // Fonction pour copier l'adresse du contrat dans le presse-papiers
  const copyToClipboard = (address: string, event: React.MouseEvent) => {
    event.stopPropagation() // Empêche la propagation de l'événement
    navigator.clipboard.writeText(address)
      .then(() => {
        setCopiedAddress(address)
        // Réinitialiser le message après 2 secondes
        setTimeout(() => setCopiedAddress(null), 2000)
      })
      .catch(err => {
        console.error('Erreur lors de la copie :', err)
      })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Smart Contracts</h1>
        <Link href="/blockchain/smartContracts/create" className={styles.createButton}>
          Créer un smart contract
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Factory</th>
              <th>Royalties</th>
              <th>Marketplace</th>
              <th>Réseau</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {smartContracts.map((contract) => (
              <tr key={contract.id} className={styles.tableRow}>
                <td>{contract.id}</td>
                <td>
                  <BlockchainAddress
                    address={contract.factoryAddress}
                    network={contract.network}
                  />
                </td>
                <td>
                  <BlockchainAddress
                    address={contract.royaltiesAddress}
                    network={contract.network}
                  />
                </td>
                <td>
                  <BlockchainAddress
                    address={contract.marketplaceAddress}
                    network={contract.network}
                  />
                </td>
                <td>
                  <span className={styles.network}>
                    {formatChainName(contract.network)}
                  </span>
                </td>
                <td>
                  <span className={`${styles.status} ${contract.active ? styles.active : styles.inactive}`}>
                    {contract.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    {loadingContractId === contract.id ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <>
                        <button
                          className={styles.editButton}
                          onClick={() => handleContractEdit(contract.id)}
                        >
                          Éditer
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {smartContracts.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  Aucun smart contract trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {copiedAddress && (
        <div className={styles.copyToast}>
          Adresse copiée !
        </div>
      )}
    </div>
  )
} 