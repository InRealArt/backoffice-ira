'use client'

import { useMemo, useState, useEffect, useRef } from 'react'

export type CountryOption = {
  code: string
  name: string
}

type Props = {
  countries: CountryOption[]
  value: string
  onChange: (code: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function CountrySelect({ countries, value, onChange, placeholder = 'FR', disabled = false }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    const q = (query || '').toUpperCase()
    if (!q) return countries
    return countries.filter(c => c.code.startsWith(q))
  }, [countries, query])

  function handleSelect(code: string) {
    onChange(code)
    setQuery(code)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="country-select" style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value.toUpperCase())
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        maxLength={2}
        placeholder={placeholder}
        className="form-input"
        disabled={disabled}
      />
      {open && (
        <div
          role="listbox"
          className="dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            marginTop: 4,
            maxHeight: 200,
            overflowY: 'auto'
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '8px 12px', color: '#6b7280' }}>Aucun pays</div>
          ) : (
            filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c.code)}
                className="dropdown-item"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: 'transparent'
                }}
              >
                <span style={{ fontWeight: 600, marginRight: 8 }}>{c.code}</span>
                <span style={{ color: '#374151' }}>{c.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}


