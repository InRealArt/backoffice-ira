import NewTeamMemberForm from './NewTeamMemberForm'

export const metadata = {
  title: 'Ajouter un membre d\'équipe | Landing',
  description: 'Ajouter un nouveau membre à l\'équipe',
}

export default function NewTeamMemberPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ajouter un membre d&apos;équipe</h1>
      <NewTeamMemberForm />
    </div>
  )
} 