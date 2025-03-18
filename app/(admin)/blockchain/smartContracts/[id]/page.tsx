import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditSmartContractForm from './EditSmartContractForm'
import React from 'react'

export const metadata = {
  title: 'Édition du smart contract | Blockchain',
  description: 'Modifier les informations du smart contract',
}

type ParamsType = { id: string }

export default async function EditSmartContractPage({
  params,
}: {
  params: ParamsType
}) {
  
  const { id } = await params


  const smartContract = await prisma.smartContract.findUnique({
    where: {
      id: parseInt(id),
    },
  })

  if (!smartContract) {
    notFound()
  }

  return <EditSmartContractForm smartContract={smartContract} />
} 