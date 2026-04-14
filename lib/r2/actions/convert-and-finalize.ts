'use server'

import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2/client'
import type { Readable } from 'stream'

interface ConvertAndFinalizeResult {
    success: true
    relativePath: string
}

/**
 * Server Action: fetches a raw image from R2 temp key, converts it to WebP via sharp,
 * writes the result back to R2 at the final key, then deletes the temp key.
 *
 * This runs entirely server-side — no binary data is materialized in an HTTP response,
 * which avoids the Vercel 4.5MB FUNCTION_PAYLOAD_TOO_LARGE limit that occurs when
 * returning base64-encoded WebP from a Route Handler.
 *
 * The converted WebP buffer stays in the Serverless Function memory and is streamed
 * directly to R2 via PutObjectCommand — it never appears in a client response.
 *
 * @param tempKey - R2 key of the uploaded raw file (e.g. "temp/{uuid}/filename.jpg")
 * @param finalKey - Target R2 key for the converted WebP (e.g. "artists/{folder}/landing/{name}.webp")
 * @returns { success: true, relativePath: finalKey }
 */
export async function convertAndFinalize(
    tempKey: string,
    finalKey: string
): Promise<ConvertAndFinalizeResult> {
    if (!tempKey || !finalKey) {
        throw new Error('convertAndFinalize: tempKey and finalKey are required')
    }

    // Step 1: Fetch the raw image bytes from R2
    const getCommand = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: tempKey,
    })

    const getResponse = await r2Client.send(getCommand)

    if (!getResponse.Body) {
        throw new Error(`convertAndFinalize: no body returned for key "${tempKey}"`)
    }

    // Collect the streaming body into a Buffer, enforcing a hard size cap while
    // streaming so we never load an oversized file fully into Vercel function RAM.
    const MAX_RAW_BYTES = 4 * 1024 * 1024 // 4 MB — matches presign route and client guard
    const chunks: Uint8Array[] = []
    let totalBytes = 0
    for await (const chunk of getResponse.Body as Readable) {
        totalBytes += (chunk as Uint8Array).length
        if (totalBytes > MAX_RAW_BYTES) {
            throw new Error(
                `convertAndFinalize: fichier trop volumineux (>4 Mo). Clé temp: "${tempKey}"`
            )
        }
        chunks.push(chunk as Uint8Array)
    }
    const rawBuffer = Buffer.concat(chunks)

    // Step 2: Convert to WebP with sharp
    const webpBuffer = await sharp(rawBuffer)
        .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .webp({
            quality: 80,
            effort: 4,
            smartSubsample: true,
            lossless: false,
        })
        .toBuffer()

    // Step 3: Upload the WebP buffer to the final R2 key
    const putCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: finalKey,
        Body: webpBuffer,
        ContentType: 'image/webp',
        ContentLength: webpBuffer.length,
    })

    await r2Client.send(putCommand)

    // Step 4: Delete the temp key to avoid orphaned objects
    const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: tempKey,
    })

    await r2Client.send(deleteCommand)

    return { success: true, relativePath: finalKey }
}
