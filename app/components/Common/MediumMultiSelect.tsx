'use client'

import { useMemo } from 'react'

interface MediumMultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}

export default function MediumMultiSelect({ options, selected, onChange }: MediumMultiSelectProps) {
  const sortedOptions = useMemo(() => options.slice().sort((a, b) => a.localeCompare(b)), [options])

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="d-flex flex-column gap-sm">
      <div className="d-flex gap-sm" style={{ flexWrap: 'wrap' }}>
        {selected.map(v => (
          <span key={v} className="tag">
            {v}
            <button
              type="button"
              className="tag-remove"
              onClick={() => toggle(v)}
              aria-label={`Retirer ${v}`}
            >
              &times;
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>Aucun medium sélectionné</span>
        )}
      </div>
      <div className="d-flex flex-column gap-xs" style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
        {sortedOptions.map(opt => (
          <label key={opt} className="d-flex align-items-center gap-sm" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}


