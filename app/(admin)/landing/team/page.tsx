import { getAllTeamMembers } from '@/lib/actions/team-actions'
import TeamClient from './TeamClient'

export const metadata = {
  title: 'Liste des membres de l\'équipe | Landing',
  description: 'Gérez les membres de l\'équipe affichés sur le site',
}

export default async function TeamPage() {
  const teamMembers = await getAllTeamMembers()
  return <TeamClient teamMembers={teamMembers} />
} 