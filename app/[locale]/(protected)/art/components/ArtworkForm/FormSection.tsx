import { FormSectionProps } from './types'
import CollapsibleSection from './CollapsibleSection'

function FormSection({ title, children, bgVariant = 'default' }: FormSectionProps) {
  return (
    <CollapsibleSection title={title} defaultExpanded={true} bgVariant={bgVariant}>
      {children}
    </CollapsibleSection>
  )
}

export default FormSection 