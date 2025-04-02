'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { BlogPost } from '@prisma/client'
import { createBlogPost, updateBlogPost } from '@/lib/actions/blog-post-actions'
import RichTextEditor from '@/app/components/Forms/RichTextEditor'
import { TagInput } from '@/app/components/Tag/TagInput'
import { useRichTextEditor } from '@/app/hooks/useRichTextEditor'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'

// Composant pour la miniature de l'image
function ImageThumbnail({ url }: { url: string }) {
  return (
    <div className="inline-flex items-center">
      <div className="relative w-6 h-6 mr-1">
        <Image
          src={url}
          alt="Miniature"
          width={96}
          height={96}
          className="object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <span className="text-xs text-gray-500">✓</span>
    </div>
  )
}

// Schéma de validation avec Zod
const blogPostSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  text: z.string().min(1, 'Le contenu de l\'article est requis'),
  imageUrl: z.string().min(1, 'Une image est requise'),
  tags: z.array(z.string())
})

type BlogPostFormData = z.infer<typeof blogPostSchema>

interface BlogPostFormProps {
  blogPost?: BlogPost | null
  isEditMode?: boolean
}

export default function BlogPostForm({ blogPost, isEditMode = false }: BlogPostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>(blogPost?.imageUrl || '')
  const [imagePreview, setImagePreview] = useState<string>(blogPost?.imageUrl || '')
  const [tags, setTags] = useState<string[]>(blogPost?.tags ? JSON.parse(blogPost.tags as string) : [])
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: blogPost?.title || '',
      text: blogPost?.text || '',
      imageUrl: blogPost?.imageUrl || '',
      tags: blogPost?.tags ? JSON.parse(blogPost.tags as string) : []
    }
  })

  // Hook personnalisé pour l'éditeur de texte riche
  const richTextEditor = useRichTextEditor<BlogPostFormData>('text', setValue, watch)

  // Surveiller les changements d'URL d'image
  useEffect(() => {
    if (imageUrl) {
      setValue('imageUrl', imageUrl)
    }
  }, [imageUrl, setValue])

  // Surveiller les changements de tags
  useEffect(() => {
    setValue('tags', tags)
  }, [tags, setValue])

  const onSubmit = async (data: BlogPostFormData) => {
    setIsSubmitting(true)
    
    try {
      const tagsJson = JSON.stringify(data.tags)
      const readingTime = Math.ceil(data.text.length / 1500) // Calcul automatique du temps de lecture
      
      if (isEditMode && blogPost) {
        // Mode édition
        const result = await updateBlogPost(blogPost.id, {
          title: data.title,
          text: data.text,
          imageUrl: data.imageUrl,
          readingTime,
          tags: tagsJson
        })
        
        if (result.success) {
          toast.success('Article de blog mis à jour avec succès')
          router.push('/landing/blog')
        } else {
          toast.error(result.message || 'Une erreur est survenue lors de la mise à jour')
        }
      } else {
        // Mode création
        const result = await createBlogPost({
          title: data.title,
          text: data.text,
          imageUrl: data.imageUrl,
          readingTime,
          tags: tagsJson
        })
        
        if (result.success) {
          toast.success('Article de blog créé avec succès')
          router.push('/landing/blog')
        } else {
          toast.error(result.message || 'Une erreur est survenue lors de la création')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/landing/blog')
  }

  const handleImageUpload = (url: string) => {
    setImageUrl(url)
  }

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags)
  }

  const title = isEditMode ? 'Modifier l\'article de blog' : 'Créer un nouvel article de blog'
  const submitButtonText = isEditMode ? 'Mettre à jour' : 'Créer'
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">
          {isEditMode ? 'Modifiez les informations de l\'article' : 'Créez un nouvel article de blog'}
        </p>
      </div>
      
      <div className="page-content">
        <form onSubmit={handleSubmit(onSubmit)} className="form-container">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Titre de l'article <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                {...register('title', { required: 'Le titre est requis' })}
              />
              {errors.title && (
                <p className="error-message">{errors.title.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Tags
              </label>
              <TagInput 
                value={tags}
                onChange={setTags}
                placeholder="Ajouter des tags..."
                maxTags={10}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Image principale <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                {...register('imageUrl', {
                  onChange: (e) => setImagePreview(e.target.value)
                })}
                className={`form-input ${errors.imageUrl ? 'input-error' : ''}`}
                placeholder="https://example.com/image.jpg"
                disabled={isSubmitting}
              />
              {errors.imageUrl && (
                <p className="error-message">Une image est requise</p>
              )}
              {imagePreview && (
                <div className="mt-1">
                  <ImageThumbnail url={imagePreview} />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="text" className="form-label">
                Contenu de l'article <span className="text-danger">*</span>
              </label>
              <div className="form-field">
                <RichTextEditor
                  value={richTextEditor.value}
                  onChange={richTextEditor.onChange}
                />
              </div>
              {errors.text && (
                <p className="error-message">{errors.text.message}</p>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary btn-medium"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" message="" inline />
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 