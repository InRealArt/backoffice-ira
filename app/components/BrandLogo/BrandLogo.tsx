import { Cormorant_Garamond } from 'next/font/google'

// Même mot-symbole que le header de inrealart.com : « InRealArt » en Cormorant Garamond léger,
// majuscules, interlettrage large.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400'],
})

interface BrandLogoProps {
  size?: 'md' | 'lg'
  /** Libellé discret sous le mot-symbole (ex. « Backoffice ») */
  caption?: string
  className?: string
}

export default function BrandLogo({ size = 'md', caption, className = '' }: BrandLogoProps) {
  const wordmarkSize = size === 'lg' ? '1.75rem' : '1.25rem'

  return (
    <span
      className={`inline-flex flex-col items-start leading-none ${className}`}
      role="img"
      aria-label={caption ? `InRealArt ${caption}` : 'InRealArt'}
    >
      <span
        className={cormorant.className}
        aria-hidden="true"
        style={{
          fontSize: wordmarkSize,
          fontWeight: 300,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--color-text-primary)',
          marginRight: '-0.4em', // compense l'espace après la dernière lettre
        }}
      >
        InRealArt
      </span>
      {caption && (
        <span
          aria-hidden="true"
          style={{
            marginTop: '0.4rem',
            fontSize: '0.625rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
          }}
        >
          {caption}
        </span>
      )}
    </span>
  )
}
