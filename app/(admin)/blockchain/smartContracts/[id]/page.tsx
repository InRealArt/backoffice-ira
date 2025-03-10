import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditSmartContractForm from './EditSmartContractForm'


export const metadata = {
  title: 'Édition du smart contract | Blockchain',
  description: 'Modifier les informations du smart contract',
}

export default async function EditSmartContractPage({
  params,
}: {
  params: { id: string }
}) {
  const smartContract = await prisma.smartContract.findUnique({
    where: {
      id: parseInt(params.id),
    },
  })

  if (!smartContract) {
    notFound()
  }

  return <EditSmartContractForm smartContract={smartContract} />
} 