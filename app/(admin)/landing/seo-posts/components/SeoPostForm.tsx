'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SeoCategory, SeoPost } from '@prisma/client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Accordion, AccordionItem } from '@/app/components/Accordion'
import SelectField from '@/app/components/Forms/SelectField'
import InputField from '@/app/components/Forms/InputField'
import TextareaField from '@/app/components/Forms/TextareaField'
import { createSeoPost, updateSeoPost } from '@/lib/actions/seo-post-actions'
import { generateSlug } from '@/lib/utils'
import { toast } from 'react-hot-toast'

// Schéma de validation
const formSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  categoryId: z.string().min(1, 'La catégorie est requise'),
  metaDescription: z.string().min(1, 'La méta-description est requise'),
  metaKeywords: z.string().optional(),
  slug: z.string().min(1, 'Le slug est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  excerpt: z.string().optional(),
  author: z.string().min(1, 'L\'auteur est requis'),
  authorLink: z.string().optional(),
  estimatedReadTime: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  pinned: z.boolean().optional(),
  mainImageUrl: z.string().optional(),
  mainImageAlt: z.string().optional(),
  mainImageCaption: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SeoPostFormProps {
  categories: SeoCategory[]
  seoPost?: SeoPost | null
  isEditing?: boolean
}

// Définition des sections d'accordéon pour la gestion des erreurs
enum AccordionSections {
  CATEGORY = 'category',
  METADATA = 'metadata'
}

// Mappage des champs de formulaire aux sections d'accordéon
const fieldToAccordionMap: Record<string, AccordionSections> = {
  categoryId: AccordionSections.CATEGORY,
  title: AccordionSections.METADATA,
  slug: AccordionSections.METADATA,
  excerpt: AccordionSections.METADATA
}

export default function SeoPostForm({ 
  categories, 
  seoPost, 
  isEditing = false 
}: SeoPostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedSlug, setGeneratedSlug] = useState('')
  
  // État pour suivre quels accordéons sont ouverts
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(true)

  const defaultValues: Partial<FormValues> = {
    title: seoPost?.title || '',
    categoryId: seoPost?.categoryId.toString() || '',
    metaDescription: seoPost?.metaDescription || '',
    metaKeywords: seoPost?.metaKeywords?.join(', ') || '',
    slug: seoPost?.slug || '',
    content: seoPost?.content || '',
    excerpt: seoPost?.excerpt || '',
    author: seoPost?.author || '',
    authorLink: seoPost?.authorLink || '',
    estimatedReadTime: seoPost?.estimatedReadTime?.toString() || '',
    status: seoPost?.status || 'DRAFT',
    pinned: seoPost?.pinned || false,
    mainImageUrl: seoPost?.mainImageUrl || '',
    mainImageAlt: seoPost?.mainImageAlt || '',
    mainImageCaption: seoPost?.mainImageCaption || '',
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const watchedValues = {
    categoryId: watch('categoryId'),
    title: watch('title'),
  }

  // Génération automatique du slug à partir du titre
  useEffect(() => {
    if (watchedValues.title) {
      const slug = generateSlug(watchedValues.title)
      setGeneratedSlug(slug)
      setValue('slug', slug)
    }
  }, [watchedValues.title, setValue])
  
  // Effet pour ouvrir automatiquement les accordéons contenant des erreurs
  useEffect(() => {
    if (isSubmitted && Object.keys(errors).length > 0) {
      let hasCategoryErrors = false
      let hasMetadataErrors = false
      
      // Vérifier quelles sections ont des erreurs
      Object.keys(errors).forEach(fieldName => {
        const section = fieldToAccordionMap[fieldName]
        if (section === AccordionSections.CATEGORY) {
          hasCategoryErrors = true
        } else if (section === AccordionSections.METADATA) {
          hasMetadataErrors = true
        }
      })
      
      // Ouvrir les accordéons avec des erreurs
      if (hasCategoryErrors) {
        setCategoryOpen(true)
      }
      
      if (hasMetadataErrors) {
        setMetadataOpen(true)
      }
    }
  }, [errors, isSubmitted])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Formatage des données
      const formattedData = {
        ...data,
        categoryId: parseInt(data.categoryId),
        estimatedReadTime: data.estimatedReadTime ? parseInt(data.estimatedReadTime) : null,
        metaKeywords: data.metaKeywords ? data.metaKeywords.split(',').map(k => k.trim()) : [],
      }
      
      let result
      
      if (isEditing && seoPost?.id) {
        // Mise à jour
        result = await updateSeoPost(seoPost.id, formattedData)
      } else {
        // Création
        result = await createSeoPost(formattedData as any)
      }
      
      if (result.success) {
        toast.success(isEditing ? 'Article mis à jour avec succès' : 'Article créé avec succès')
        
        // Redirection
        setTimeout(() => {
          router.push('/landing/seo-posts')
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = categories.map(category => ({
    value: category.id.toString(),
    label: category.name
  }))

  const handleCancel = () => {
    router.push('/landing/seo-posts')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      <Accordion>
        <AccordionItem 
          title="Catégorie" 
          isOpen={categoryOpen}
          onOpenChange={setCategoryOpen}
        >
          <SelectField
            id="category"
            name="categoryId"
            label="Catégorie de l'article"
            value={watchedValues.categoryId}
            onChange={(e) => setValue('categoryId', e.target.value)}
            options={categoryOptions}
            error={errors.categoryId?.message}
            required={true}
            placeholder="Sélectionner une catégorie"
            showErrorsOnlyAfterSubmit={false}
          />
        </AccordionItem>

        <AccordionItem 
          title="Méta-data Article" 
          isOpen={metadataOpen}
          onOpenChange={setMetadataOpen}
        >
          <InputField
            id="title"
            name="title"
            label="Titre de l'article"
            register={register}
            error={errors.title?.message}
            required={true}
            placeholder="Entrez le titre de l'article"
            showErrorsOnlyAfterSubmit={false}
          />
          
          <InputField
            id="slug"
            name="slug"
            label="Slug (URL de l'article)"
            register={register}
            error={errors.slug?.message}
            required={true}
            disabled={true}
            value={generatedSlug}
            className="bg-gray-100"
            showErrorsOnlyAfterSubmit={false}
          />
          
          <TextareaField
            id="excerpt"
            name="excerpt"
            label="Extrait"
            register={register}
            error={errors.excerpt?.message}
            placeholder="Un court résumé de l'article"
            rows={3}
            showErrorsOnlyAfterSubmit={false}
          />
        </AccordionItem>
        
      </Accordion>
      
      <div className="form-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="secondary-button"
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-medium"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (isEditing ? 'Mise à jour...' : 'Création...') 
            : (isEditing ? 'Mettre à jour' : 'Créer')}
        </button>
      </div>
    </form>
  )
} 