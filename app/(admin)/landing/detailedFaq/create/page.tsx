// Force re-compile
import CreateDetailedFaqForm from './CreateDetailedFaqForm'

export const metadata = {
  title: 'Créer une FAQ détaillée | Administration',
  description: 'Créer une nouvelle FAQ détaillée sur le site',
}

export default async function CreateDetailedFaqPage() {
  return <CreateDetailedFaqForm />
} 