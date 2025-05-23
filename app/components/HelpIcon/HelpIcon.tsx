'use client'

import styles from './HelpIcon.module.scss'

interface HelpIconProps {
  onClick: () => void
}

export default function HelpIcon({ onClick }: HelpIconProps) {
  return (
    <div className={styles.helpIcon} onClick={onClick} title="Aide">
      ?
    </div>
  )
} 