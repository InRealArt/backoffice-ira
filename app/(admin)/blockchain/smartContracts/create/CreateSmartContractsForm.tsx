'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/app/components/Toast/ToastContext'
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
  const { success, error } = useToast()
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
        success('Smart contract ajouté avec succès')

        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/blockchain/smartContracts')
          router.refresh()
        }, 1000)
      } else {
        error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      error('Une erreur est survenue lors de la création')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/blockchain/smartContracts')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Créer un Smart Contract</h1>
        </div>
        <p className="page-subtitle">
          Enregistrez un nouveau smart contract pour le déploiement de collections NFT
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="factoryAddress" className="form-label">
                Adresse du contrat Factory
              </label>
              <input
                id="factoryAddress"
                type="text"
                {...register('factoryAddress')}
                className={`form-input ${errors.factoryAddress ? 'input-error' : ''}`}
                placeholder="0x..."
              />
              {errors.factoryAddress && (
                <p className="form-error">{errors.factoryAddress.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="royaltiesAddress" className="form-label">
                Adresse du contrat Royalties (Proxy)
              </label>
              <input
                id="royaltiesAddress"
                type="text"
                {...register('royaltiesAddress')}
                className={`form-input ${errors.royaltiesAddress ? 'input-error' : ''}`}
                placeholder="0x..."
              />
              {errors.royaltiesAddress && (
                <p className="form-error">{errors.royaltiesAddress.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="marketplaceAddress" className="form-label">
                Adresse du contrat Marketplace (Proxy)
              </label>
              <input
                id="marketplaceAddress"
                type="text"
                {...register('marketplaceAddress')}
                className={`form-input ${errors.marketplaceAddress ? 'input-error' : ''}`}
                placeholder="0x..."
              />
              {errors.marketplaceAddress && (
                <p className="form-error">{errors.marketplaceAddress.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="network" className="form-label">
                Réseau blockchain
              </label>
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
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  {...register('active')}
                  className="form-checkbox"
                />
                Actif
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
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
            {isSubmitting ? 'Création en cours...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  )
} 