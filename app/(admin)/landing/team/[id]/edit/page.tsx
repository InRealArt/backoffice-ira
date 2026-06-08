import { notFound } from 'next/navigation'
import { getTeamMemberById } from '@/lib/actions/team-actions'
import TeamEditForm from './TeamEditForm'
import TeamEditTabs from './TeamEditTabs'

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const memberId = parseInt(id)

  if (isNaN(memberId)) {
    notFound()
  }

  const teamMember = await getTeamMemberById(memberId)

  if (!teamMember) {
    notFound()
  }

  return (
    <TeamEditTabs
      memberName={`${teamMember.firstName} ${teamMember.lastName}`}
      profileForm={<TeamEditForm teamMember={teamMember} />}
    />
  )
} 