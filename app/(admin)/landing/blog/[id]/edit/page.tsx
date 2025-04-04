import BlogPostForm from '../../BlogPostForm'
import { getBlogPostById } from '@/lib/actions/blog-post-actions'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Modifier un article de blog | Administration',
  description: 'Modifiez les informations d\'un article de blog',
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const blogPostId = parseInt(resolvedParams.id)
  const blogPostData = await getBlogPostById(blogPostId)

  if (!blogPostData) {
    notFound()
  }
  
  // On force le type du blogPost pour correspondre à celui attendu par BlogPostForm
  // Note: Dans un contexte de production, il vaudrait mieux adapter la fonction getBlogPostById
  // pour qu'elle retourne directement le type attendu
  const blogPost = blogPostData as any

  return <BlogPostForm blogPost={blogPost} isEditMode={true} />
} 