import CreateFactoryForm from "./CreateSmartContractsForm"


export const metadata = {
  title: 'Créer une factory | Blockchain',
  description: 'Ajouter un nouveau contrat factory dans le système',
}

export default function CreateFactoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ajouter une factory</h1>
      <CreateFactoryForm />
    </div>
  )
} 