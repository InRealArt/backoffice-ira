import BlogPostForm from '../../BlogPostForm'
import { getBlogPostById } from '@/lib/actions/blog-post-actions'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Modifier un article de blog | Administration',
  description: 'Modifiez les informations d\'un article de blog',
}

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  
  const blogPostId = parseInt(params.id)
  const blogPost = await getBlogPostById(blogPostId)

  if (!blogPost) {
    notFound()
  }

  return <BlogPostForm blogPost={blogPost} isEditMode={true} />
} 