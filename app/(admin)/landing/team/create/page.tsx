import NewTeamMemberForm from './NewTeamMemberForm'
import TeamCreateTabs from './TeamCreateTabs'

export const metadata = {
  title: 'Ajouter un membre d\'équipe | Landing',
  description: 'Ajouter un nouveau membre à l\'équipe',
}

export default function NewTeamMemberPage() {
  return (
    <TeamCreateTabs profileForm={<NewTeamMemberForm />} />
  )
} 