'use client'

import { RichContent } from './types'

interface RichContentRendererProps {
  content: string
  richContent?: RichContent
  className?: string
}

export default function RichContentRenderer({ 
  content, 
  richContent, 
  className = '' 
}: RichContentRendererProps) {
  // Si pas de richContent, afficher le contenu simple
  if (!richContent || !richContent.segments || richContent.segments.length === 0) {
    return <span className={className}>{content}</span>
  }

  return (
    <span className={className}>
      {richContent.segments.map((segment, index) => {
        if (segment.isLink && segment.linkUrl) {
          return (
            <a
              key={segment.id || index}
              href={segment.linkUrl}
              target={segment.linkUrl.startsWith('http') ? '_blank' : '_self'}
              rel={segment.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                color: '#3b82f6',
                textDecoration: 'underline',
                textDecorationColor: '#3b82f6'
              }}
            >
              {segment.linkText || segment.text}
            </a>
          )
        }
        
        return (
          <span key={segment.id || index}>
            {segment.text}
          </span>
        )
      })}
    </span>
  )
} 