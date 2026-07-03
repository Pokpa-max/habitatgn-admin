import { useEffect, useState } from 'react'
import { resolveUser } from '@/components/OwnerCell'

export default function OwnerFilterSelect({ items, value, onChange }) {
  const [options, setOptions] = useState([])

  useEffect(() => {
    let active = true
    const uniqueIds = [...new Set((items || []).map((i) => i.userId).filter(Boolean))]

    Promise.all(uniqueIds.map((id) => resolveUser(id))).then((resolved) => {
      if (!active) return
      const sorted = resolved
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name))
      setOptions(sorted)
    })

    return () => {
      active = false
    }
  }, [items])

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border bg-white py-2.5 px-3 text-sm font-medium text-gray-700"
      style={{ borderColor: '#e5e7eb' }}
    >
      <option value="">Tous les agents</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  )
}
