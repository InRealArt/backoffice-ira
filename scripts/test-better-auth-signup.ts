import 'dotenv/config'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function main() {
    const email = process.env.TEST_SIGNUP_EMAIL || `test_${Date.now()}@example.com`
    const password = process.env.TEST_SIGNUP_PASSWORD || 'Password1234!'
    const name = process.env.TEST_SIGNUP_NAME || 'Test User'

    const result = await auth.api.signUpEmail({
        body: {
            email,
            password,
            name
        }
    })

    console.log('Signup result:', result)

    const dbUser = await prisma.backofficeAuthUser.findUnique({
        where: { email: email.toLowerCase() }
    })
    if (!dbUser) {
        console.error('Utilisateur introuvable en base après signup')
        process.exit(2)
    }
    console.log('Utilisateur trouvé en base:', { id: dbUser.id, email: dbUser.email })

    const signIn = await auth.api.signInEmail({
        body: {
            email,
            password
        },
        asResponse: true
    })

    console.log('Sign-in status:', signIn.status)
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})


