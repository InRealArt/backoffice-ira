'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { SmartContract } from '@prisma/client'
import styles from './EditSmartContractForm.module.scss'
import { updateSmartContract } from '@/lib/actions/smartContract-actions'

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
  active: z.boolean()
})

type FormValues = z.infer<typeof formSchema>

interface EditSmartContractFormProps {
  smartContract: SmartContract
}

export default function EditSmartContractForm({ smartContract }: EditSmartContractFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      factoryAddress: smartContract.factoryAddress,
      royaltiesAddress: smartContract.royaltiesAddress,
      marketplaceAddress: smartContract.marketplaceAddress,
      network: smartContract.network,
      active: smartContract.active
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = await updateSmartContract(smartContract.id, data)

      if (result.success) {
        toast.success('Smart contract mis à jour avec succès')
        router.push('/blockchain/smartContracts')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error) {
      toast.error('Une erreur est survenue lors de la mise à jour')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Édition du smart contract</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="factoryAddress">Adresse Factory</label>
          <input
            type="text"
            id="factoryAddress"
            {...register('factoryAddress')}
            className={errors.factoryAddress ? styles.error : ''}
          />
          {errors.factoryAddress && (
            <span className={styles.errorMessage}>{errors.factoryAddress.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="royaltiesAddress">Adresse Royalties</label>
          <input
            type="text"
            id="royaltiesAddress"
            {...register('royaltiesAddress')}
            className={errors.royaltiesAddress ? styles.error : ''}
          />
          {errors.royaltiesAddress && (
            <span className={styles.errorMessage}>{errors.royaltiesAddress.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="marketplaceAddress">Adresse Marketplace</label>
          <input
            type="text"
            id="marketplaceAddress"
            {...register('marketplaceAddress')}
            className={errors.marketplaceAddress ? styles.error : ''}
          />
          {errors.marketplaceAddress && (
            <span className={styles.errorMessage}>{errors.marketplaceAddress.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="network">Réseau</label>
          <select
            id="network"
            {...register('network')}
            className={errors.network ? styles.error : ''}
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
            <span className={styles.errorMessage}>{errors.network.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              {...register('active')}
            />
            Actif
          </label>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  )
} 