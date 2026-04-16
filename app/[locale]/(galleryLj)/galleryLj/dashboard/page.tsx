import { GalleryLjDashboard } from '@/app/components/Dashboard/GalleryLjDashboard'

export const metadata = {
  title: 'Dashboard Galerie LJ | Administration',
  description: 'Tableau de bord de la galerie LJ',
}

export default function GalleryLjDashboardPage() {
  return (
    <div className="page-container">
      <GalleryLjDashboard />
    </div>
  )
}
