import { useEffect, useRef } from 'react'
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'

/**
 * Pagination commune des listes de l'admin : « 11–20 sur 147 » à gauche,
 * pages numérotées (avec « … ») et précédent / suivant à droite.
 * Rien n'est affiché s'il n'y a qu'une page.
 */

/** Pages à afficher : 1 … 4 5 6 … 15 (au plus 7 éléments). */
function pageItems(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const items = [1]
  const start = Math.max(2, Math.min(page - 1, pageCount - 4))
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5))
  if (start > 2) items.push('…')
  for (let n = start; n <= end; n += 1) items.push(n)
  if (end < pageCount - 1) items.push('…')
  items.push(pageCount)
  return items
}

export default function Pagination({ page, pageSize, total, onChange, className = '' }) {
  const colors = useColors()
  const ref = useRef(null)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  // La liste a raccourci (suppression, filtre) : on revient sur une page qui existe
  useEffect(() => {
    if (page > pageCount) onChange(pageCount)
  }, [page, pageCount, onChange])

  if (total <= pageSize) return null

  const go = (next) => {
    if (next < 1 || next > pageCount || next === page) return
    onChange(next)
    // Haut de la liste, pour lire la nouvelle page depuis le début
    const list = ref.current?.parentElement
    if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const arrow =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav
      ref={ref}
      aria-label="Pagination"
      className={`mt-5 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row ${className}`}
    >
      <p className="text-sm text-gray-500">
        <span className="font-semibold text-gray-900">
          {from.toLocaleString('fr-FR')}–{to.toLocaleString('fr-FR')}
        </span>{' '}
        sur <span className="font-semibold text-gray-900">{total.toLocaleString('fr-FR')}</span>
      </p>

      <div className="flex items-center gap-1">
        <button type="button" onClick={() => go(page - 1)} disabled={page === 1} className={arrow} aria-label="Page précédente">
          <RiArrowLeftSLine className="h-5 w-5" />
        </button>
        {pageItems(page, pageCount).map((item, index) =>
          item === '…' ? (
            <span key={`gap-${index}`} className="w-7 text-center text-sm text-gray-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => go(item)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Page ${item}`}
              className={`h-9 min-w-[2.25rem] rounded-lg px-2.5 text-sm font-semibold tabular-nums transition ${
                item === page ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={item === page ? { backgroundColor: colors.primary } : undefined}
            >
              {item}
            </button>
          )
        )}
        <button type="button" onClick={() => go(page + 1)} disabled={page === pageCount} className={arrow} aria-label="Page suivante">
          <RiArrowRightSLine className="h-5 w-5" />
        </button>
      </div>
    </nav>
  )
}
