// Force re-compile
import CreateDetailedGlossaryForm from './CreateDetailedGlossaryForm'

export const metadata = {
  title: 'Créer un Glossaire détaillé | Administration',
  description: 'Créer un nouveau Glossaire détaillé sur le site',
}

export default async function CreateDetailedGlossaryPage() {
  return <CreateDetailedGlossaryForm />
} 