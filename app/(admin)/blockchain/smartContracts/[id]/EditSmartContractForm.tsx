'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/app/components/Toast/ToastContext'
import { SmartContract } from '@prisma/client'
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
  const { success, error } = useToast()
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
        success('Smart contract mis à jour avec succès')
        router.push('/blockchain/smartContracts')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      error('Une erreur est survenue lors de la mise à jour')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="edit-form-container">
      <div className="page-header">
        <h1 className="page-title">Édition du smart contract</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="edit-form">
        <div className="form-group">
          <label htmlFor="factoryAddress" className="form-label">Adresse Factory</label>
          <input
            type="text"
            id="factoryAddress"
            {...register('factoryAddress')}
            className={`form-input ${errors.factoryAddress ? 'input-error' : ''}`}
          />
          {errors.factoryAddress && (
            <p className="form-error">{errors.factoryAddress.message}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="royaltiesAddress" className="form-label">Adresse Royalties (Proxy)</label>
          <input
            type="text"
            id="royaltiesAddress"
            {...register('royaltiesAddress')}
            className={`form-input ${errors.royaltiesAddress ? 'input-error' : ''}`}
          />
          {errors.royaltiesAddress && (
            <p className="form-error">{errors.royaltiesAddress.message}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="marketplaceAddress" className="form-label">Adresse Marketplace (Proxy)</label>
          <input
            type="text"
            id="marketplaceAddress"
            {...register('marketplaceAddress')}
            className={`form-input ${errors.marketplaceAddress ? 'input-error' : ''}`}
          />
          {errors.marketplaceAddress && (
            <p className="form-error">{errors.marketplaceAddress.message}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="network" className="form-label">Réseau</label>
          <select
            id="network"
            {...register('network')}
            className={`form-select ${errors.network ? 'input-error' : ''}`}
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
            <p className="form-error">{errors.network.message}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              {...register('active')}
              className="form-checkbox"
            />
            <span>Actif</span>
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  )
} 