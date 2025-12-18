'use client'

import { PricingOptionProps } from './types'

export default function PricingOption({ 
  id, 
  label, 
  register, 
  priceFieldId, 
  priceFieldRegister, 
  errors, 
  isChecked 
}: PricingOptionProps) {
  return (
    <div className="flex-1 min-w-[250px] border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800 transition-all duration-200 shadow-sm relative overflow-hidden hover:border-gray-300 hover:shadow-md">
      <div>
        <input 
          type="checkbox" 
          id={id} 
          {...register(id)} 
          className="mr-3 w-4 h-4"
        />
        <label htmlFor={id} className="font-semibold text-lg text-gray-900 dark:text-white">{label}</label>
      </div>
      
      {isChecked && (
        <div className="mt-4">
          <label htmlFor={priceFieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" data-required={true}>
            Prix HT
          </label>
          <input
            id={priceFieldId}
            type="number"
            {...priceFieldRegister}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${errors[priceFieldId] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
            placeholder="Prix HT en euros"
          />
          {errors[priceFieldId] && <span className="block mt-1 text-sm text-red-600 dark:text-red-400">{String(errors[priceFieldId]?.message || "Le prix est requis")}</span>}
        </div>
      )}
    </div>
  )
} 