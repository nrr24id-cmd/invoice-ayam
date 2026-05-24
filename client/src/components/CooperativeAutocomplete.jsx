import { useState, useEffect, useRef } from 'react'
import { searchCooperatives } from '../api/client'

export default function CooperativeAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (value?.name && query !== value.name) setQuery(value.name)
  }, [value])

  useEffect(() => {
    if (!query) { setSuggestions([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const results = await searchCooperatives(query)
      setSuggestions(results)
      if (results.length > 0) setOpen(true)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query])

  function handleSelect(coop) {
    setQuery(coop.name)
    setOpen(false)
    setSuggestions([])
    onChange(coop)
  }

  function handleBlur() {
    setTimeout(() => setOpen(false), 150)
    if (!value || value.name !== query) {
      onChange({ name: query, address: '', phone: '' })
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(null) }}
        onBlur={handleBlur}
        placeholder="Nama koperasi..."
        style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: 4 }}
      />
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', background: 'white', border: '1px solid #ccc',
          borderRadius: 4, width: '100%', listStyle: 'none', margin: 0,
          padding: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {suggestions.map(coop => (
            <li
              key={coop.id}
              onMouseDown={() => handleSelect(coop)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
            >
              <strong>{coop.name}</strong>
              {coop.address && <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{coop.address}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
