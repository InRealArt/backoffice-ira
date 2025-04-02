import BlogPostForm from '../BlogPostForm'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Créer un article de blog | Administration',
  description: 'Créez un nouvel article de blog',
}

export default async function CreateBlogPostPage() {
  return <BlogPostForm isEditMode={false} />
} 