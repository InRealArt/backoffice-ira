import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './FormKit.module.scss'

// Kit de mise en page des formulaires de création et d'édition.
// Usage : <FormPage><FormPageHeader …/><FormCard><form className={formKit.form}>…</form></FormCard></FormPage>
// Les champs gardent leurs classes globales (form-input, form-group…) : le style carré, 44 px et 16 px
// s'applique à tout ce qui se trouve dans `formKit.form`.

export { styles as formKit }

export function FormPage({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`${styles.page} ${wide ? styles.pageWide : ''}`}>{children}</div>
}

interface FormPageHeaderProps {
  title: string
  subtitle?: string
  /** Petit libellé doré au-dessus du titre (pseudo, nom de l'entité…) */
  eyebrow?: string | null
}

export function FormPageHeader({ title, subtitle, eyebrow }: FormPageHeaderProps) {
  return (
    <header className={styles.header}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h1 className={styles.title}>{title}</h1>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </header>
  )
}

export function FormCard({ children }: { children: ReactNode }) {
  return <div className={styles.card}>{children}</div>
}

interface FormSectionProps {
  title?: string
  help?: string
  children: ReactNode
}

export function FormSection({ title, help, children }: FormSectionProps) {
  return (
    <section className={styles.section}>
      {title ? (
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {help ? <p className={styles.sectionHelp}>{help}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

/** Grille de champs : 1 colonne sur mobile, 2 (ou 3) à partir de 640 px (900 px pour 3) */
export function FormGrid({ columns = 2, children }: { columns?: 2 | 3; children: ReactNode }) {
  return <div className={columns === 3 ? styles.row3 : styles.row}>{children}</div>
}

/** Boutons d'action : empilés sur mobile (principal en premier), alignés ensuite */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}

interface FormSwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'className'> {
  id: string
  label: string
  offLabel: string
  onLabel: string
  checked: boolean
}

/** Interrupteur accessible (input role="switch"). À utiliser avec register() de react-hook-form. */
export function FormSwitch({ id, label, offLabel, onLabel, checked, ...inputProps }: FormSwitchProps) {
  const labelId = `${id}-label`
  return (
    <div className='form-group'>
      <span className='form-label' id={labelId}>
        {label}
      </span>
      <div className={styles.switchRow}>
        <span className={`${styles.switchState} ${!checked ? styles.switchStateOn : ''}`}>{offLabel}</span>
        <label className={styles.switch}>
          <input id={id} type='checkbox' role='switch' aria-labelledby={labelId} {...inputProps} />
        </label>
        <span className={`${styles.switchState} ${checked ? styles.switchStateOn : ''}`}>{onLabel}</span>
      </div>
    </div>
  )
}
