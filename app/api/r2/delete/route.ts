import { NextResponse } from "next/server"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2/client"
import { requireBackofficeUser } from "@/lib/auth-helpers"
import { unauthorizedResponse } from "@/lib/api-auth"
import { isAllowedStoragePath } from "@/lib/r2/path-guard"

export async function DELETE(request: Request) {
  try {
    // Utilisateur du backoffice authentifié (admin, artiste ou responsable de galerie)
    const session = await requireBackofficeUser()

    const { storagePath } = await request.json()

    if (!storagePath) {
      return NextResponse.json(
        { error: "storagePath est requis" },
        { status: 400 }
      )
    }

    if (!isAllowedStoragePath(storagePath, session.user.role)) {
      return NextResponse.json({ error: "Chemin de stockage non autorisé" }, { status: 403 })
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
    })

    await r2Client.send(command)

    console.log(`✅ [R2 delete] Fichier supprimé: ${storagePath}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const denied = unauthorizedResponse(error)
    if (denied) return denied
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
