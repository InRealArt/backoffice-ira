import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { storagePath, contentType } = await request.json()

    if (!storagePath || !contentType) {
      return NextResponse.json(
        { error: "storagePath et contentType sont requis" },
        { status: 400 }
      )
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 })

    return NextResponse.json({ uploadUrl, relativePath: storagePath })
  } catch (error) {
    console.error("Erreur lors de la génération de la presigned URL:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération de la presigned URL" },
      { status: 500 }
    )
  }
}
