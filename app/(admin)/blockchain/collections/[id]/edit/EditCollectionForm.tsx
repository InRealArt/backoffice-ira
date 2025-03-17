'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import styles from './EditCollectionForm.module.scss'
import { Artist, Collection, CollectionStatus, SmartContract } from '@prisma/client'
import { updateCollection, syncCollection } from '@/lib/actions/collection-actions'
import { formatChainName } from '@/lib/blockchain/chainUtils'
import { RefreshCw } from 'lucide-react'

// Validation simplifiée (seulement pour contractAddress)
const formSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  addressAdmin: z.string(),
  artistId: z.string(),
  smartContractId: z.string(),
  contractAddress: z.string()
    .regex(/^(pending|0x[a-fA-F0-9]{40})$/, 'Adresse de contrat invalide'),
  status: z.enum(['pending', 'confirmed', 'failed'])
})

type FormValues = z.infer<typeof formSchema>

interface CollectionWithRelations extends Collection {
  artist: Artist
  smartContract: SmartContract | null
}

interface EditCollectionFormProps {
  collection: CollectionWithRelations
  artists: Artist[]
  smartContracts: SmartContract[]
}

export default function EditCollectionForm({ collection, artists, smartContracts }: EditCollectionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection.name,
      symbol: collection.symbol,
      addressAdmin: collection.addressAdmin,
      artistId: collection.artistId.toString(),
      smartContractId: collection.smartContractId?.toString() || '',
      contractAddress: collection.contractAddress || '',
      status: collection.status as CollectionStatus
    }
  })
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Transmettre contractAddress et status
      const result = await updateCollection(collection.id, {
        contractAddress: data.contractAddress,
        status: data.status
      })

      if (result.success) {
        toast.success('Collection mise à jour avec succès')
        
        // Rediriger après un court délai
        setTimeout(() => {
          router.push('/blockchain/collections')
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleSync = async () => {
    if (isSyncing || collection.status !== 'pending' || !collection.transactionHash) {
      return
    }
    
    setIsSyncing(true)
    const toastIsSyncing = toast.loading('Synchronisation avec la blockchain en cours...')
    
    try {
      const result = await syncCollection(collection.id)
      
      if (result.success && result.updated) {
        toast.success('Collection synchronisée avec succès')
        toast.dismiss(toastIsSyncing)
        if (result.contractAddress) {
          setValue('contractAddress', result.contractAddress)
          setValue('status', 'confirmed')
        } else {
          setValue('status', 'failed')
        }
        setIsSyncing(false)  
        // Rafraîchir le formulaire avec les nouvelles valeurs
        router.refresh()
      } else {
        toast.error(result.message || 'Aucune mise à jour effectuée')
        toast.dismiss(toastIsSyncing)
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`)
      toast.dismiss(toastIsSyncing)
      console.error(error)
    } finally {
      setIsSyncing(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/blockchain/collections')
  }
  
  // Fonction pour tronquer l'adresse du contrat
  function truncateAddress(address: string): string {
    if (!address || address.length <= 16) return address
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }

  // Obtenir l'artiste et la factory actuels pour l'affichage
  const currentArtist = artists.find(a => a.id === collection.artistId)
  const currentSmartContract = smartContracts.find(f => f.id === collection.smartContractId)

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Nom (lecture seule) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Nom de la collection</label>
          <div className={styles.readOnlyField}>
            {collection.name}
          </div>
          <input type="hidden" {...register('name')} />
        </div>
        
        {/* Symbole (lecture seule) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Symbole</label>
          <div className={styles.readOnlyField}>
            {collection.symbol}
          </div>
          <input type="hidden" {...register('symbol')} />
        </div>
        
        {/* Artiste (lecture seule) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Artiste</label>
          <div className={styles.readOnlyField}>
            {currentArtist ? currentArtist.pseudo : 'Inconnu'}
          </div>
          <input type="hidden" {...register('artistId')} />
        </div>
        
        {/* Factory (lecture seule) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Factory</label>
          <div className={styles.readOnlyField}>
            {currentSmartContract ? 
              `${formatChainName(currentSmartContract.network)} - (Factory address) ${truncateAddress(currentSmartContract.factoryAddress)}` : 
              'Non spécifiée'}
          </div>
          <input type="hidden" {...register('smartContractId')} />
        </div>
        
        {/* Adresse Admin (lecture seule) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Adresse Admin</label>
          <div className={styles.readOnlyField}>
            {truncateAddress(collection.addressAdmin)}
          </div>
          <input type="hidden" {...register('addressAdmin')} />
        </div>
        
        {/* Adresse du contrat (éditable) */}
        <div className={styles.formGroup}>
          <label htmlFor="contractAddress" className={styles.label}>
            Adresse du contrat <span className={styles.editableLabel}>(éditable)</span>
          </label>
          <input
            type="text"
            id="contractAddress"
            className={styles.input}
            placeholder="0x... ou pending"
            {...register('contractAddress')}
          />
          {errors.contractAddress && (
            <p className={styles.errorText}>{errors.contractAddress.message}</p>
          )}
          <p className={styles.helperText}>
            Ce champ peut être modifié manuellement si l'adresse du contrat n'a pas été correctement récupérée depuis Rabby.
          </p>
        </div>
        
        {/* Statut (éditable) */}
        <div className={styles.formGroup}>
          <label htmlFor="status" className={styles.label}>
            Statut <span className={styles.editableLabel}>(éditable)</span>
          </label>
          <select
            id="status"
            className={styles.input}
            {...register('status')}
          >
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="failed">Échoué</option>
          </select>
          {errors.status && (
            <p className={styles.errorText}>{errors.status.message}</p>
          )}
          <p className={styles.helperText}>
            Ce champ peut être modifié manuellement pour refléter l'état réel de la collection.
          </p>
        </div>
        
        {/* Transaction Hash (lecture seule) avec bouton de synchronisation */}
        {collection.transactionHash && (
          <div className={styles.formGroup}>
            <div className={styles.labelWithAction}>
              <label className={styles.label}>Transaction Hash</label>
              {collection.status === 'pending' && (
                <button 
                  type="button"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={styles.syncButton}
                >
                  <RefreshCw className={`${styles.syncIcon} ${isSyncing ? styles.spinning : ''}`} />
                  Synchroniser
                </button>
              )}
            </div>
            <div className={styles.readOnlyField}>
              {truncateAddress(collection.transactionHash)}
            </div>
            {collection.status === 'pending' && (
              <p className={styles.helperText}>
                Cliquez sur "Synchroniser" pour vérifier le statut de la transaction sur la blockchain.
              </p>
            )}
          </div>
        )}
        
        {/* Boutons d'action */}
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={handleCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting || isSyncing}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isSubmitting || isSyncing}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour la collection'}
          </button>
        </div>
      </form>
    </div>
  )
} 