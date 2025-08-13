'use server'

import { prisma } from '@/lib/prisma'

export interface CountryRecord {
    code: string
    name: string
}

export async function getAllCountries(): Promise<CountryRecord[]> {
    const countries = await prisma.country.findMany({
        orderBy: { name: 'asc' }
    })
    return countries.map(c => ({ code: c.code, name: c.name }))
}


