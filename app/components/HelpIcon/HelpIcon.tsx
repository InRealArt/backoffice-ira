'use client'

interface HelpIconProps {
  onClick: () => void
}

export default function HelpIcon({ onClick }: HelpIconProps) {
  return (
    <div
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-sm font-medium cursor-pointer transition-all ml-2 hover:bg-gray-300 hover:text-gray-900"
      onClick={onClick}
      title="Aide"
    >
      ?
    </div>
  )
} 