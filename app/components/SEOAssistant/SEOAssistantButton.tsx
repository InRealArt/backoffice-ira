'use client'


interface SEOAssistantButtonProps {
  onClick: () => void
}

export default function SEOAssistantButton({ onClick }: SEOAssistantButtonProps) {
  return (
    <button 
      className="fixed left-[calc(50%-500px)] top-1/2 -translate-y-1/2 z-[100] bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none rounded-lg px-6 py-3.5 font-semibold text-base cursor-pointer shadow-lg transition-all duration-300 flex items-center gap-2 hover:-translate-y-[calc(50%+2px)] hover:shadow-xl active:-translate-y-[calc(50%+1px)] md:left-4 md:bottom-4 md:top-auto md:translate-y-0 md:px-5 md:py-3 md:text-sm md:hover:translate-y-[-2px] md:active:translate-y-[-1px]" 
      onClick={onClick}
      title="Prévisualiser l'article en temps réel"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-4 md:h-4">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
      SEO Assistant
    </button>
  )
} 