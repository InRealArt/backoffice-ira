'use client'

import styles from '../BlogSection.module.scss'

interface SectionControlButtonsProps {
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export default function SectionControlButtons({
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown
}: SectionControlButtonsProps) {
  const handleMoveUp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canMoveUp) {
      onMoveUp()
    }
  }

  const handleMoveDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canMoveDown) {
      onMoveDown()
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete()
  }

  return (
    <div className={styles.sectionControls}>
      <button 
        type="button" 
        onClick={handleMoveUp} 
        disabled={!canMoveUp}
        title={canMoveUp ? "Déplacer vers le haut" : "Impossible de déplacer vers le haut"}
        className={`${styles.sectionControlButton} ${styles.moveUpButton} ${!canMoveUp ? styles.disabled : ''}`}
        aria-label="Déplacer la section vers le haut"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
      
      <button 
        type="button" 
        onClick={handleMoveDown} 
        disabled={!canMoveDown}
        title={canMoveDown ? "Déplacer vers le bas" : "Impossible de déplacer vers le bas"}
        className={`${styles.sectionControlButton} ${styles.moveDownButton} ${!canMoveDown ? styles.disabled : ''}`}
        aria-label="Déplacer la section vers le bas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      
      <button 
        type="button" 
        onClick={handleDelete} 
        title="Supprimer la section"
        className={`${styles.sectionControlButton} ${styles.deleteButton}`}
        aria-label="Supprimer la section"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  )
}
