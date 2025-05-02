'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Address } from '@prisma/client'
import { getCountries, Country } from '@/lib/utils'


interface AddressFormProps {
  address?: Address
  defaultFirstName?: string
  defaultLastName?: string
  onSubmit: (data: {
    name: string
    firstName: string
    lastName: string
    streetAddress: string
    postalCode: string
    city: string
    country: string
    countryCode: string
    vatNumber?: string
  }) => Promise<void>
}

export default function AddressForm({ address, defaultFirstName = '', defaultLastName = '', onSubmit }: AddressFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const countries = getCountries()
  
  // Trouver le nom du pays à partir du code pays
  const findCountryName = (code: string) => {
    const country = countries.find(country => country.code === code)
    return country ? country.name : ''
  }
  
  const defaultCountryCode = address?.countryCode || 'FR'
  
  const [formData, setFormData] = useState({
    name: address?.name || '',
    firstName: address?.firstName || defaultFirstName,
    lastName: address?.lastName || defaultLastName,
    streetAddress: address?.streetAddress || '',
    postalCode: address?.postalCode || '',
    city: address?.city || '',
    country: address?.country || findCountryName(defaultCountryCode),
    countryCode: defaultCountryCode,
    vatNumber: address?.vatNumber || ''
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (name === 'countryCode') {
      // Pour le champ de sélection de pays, mettre à jour countryCode et country
      const selectedCountry = countries.find(country => country.code === value)
      
      setFormData({
        ...formData,
        countryCode: value,
        country: selectedCountry ? selectedCountry.name : ''
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      })
    }
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-group">
        <label htmlFor="name" className="form-label">Nom pour l'adresse *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ex: Adresse de facturation, Adresse du bureau, etc."
          className="form-input"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="firstName" className="form-label">Prénom *</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="lastName" className="form-label">Nom *</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="streetAddress" className="form-label">Adresse *</label>
        <input
          type="text"
          id="streetAddress"
          name="streetAddress"
          value={formData.streetAddress}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="postalCode" className="form-label">Code postal *</label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="city" className="form-label">Ville *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="countryCode" className="form-label">Pays *</label>
        <select
          id="countryCode"
          name="countryCode"
          value={formData.countryCode}
          onChange={handleChange}
          className="form-select"
          required
        >
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="vatNumber" className="form-label">Numéro de TVA (pour professionnels)</label>
        <input
          type="text"
          id="vatNumber"
          name="vatNumber"
          value={formData.vatNumber}
          onChange={handleChange}
          className="form-input"
        />
      </div>
      
      
      <div className="form-actions">
        <button
          type="button"
          onClick={() => router.push('/shopify/addresses')}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : address ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
  )
} 