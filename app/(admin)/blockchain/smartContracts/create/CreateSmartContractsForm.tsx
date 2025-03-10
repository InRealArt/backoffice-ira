'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import styles from './CreateSmartContractsForm.module.scss'
import { NetworkType } from '@prisma/client'
import { createSmartContracts } from '@/lib/actions/smartContract-actions'

// Schéma de validation
const formSchema = z.object({
  factoryAddress: z.string()
    .min(1, 'L\'adresse du contrat factory est requise')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
  royaltiesAddress: z.string()
    .min(1, 'L\'adresse du contrat de royalties est requise')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
  marketplaceAddress: z.string()
    .min(1, 'L\'adresse du contrat marketplace est requise')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
  network: z.enum(['mainnet', 'sepolia', 'polygon', 'polygonAmoy', 'arbitrum', 'base', 'sepoliaBase'], {
    required_error: 'Veuillez sélectionner un réseau',
  }),
  active: z.boolean().default(true)
})

type FormValues = z.infer<typeof formSchema>

export default function CreateSmartContractsForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      factoryAddress: '',
      royaltiesAddress: '',
      marketplaceAddress: '',
      network: 'sepolia',
      active: true
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const result = await createSmartContracts(data)

      if (result.success) {
        toast.success('Smart contract ajouté avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/blockchain/smartContracts')
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de la création')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/blockchain/smartContracts')
  }
  
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <div className={styles.formCard}>
          <div className={styles.cardContent}>
            <div className={styles.formGroup}>
              <label htmlFor="factoryAddress" className={styles.formLabel}>
                Adresse du contrat Factory
              </label>
              <input
                id="factoryAddress"
                type="text"
                {...register('factoryAddress')}
                className={`${styles.formInput} ${errors.factoryAddress ? styles.formInputError : ''}`}
                placeholder="0x..."
              />
              {errors.factoryAddress && (
                <p className={styles.formError}>{errors.factoryAddress.message}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="royaltiesAddress" className={styles.formLabel}>
                Adresse du contrat Royalties
              </label>
              <input
                id="royaltiesAddress"
                type="text"
                {...register('royaltiesAddress')}
                className={`${styles.formInput} ${errors.royaltiesAddress ? styles.formInputError : ''}`}
                placeholder="0x..."
              />
              {errors.royaltiesAddress && (
                <p className={styles.formError}>{errors.royaltiesAddress.message}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="marketplaceAddress" className={styles.formLabel}>
                Adresse du contrat Marketplace
              </label>
              <input
                id="marketplaceAddress"
                type="text"
                {...register('marketplaceAddress')}
                className={`${styles.formInput} ${errors.marketplaceAddress ? styles.formInputError : ''}`}
                placeholder="0x..."
              />
              {errors.marketplaceAddress && (
                <p className={styles.formError}>{errors.marketplaceAddress.message}</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="network" className={styles.formLabel}>
                Réseau blockchain
              </label>
              <select
                id="network"
                {...register('network')}
                className={`${styles.formSelect} ${errors.network ? styles.formInputError : ''}`}
              >
                <option value="mainnet">Ethereum Mainnet</option>
                <option value="sepolia">Sepolia</option>
                <option value="polygon">Polygon</option>
                <option value="polygonAmoy">Polygon Amoy</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="base">Base</option>
                <option value="sepoliaBase">Sepolia Base</option>
              </select>
              {errors.network && (
                <p className={styles.formError}>{errors.network.message}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <input
                  type="checkbox"
                  {...register('active')}
                  className={styles.formCheckbox}
                />
                Actif
              </label>
            </div>
          </div>
        </div>
        
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
            {isSubmitting ? 'Création en cours...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  )
} 