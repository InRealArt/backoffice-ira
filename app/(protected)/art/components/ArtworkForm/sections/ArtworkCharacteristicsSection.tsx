'use client'

import { FormFields } from '../types'
import FormSection from '../FormSection'
import { ArtworkMedium, ArtworkStyle, ArtworkTechnique, ArtworkTheme } from '@prisma/client'
import MultiSelect from '@/app/components/Forms/MultiSelect'
import { Controller } from 'react-hook-form'

interface ArtworkCharacteristicsSectionProps extends FormFields {
  mediums?: ArtworkMedium[]
  styles?: ArtworkStyle[]
  techniques?: ArtworkTechnique[]
  themes?: ArtworkTheme[]
  isFormReadOnly?: boolean
}

function ArtworkCharacteristicsSection({ 
  register, 
  errors, 
  control, 
  setValue, 
  getValues,
  mediums = [],
  styles: artStyles = [],
  techniques = [],
  themes = [],
  isFormReadOnly = false
}: ArtworkCharacteristicsSectionProps) {
  return (
    <FormSection title="Caractéristiques artistiques" bgVariant="subtle-4">
      {/* Support/Medium - Sélection simple */}
      <div className="mb-6">
        <label htmlFor="mediumId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Support/Medium
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          id="mediumId"
          {...register("mediumId", {
            required: "Le support/medium est requis"
          })}
          className={`
            w-full px-3 py-2 rounded-lg border transition-all duration-200
            ${errors.mediumId 
              ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
            }
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
          `}
          disabled={isFormReadOnly}
        >
          <option value="">Sélectionnez un support</option>
          {mediums.map(medium => (
            <option key={medium.id} value={medium.id}>
              {medium.name}
            </option>
          ))}
        </select>
        {errors.mediumId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {String(errors.mediumId?.message)}
          </p>
        )}
      </div>

      {/* Styles - Sélection multiple */}
      <div className="mb-6">
        <Controller
          name="styleIds"
          control={control}
          rules={{ required: "Au moins un style est requis" }}
          render={({ field }) => (
            <MultiSelect
              label="Styles"
              options={artStyles.map(style => ({ id: style.id, name: style.name }))}
              value={field.value || []}
              onChange={field.onChange}
              placeholder="Sélectionnez un ou plusieurs styles"
              required
              disabled={isFormReadOnly}
              error={errors.styleIds ? String(errors.styleIds?.message) : undefined}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Techniques - Sélection multiple */}
        <div>
          <Controller
            name="techniqueIds"
            control={control}
            rules={{ required: "Au moins une technique est requise" }}
            render={({ field }) => (
              <MultiSelect
                label="Techniques"
                options={techniques.map(technique => ({ id: technique.id, name: technique.name }))}
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Sélectionnez une ou plusieurs techniques"
                required
                disabled={isFormReadOnly}
                error={errors.techniqueIds ? String(errors.techniqueIds?.message) : undefined}
              />
            )}
          />
        </div>

        {/* Thèmes - Sélection multiple */}
        <div>
          <Controller
            name="themeIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Thèmes"
                options={themes.map(theme => ({ id: theme.id, name: theme.name }))}
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Sélectionnez un ou plusieurs thèmes (optionnel)"
                disabled={isFormReadOnly}
                error={errors.themeIds ? String(errors.themeIds?.message) : undefined}
              />
            )}
          />
        </div>
      </div>
    </FormSection>
  )
}

export default ArtworkCharacteristicsSection 