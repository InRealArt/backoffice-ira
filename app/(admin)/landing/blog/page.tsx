import { getAllBlogPosts } from '@/lib/actions/blog-post-actions'
import BlogPostsClient from './BlogPostsClient'

export const metadata = {
  title: 'Liste des articles de blog | Administration',
  description: 'Gérez les articles de blog',
}

export default async function BlogPostsPage() {
  

  const blogPosts = await getAllBlogPosts()

  return <BlogPostsClient blogPosts={blogPosts} />
} 