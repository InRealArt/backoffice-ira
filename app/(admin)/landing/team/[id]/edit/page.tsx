import { notFound } from 'next/navigation'
import { getTeamMemberById } from '@/lib/actions/team-actions'
import TeamEditForm from './TeamEditForm'

export default async function EditTeamMemberPage({ params }: { params: { id: string } }) {
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier le membre d&apos;équipe</h1>
      <TeamEditForm teamMember={teamMember} />
    </div>
  )
} 