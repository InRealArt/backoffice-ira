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
import TagInput from '@/app/components/Forms/TagInput'
import DatePickerField from '@/app/components/Forms/DatePickerField'
import BlogContentEditor from '@/app/components/BlogEditor/BlogContentEditor'
import { BlogContent } from '@/app/components/BlogEditor/types'
import { SEOAssistantButton, SEOAssistantModal, FormData } from '@/app/components/SEOAssistant'
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
  blogContent: z.any().optional(), // Contenu structuré du blog
  excerpt: z.string().optional(),
  author: z.string().min(1, 'L\'auteur est requis'),
  authorLink: z.string().optional(),
  estimatedReadTime: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  pinned: z.boolean().optional(),
  mainImageUrl: z.string().optional(),
  mainImageAlt: z.string().optional(),
  mainImageCaption: z.string().optional(),
  creationDate: z.date().optional(),
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
  METADATA = 'metadata',
  TAGS = 'tags',
  HEADER = 'header',
  MAIN_IMAGE = 'main_image',
  CONTENT = 'content'
}

// Mappage des champs de formulaire aux sections d'accordéon
const fieldToAccordionMap: Record<string, AccordionSections> = {
  categoryId: AccordionSections.CATEGORY,
  title: AccordionSections.METADATA,
  slug: AccordionSections.METADATA,
  excerpt: AccordionSections.MAIN_IMAGE,
  metaKeywords: AccordionSections.TAGS,
  author: AccordionSections.HEADER,
  authorLink: AccordionSections.HEADER,
  creationDate: AccordionSections.HEADER,
  mainImageUrl: AccordionSections.MAIN_IMAGE,
  mainImageAlt: AccordionSections.MAIN_IMAGE,
  mainImageCaption: AccordionSections.MAIN_IMAGE,
  content: AccordionSections.CONTENT
}

export default function SeoPostForm({ 
  categories, 
  seoPost, 
  isEditing = false 
}: SeoPostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedSlug, setGeneratedSlug] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [blogContent, setBlogContent] = useState<BlogContent>([])
  
  // État pour le SEO Assistant
  const [isSEOAssistantOpen, setIsSEOAssistantOpen] = useState(false)
  
  // État pour suivre quels accordéons sont ouverts
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [headerOpen, setHeaderOpen] = useState(false)
  const [mainImageOpen, setMainImageOpen] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)

  // Initialisation des données en mode édition
  useEffect(() => {
    if (seoPost) {
      // Initialiser les tags depuis metaKeywords qui contient maintenant directement le tableau
      if (seoPost.metaKeywords && Array.isArray(seoPost.metaKeywords)) {
        setTags(seoPost.metaKeywords)
      }
      
      // Initialiser le contenu du blog
      if (seoPost.content) {
        try {
          const parsedContent = JSON.parse(seoPost.content)
          if (Array.isArray(parsedContent)) {
            setBlogContent(parsedContent)
          }
        } catch (error) {
          console.log('Le contenu existant n\'est pas au format JSON attendu')
          setBlogContent([])
        }
      }
    }
  }, [seoPost])

  // Parsing du contenu existant s'il y en a (gardé pour compatibilité)
  useEffect(() => {
    if (seoPost?.content) {
      try {
        // Essayez de parser le contenu JSON s'il existe
        const parsedContent = JSON.parse(seoPost.content)
        if (Array.isArray(parsedContent)) {
          setBlogContent(parsedContent)
        }
      } catch (error) {
        // En cas d'erreur, le contenu n'est probablement pas au format JSON attendu
        console.log('Le contenu existant n\'est pas au format JSON attendu')
      }
    }
  }, [seoPost])

  const defaultValues: Partial<FormValues> = {
    title: seoPost?.title || '',
    categoryId: seoPost?.categoryId.toString() || '',
    metaDescription: seoPost?.metaDescription || '',
    metaKeywords: '', // On laisse vide car géré par useState
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
    creationDate: seoPost?.createdAt || new Date(),
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    watch,
    setValue,
    getValues,
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
  
  // Mettre à jour le champ metaKeywords lorsque les tags changent
  useEffect(() => {
    setValue('metaKeywords', tags.join(', '))
  }, [tags, setValue])
  
  // Effet pour ouvrir automatiquement les accordéons contenant des erreurs
  useEffect(() => {
    if (isSubmitted && Object.keys(errors).length > 0) {
      let hasCategoryErrors = false
      let hasMetadataErrors = false
      let hasTagsErrors = false
      let hasHeaderErrors = false
      let hasMainImageErrors = false
      let hasContentErrors = false
      
      // Vérifier quelles sections ont des erreurs
      Object.keys(errors).forEach(fieldName => {
        const section = fieldToAccordionMap[fieldName]
        if (section === AccordionSections.CATEGORY) {
          hasCategoryErrors = true
        } else if (section === AccordionSections.METADATA) {
          hasMetadataErrors = true
        } else if (section === AccordionSections.TAGS) {
          hasTagsErrors = true
        } else if (section === AccordionSections.HEADER) {
          hasHeaderErrors = true
        } else if (section === AccordionSections.MAIN_IMAGE) {
          hasMainImageErrors = true
        } else if (section === AccordionSections.CONTENT) {
          hasContentErrors = true
        }
      })
      
      // Ouvrir les accordéons avec des erreurs
      if (hasCategoryErrors) {
        setCategoryOpen(true)
      }
      
      if (hasMetadataErrors) {
        setMetadataOpen(true)
      }
      
      if (hasTagsErrors) {
        setTagsOpen(true)
      }
      
      if (hasHeaderErrors) {
        setHeaderOpen(true)
      }
      
      if (hasMainImageErrors) {
        setMainImageOpen(true)
      }
      
      if (hasContentErrors) {
        setContentOpen(true)
      }
    }
  }, [errors, isSubmitted])

  // Gérer les changements dans l'éditeur de contenu
  const handleBlogContentChange = (newContent: BlogContent) => {
    setBlogContent(newContent)
    // Convertir en JSON et mettre à jour le champ content du formulaire
    setValue('content', JSON.stringify(newContent))
  }

  // Fonction pour préparer les données du formulaire pour le SEO Assistant
  const prepareFormDataForSEOAssistant = useCallback((): FormData => {
    const currentValues = getValues()
    
    return {
      title: currentValues.title || '',
      metaDescription: currentValues.metaDescription || '',
      metaKeywords: tags.join(', '),
      tags: tags, // Ajouter le tableau de tags directement
      slug: currentValues.slug || '',
      excerpt: currentValues.excerpt || '',
      author: currentValues.author || '',
      authorLink: currentValues.authorLink || '',
      creationDate: currentValues.creationDate || new Date(),
      mainImageUrl: currentValues.mainImageUrl || '',
      mainImageAlt: currentValues.mainImageAlt || '',
      mainImageCaption: currentValues.mainImageCaption || '',
      content: currentValues.content || '',
      blogContent: blogContent
    }
  }, [getValues, tags, blogContent])

  // Ouvrir le SEO Assistant
  const openSEOAssistant = () => {
    setIsSEOAssistantOpen(true)
  }

  // Fermer le SEO Assistant
  const closeSEOAssistant = () => {
    setIsSEOAssistantOpen(false)
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Formatage des données
      const formattedData = {
        ...data,
        categoryId: parseInt(data.categoryId),
        estimatedReadTime: data.estimatedReadTime ? parseInt(data.estimatedReadTime) : null,
        metaKeywords: tags, // Utiliser directement le tableau de tags
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
    <>
      {/* SEO Assistant Button */}
      <SEOAssistantButton onClick={openSEOAssistant} />
      
      {/* SEO Assistant Modal */}
      <SEOAssistantModal 
        isOpen={isSEOAssistantOpen}
        onClose={closeSEOAssistant}
        formData={prepareFormDataForSEOAssistant()}
      />
      
      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <Accordion spaced={true}>
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
              id="metaDescription"
              name="metaDescription"
              label="Méta-description (description SEO)"
              register={register}
              error={errors.metaDescription?.message}
              required={true}
              placeholder="Description qui apparaîtra dans les résultats de recherche"
              rows={3}
              showErrorsOnlyAfterSubmit={false}
            />
          </AccordionItem>
          
          <AccordionItem
            title="Tags"
            isOpen={tagsOpen}
            onOpenChange={setTagsOpen}
          >
            <TagInput 
              tags={tags} 
              onChange={setTags}
              placeholder="Ajouter un tag et appuyer sur Entrée"
              maxTags={10}
              label="Tags de l'article"
              error={errors.metaKeywords?.message}
              width="100%"
            />
            <input 
              type="hidden" 
              {...register('metaKeywords')} 
            />
          </AccordionItem>
          
          <AccordionItem
            title="Article Header"
            isOpen={headerOpen}
            onOpenChange={setHeaderOpen}
          >
            <InputField
              id="author"
              name="author"
              label="Auteur de l'article"
              register={register}
              error={errors.author?.message}
              required={true}
              placeholder="Nom de l'auteur"
              showErrorsOnlyAfterSubmit={false}
            />
            
            <InputField
              id="authorLink"
              name="authorLink"
              label="Lien vers le profil de l'auteur"
              register={register}
              error={errors.authorLink?.message}
              placeholder="https://exemple.com/profil-auteur"
              showErrorsOnlyAfterSubmit={false}
            />
            
            <DatePickerField
              id="creationDate"
              name="creationDate"
              label="Date de création"
              value={watch('creationDate')}
              onChange={(date) => setValue('creationDate', date)}
              error={errors.creationDate?.message}
              showErrorsOnlyAfterSubmit={false}
            />
          </AccordionItem>
          
          <AccordionItem
            title="Main image and introduction"
            isOpen={mainImageOpen}
            onOpenChange={setMainImageOpen}
          >
            <TextareaField
              id="excerpt"
              name="excerpt"
              label="Introduction de l'article"
              register={register}
              error={errors.excerpt?.message}
              placeholder="Un court résumé ou introduction de l'article"
              rows={3}
              showErrorsOnlyAfterSubmit={false}
            />
            
            <InputField
              id="mainImageUrl"
              name="mainImageUrl"
              label="URL de l'image principale"
              register={register}
              error={errors.mainImageUrl?.message}
              placeholder="https://exemple.com/image.jpg"
              showErrorsOnlyAfterSubmit={false}
            />
            
            <InputField
              id="mainImageAlt"
              name="mainImageAlt"
              label="Texte alternatif de l'image"
              register={register}
              error={errors.mainImageAlt?.message}
              placeholder="Description de l'image pour l'accessibilité"
              showErrorsOnlyAfterSubmit={false}
            />
            
            <InputField
              id="mainImageCaption"
              name="mainImageCaption"
              label="Légende de l'image"
              register={register}
              error={errors.mainImageCaption?.message}
              placeholder="Légende affichée sous l'image"
              showErrorsOnlyAfterSubmit={false}
            />
          </AccordionItem>
          
          <AccordionItem
            title="Contenu principal"
            isOpen={contentOpen}
            onOpenChange={setContentOpen}
          >
            <BlogContentEditor 
              initialContent={blogContent}
              onChange={handleBlogContentChange}
            />
            <input 
              type="hidden" 
              {...register('content')} 
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
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
    </>
  )
} 