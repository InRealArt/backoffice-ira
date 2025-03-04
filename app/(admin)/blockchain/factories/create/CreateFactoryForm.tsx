'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import styles from './CreateFactoryForm.module.scss'
import { Chain } from '@prisma/client'
import { createFactory } from '@/lib/actions/factory-actions'

// Schéma de validation
const formSchema = z.object({
  contractAddress: z.string()
    .min(1, 'L\'adresse du contrat est requise')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
  chain: z.enum(['eth_mainnet', 'sepolia', 'polygon_mainnet', 'polygon_testnet'], {
    required_error: 'Veuillez sélectionner un réseau',
  }),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateFactoryForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractAddress: '',
      chain: 'sepolia',
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const result = await createFactory(data)

      if (result.success) {
        toast.success('Factory ajoutée avec succès')
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/blockchain/factories')
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
    router.push('/blockchain/factories')
  }
  
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
        <div className={styles.formCard}>
          <div className={styles.cardContent}>
            <div className={styles.formGroup}>
              <label htmlFor="contractAddress" className={styles.formLabel}>
                Adresse du contrat
              </label>
              <input
                id="contractAddress"
                type="text"
                {...register('contractAddress')}
                className={`${styles.formInput} ${errors.contractAddress ? styles.formInputError : ''}`}
                placeholder="0x..."
              />
              {errors.contractAddress && (
                <p className={styles.formError}>{errors.contractAddress.message}</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="chain" className={styles.formLabel}>
                Réseau blockchain
              </label>
              <select
                id="chain"
                {...register('chain')}
                className={`${styles.formSelect} ${errors.chain ? styles.formInputError : ''}`}
              >
                <option value="eth_mainnet">Ethereum Mainnet</option>
                <option value="sepolia">Sepolia</option>
                <option value="polygon_mainnet">Polygon Mainnet</option>
                <option value="polygon_testnet">Polygon Mumbai</option>
              </select>
              {errors.chain && (
                <p className={styles.formError}>{errors.chain.message}</p>
              )}
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