import jwt from 'jsonwebtoken'
import { getUserByEmail } from '@/lib/database/utils'
import { BackofficeUser } from '@prisma/client'

export const decodeJwtToken = async (authToken: string): Promise<{ user: BackofficeUser | null, message: string }> => {
    const decodedToken = jwt.decode(authToken)
        
    if (!decodedToken || typeof decodedToken !== 'object') {
        return {
            user: null,
            message: 'Token invalide ou expiré',
        }   
    }
    
    console.log('Contenu du token décodé:', JSON.stringify(decodedToken, null, 2))
    
    const email = (decodedToken as jwt.JwtPayload)?.email // Email (si présent)
    
    const authUser = await getUserByEmail(email)

    return {
      user: authUser,
      message: 'User authentifié !!',
    }
}