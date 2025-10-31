import 'dotenv/config'
import { prisma } from '@/lib/prisma'

type Column = { column_name: string, data_type: string, is_nullable: 'YES' | 'NO' }

async function main() {
    const schema = 'backoffice'
    const requiredTables = ['user', 'session', 'account', 'verification']

    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = ${schema} AND table_name = ANY(${requiredTables})
  `

    const found = new Set(tables.map(t => t.table_name))
    console.log('Tables trouvées dans le schéma backoffice:', Array.from(found))

    for (const table of requiredTables) {
        if (!found.has(table)) {
            console.warn(`Table manquante: ${schema}.${table}`)
            continue
        }

        const columns = await prisma.$queryRaw<Column[]>`
      SELECT column_name, data_type, is_nullable FROM information_schema.columns
      WHERE table_schema = ${schema} AND table_name = ${table}
      ORDER BY ordinal_position
    `
        console.log(`\nColonnes de ${schema}.${table}:`)
        for (const c of columns) {
            console.log(`- ${c.column_name} (${c.data_type}) nullable=${c.is_nullable}`)
        }
    }
}

main().catch(err => {
    console.error(err)
    process.exit(1)
}).finally(async () => {
    await prisma.$disconnect()
})


