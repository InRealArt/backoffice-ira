import { FormSectionProps } from './types'

function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="mb-8 p-6 rounded-lg border border-border shadow bg-[#fafafa] relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:rounded-t-lg before:bg-gradient-to-r before:from-[#4a6cf7] before:to-primary">
      <div className="text-[1.2rem] font-semibold text-gray-900 mt-0 mb-5 pb-3 border-b border-border relative after:content-[''] after:absolute after:-bottom-px after:left-0 after:w-[100px] after:h-[2px] after:bg-[#4a6cf7]">
        {title}
      </div>
      <div className="mb-2">
        {children}
      </div>
    </div>
  )
}

export default FormSection 