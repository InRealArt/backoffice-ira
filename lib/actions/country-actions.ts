'use server'

import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export interface CountryRecord {
    code: string
    name: string
}

export async function getAllCountries(): Promise<CountryRecord[]> {
    await requireAdmin()
    const countries = await prisma.country.findMany({
        orderBy: { name: 'asc' }
    })
    return countries.map(c => ({ code: c.code, name: c.name }))
}


