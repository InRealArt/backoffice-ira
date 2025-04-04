import { getAllBlogPosts } from '@/lib/actions/blog-post-actions'
import BlogPostsClient from './BlogPostsClient'

export const metadata = {
  title: 'Liste des articles de blog | Administration',
  description: 'Gérez les articles de blog',
}

export default async function BlogPostsPage() {
  
  const blogPostsData = await getAllBlogPosts()
  
  // Transformation des données pour ajouter les propriétés manquantes
  const blogPosts = blogPostsData.map(post => ({
    ...post,
    text: post.content || '',
    imageUrl: '',  // Valeur par défaut pour imageUrl
    readingTime: 3  // readingTime doit être un nombre
  }))

  return <BlogPostsClient blogPosts={blogPosts} />
} 