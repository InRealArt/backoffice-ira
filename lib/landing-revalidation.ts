import { revalidatePath as nextRevalidatePath } from 'next/cache'
import { after } from 'next/server'

/**
 * Revalidation du site public (landing InRealArt, audit V2 / IRA-22).
 *
 * Les server actions qui modifient un contenu affiché sur le landing importent `revalidatePath`
 * depuis ce module au lieu de `next/cache` : même signature, même effet sur le back-office,
 * et en plus une purge du landing via `POST <LANDING_REVALIDATE_URL>` avec `{ secret, all: true }`.
 * Contrat côté landing : docs/CACHE_REVALIDATION.md (dépôt landing).
 *
 * - Une sauvegarde appelle souvent revalidatePath plusieurs fois : les appels rapprochés sont
 *   regroupés en une seule purge, envoyée après la réponse (`after`), donc après les écritures en base.
 * - Désactivé tant que LANDING_REVALIDATE_URL ou REVALIDATE_SECRET n'est pas défini
 *   (en local, on ne purge pas la production par accident).
 * - Une erreur n'empêche jamais la sauvegarde : le landing a de toute façon un filet de 5 min.
 */

const COALESCE_MS = 300
const REQUEST_TIMEOUT_MS = 5_000
const RETRY_DELAY_MS = 1_500

let inFlight: Promise<void> | null = null
let rerun = false

async function sendLandingPurge(): Promise<void> {
  const url = process.env.LANDING_REVALIDATE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) return

  // Une nouvelle tentative après 1,5 s en cas d'échec (réseau, 5xx)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret, all: true }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      if (response.ok) return
      console.error(`[landing-revalidation] échec ${response.status} (essai ${attempt})`)
      if (response.status < 500) return // 400/401 : inutile de réessayer (secret ou contrat)
    } catch (error) {
      console.error(`[landing-revalidation] landing injoignable (essai ${attempt})`, error)
    }
    if (attempt === 1) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
  }
}

function scheduleLandingPurge(): void {
  if (!process.env.LANDING_REVALIDATE_URL || !process.env.REVALIDATE_SECRET) return

  if (inFlight) {
    // Purge déjà programmée ou en cours : on en relance une après, pour couvrir cette écriture
    rerun = true
  } else {
    inFlight = (async () => {
      for (;;) {
        rerun = false
        await new Promise(resolve => setTimeout(resolve, COALESCE_MS))
        await sendLandingPurge()
        // Test et remise à zéro dans le même tour : aucun appel ne peut se glisser entre les deux
        if (!rerun) {
          inFlight = null
          return
        }
      }
    })()
  }

  const pending = inFlight
  try {
    // Garde la fonction serverless en vie jusqu'à l'envoi, sans retarder la réponse
    after(() => pending)
  } catch {
    // Hors contexte de requête (script) : la promesse continue seule
  }
}

export function revalidatePath(...args: Parameters<typeof nextRevalidatePath>): void {
  nextRevalidatePath(...args)
  scheduleLandingPurge()
}
