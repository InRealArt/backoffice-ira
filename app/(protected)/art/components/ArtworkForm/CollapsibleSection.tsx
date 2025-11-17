'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
  bgVariant?: 'default' | 'subtle-1' | 'subtle-2' | 'subtle-3' | 'subtle-4' | 'subtle-5'
}

const bgVariants = {
  default: 'bg-[#e5e7eb] dark:bg-gray-800',
  'subtle-1': 'bg-[#e5e7eb] dark:bg-gray-800/95',
  'subtle-2': 'bg-[#e5e7eb] dark:bg-gray-800/90',
  'subtle-3': 'bg-[#e5e7eb] dark:bg-gray-800/85',
  'subtle-4': 'bg-[#e5e7eb] dark:bg-gray-800/80',
  'subtle-5': 'bg-[#e5e7eb] dark:bg-gray-800/75'
}

const hoverVariants = {
  default: 'hover:bg-[#d1d5db] dark:hover:bg-gray-700/50',
  'subtle-1': 'hover:bg-[#d1d5db] dark:hover:bg-gray-700/60',
  'subtle-2': 'hover:bg-[#d1d5db] dark:hover:bg-gray-700/55',
  'subtle-3': 'hover:bg-[#d1d5db] dark:hover:bg-gray-700/50',
  'subtle-4': 'hover:bg-[#d1d5db] dark:hover:bg-gray-700/45',
  'subtle-5': 'hover:bg-[#d1d5db] dark:hover:bg-gray-700/40'
}

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultExpanded = true,
  className = '',
  bgVariant = 'default'
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const bgClass = bgVariants[bgVariant]
  const hoverClass = hoverVariants[bgVariant]

  return (
    <div className={`mb-6 rounded-xl border border-gray-200 ${bgClass} shadow-sm transition-all duration-300 hover:shadow-md dark:border-gray-700 ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-t-xl transition-colors duration-200 ${hoverClass}`}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          <span>{title}</span>
        </h3>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-visible transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={isExpanded ? {} : { overflow: 'hidden' }}
      >
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 dark:border-gray-700 w-full overflow-visible">
          {children}
        </div>
      </div>
    </div>
  )
}

