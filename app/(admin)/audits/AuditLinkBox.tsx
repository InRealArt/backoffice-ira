'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/** Affiche un lien privé en clair avec bouton « Copier ». Le lien n'est jamais conservé ailleurs. */
export default function AuditLinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Le texte reste sélectionnable manuellement
    }
  }

  return (
    <div className="form-group">
      <label className="form-label">Lien privé à envoyer au client</label>
      <div className="d-flex gap-sm align-items-center">
        <input readOnly value={link} className="form-input" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn-secondary" onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <p className="form-hint text-xs">
        Ce lien ne sera plus affichable après avoir quitté cette page. En cas de perte, utilisez « Régénérer le lien ».
      </p>
    </div>
  )
}
