'use client'

import { useMemo } from 'react'

type CategoryOption = { id: number, name: string }

interface CategoryMultiSelectProps {
  options: CategoryOption[]
  selected: number[]
  onChange: (values: number[]) => void
}

export default function CategoryMultiSelect ({ options, selected, onChange }: CategoryMultiSelectProps) {
  const sortedOptions = useMemo(() => options.slice().sort((a, b) => a.name.localeCompare(b.name)), [options])
  const idToName = useMemo(() => new Map(sortedOptions.map(o => [o.id, o.name])), [sortedOptions])

  const toggle = (value: number) => {
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
            {idToName.get(v) || v}
            <button
              type="button"
              className="tag-remove"
              onClick={() => toggle(v)}
              aria-label={`Retirer ${idToName.get(v) || v}`}
            >
              &times;
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-muted" style={{ fontSize: '0.9rem' }}>Aucune catégorie sélectionnée</span>
        )}
      </div>
      <div className="d-flex flex-column gap-xs" style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
        {sortedOptions.map(opt => (
          <label key={opt.id} className="d-flex align-items-center gap-sm" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selected.includes(opt.id)}
              onChange={() => toggle(opt.id)}
            />
            <span>{opt.name}</span>
          </label>
        ))}
      </div>
    </div>
  )
}


