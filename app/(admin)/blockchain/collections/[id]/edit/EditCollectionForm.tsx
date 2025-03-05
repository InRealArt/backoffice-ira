'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import styles from './EditCollectionForm.module.scss'
import { Artist, Factory, Collection, CollectionStatus } from '@prisma/client'
import { updateCollection } from '@/lib/actions/collection-actions'
import { formatChainName } from '@/lib/blockchain/chainUtils'

// Validation simplifiée (seulement pour contractAddress)
const formSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  addressAdmin: z.string(),
  artistId: z.string(),
  factoryId: z.string(),
  contractAddress: z.string()
    .regex(/^(pending|0x[a-fA-F0-9]{40})$/, 'Adresse de contrat invalide'),
  status: z.enum(['pending', 'confirmed', 'failed'])
})

type FormValues = z.infer<typeof formSchema>

interface CollectionWithRelations extends Collection {
  artist: Artist
  factory: Factory | null
}

interface EditCollectionFormProps {
  collection: CollectionWithRelations
  artists: Artist[]
  factories: Factory[]
}

export default function EditCollectionForm({ collection, artists, factories }: EditCollectionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection.name,
      symbol: collection.symbol,
      addressAdmin: collection.addressAdmin,
      artistId: collection.artistId.toString(),
      factoryId: collection.factoryId?.toString() || '',
      contractAddress: collection.contractAddress || '',
      status: collection.status as CollectionStatus
    }
  })
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Transmettre contractAddress et status
      const result = await updateCollection({
        id: collection.id,
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
  const currentFactory = factories.find(f => f.id === collection.factoryId)

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Nom de la collection (readonly) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Nom de la collection</label>
          <div className={styles.readOnlyField}>
            {collection.name}
          </div>
          <input type="hidden" {...register('name')} />
        </div>
        
        {/* Symbole (readonly) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Symbole</label>
          <div className={styles.readOnlyField}>
            {collection.symbol}
          </div>
          <input type="hidden" {...register('symbol')} />
        </div>
        
        {/* Artiste (readonly) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Artiste</label>
          <div className={styles.readOnlyField}>
            {currentArtist?.pseudo || 'Non spécifié'}
          </div>
          <input type="hidden" {...register('artistId')} />
        </div>
        
        {/* Factory (readonly) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Factory</label>
          <div className={styles.readOnlyField}>
            {currentFactory ? 
              `${formatChainName(currentFactory.chain)} - ${truncateAddress(currentFactory.contractAddress)}` : 
              'Non spécifiée'}
          </div>
          <input type="hidden" {...register('factoryId')} />
        </div>
        
        {/* Adresse Admin (readonly) */}
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
        
        {/* Transaction Hash (readonly) */}
        {collection.transactionHash && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Transaction Hash</label>
            <div className={styles.readOnlyField}>
              {truncateAddress(collection.transactionHash)}
            </div>
          </div>
        )}
        
        {/* Boutons d'action */}
        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={handleCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour la collection'}
          </button>
        </div>
      </form>
    </div>
  )
} 