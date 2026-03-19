import { NextResponse } from "next/server"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function DELETE(request: Request) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { storagePath } = await request.json()

    if (!storagePath) {
      return NextResponse.json(
        { error: "storagePath est requis" },
        { status: 400 }
      )
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
    })

    await r2Client.send(command)

    console.log(`✅ [R2 delete] Fichier supprimé: ${storagePath}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    // R2 retourne NoSuchKey si le fichier n'existe pas
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ success: true, notFound: true }, { status: 404 })
    }

    console.error("Erreur lors de la suppression R2:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}
