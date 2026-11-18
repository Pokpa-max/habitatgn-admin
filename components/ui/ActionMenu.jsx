import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { RiMore2Fill } from 'react-icons/ri'

/**
 * Menu « ⋮ » commun à toutes les listes de l'admin.
 *
 *   <ActionMenu>
 *     <MenuItem icon={RiEyeLine} href="/x">Voir</MenuItem>
 *     <MenuItem icon={RiEditLine} onClick={edit}>Modifier</MenuItem>
 *     <MenuSeparator />
 *     <MenuItem icon={RiDeleteBinLine} danger onClick={remove}>Supprimer</MenuItem>
 *   </ActionMenu>
 *
 * - S'ouvre sous le bouton, ou au-dessus seulement si la place manque
 *   (hauteur réelle mesurée), aligné sur le bord droit du bouton.
 * - Affiché par-dessus la page (portail) : jamais coupé par un tableau.
 * - Petite apparition (fondu + léger zoom).
 * - Clavier : flèches haut/bas, Début/Fin, Entrée, Échap (le focus revient
 *   sur le bouton).
 * - Se ferme au clic à côté, au défilement, au redimensionnement et après
 *   chaque action.
 * - Séparateurs : ceux en début/fin ou en double (actions masquées selon
 *   les droits) disparaissent d'eux-mêmes.
 */
const MenuContext = createContext({ close: () => {} })

const GAP = 6
const MARGIN = 8

export default function ActionMenu({
  children,
  label = 'Autres actions',
  size = 'md',
  width = 'w-60',
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const [shown, setShown] = useState(false)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const close = useCallback((restoreFocus = false) => {
    setOpen(false)
    setShown(false)
    setPos(null)
    if (restoreFocus) buttonRef.current?.focus()
  }, [])

  // Position calculée une fois le menu rendu (hauteur réelle)
  useLayoutEffect(() => {
    if (!open || !menuRef.current || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const height = menuRef.current.offsetHeight
    const right = Math.max(MARGIN, window.innerWidth - rect.right)
    const below = window.innerHeight - rect.bottom - GAP - MARGIN
    const above = rect.top - GAP - MARGIN
    if (height <= below || below >= above) {
      setPos({ top: Math.min(rect.bottom + GAP, window.innerHeight - MARGIN - height), right, origin: 'top right' })
    } else {
      setPos({ top: Math.max(MARGIN, rect.top - GAP - height), right, origin: 'bottom right' })
    }
  }, [open])

  useEffect(() => {
    if (!pos) return
    const frame = requestAnimationFrame(() => setShown(true))
    menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus({ preventScroll: true })
    return () => cancelAnimationFrame(frame)
  }, [pos])

  useEffect(() => {
    if (!open) return
    const onPointer = (event) => {
      if (menuRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return
      close()
    }
    const onScroll = (event) => {
      if (menuRef.current?.contains(event.target)) return
      close()
    }
    const onResize = () => close()
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, close])

  const onKeyDown = (event) => {
    const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || [])]
    const index = items.indexOf(document.activeElement)
    const focus = (i) => items[(i + items.length) % items.length]?.focus()
    if (event.key === 'ArrowDown') { event.preventDefault(); focus(index + 1) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); focus(index - 1) }
    else if (event.key === 'Home') { event.preventDefault(); focus(0) }
    else if (event.key === 'End') { event.preventDefault(); focus(items.length - 1) }
    else if (event.key === 'Escape') { event.preventDefault(); close(true) }
    else if (event.key === 'Tab') close()
  }

  const buttonSize = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={(event) => {
          // La ligne du tableau (souvent cliquable) ne doit pas réagir
          event.stopPropagation()
          open ? close() : setOpen(true)
        }}
        onKeyDown={(event) => {
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !open) {
            event.preventDefault()
            setOpen(true)
          }
        }}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex ${buttonSize} shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? 'border-gray-300 bg-gray-100 text-gray-800' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
        } ${className}`}
      >
        <RiMore2Fill className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      </button>

      {open &&
        createPortal(
          <MenuContext.Provider value={{ close }}>
            <div
              ref={menuRef}
              role="menu"
              aria-label={label}
              onKeyDown={onKeyDown}
              // Les événements d'un portail remontent quand même vers la ligne
              onClick={(event) => event.stopPropagation()}
              className={`fixed z-[1300] ${width} max-h-[calc(100vh-16px)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-[0_12px_32px_rgba(15,23,42,0.14)] outline-none [&>hr+hr]:hidden [&>hr:first-child]:hidden [&>hr:last-child]:hidden`}
              style={{
                top: pos?.top ?? -9999,
                right: pos?.right ?? 0,
                visibility: pos ? 'visible' : 'hidden',
                transformOrigin: pos?.origin,
                opacity: shown ? 1 : 0,
                transform: shown ? 'scale(1)' : 'scale(0.96)',
                transition: 'opacity 110ms ease-out, transform 110ms ease-out',
              }}
            >
              {children}
            </div>
          </MenuContext.Provider>,
          document.body
        )}
    </>
  )
}

const itemClass = (danger, disabled) =>
  `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium outline-none transition-colors ${
    disabled
      ? 'cursor-not-allowed text-gray-300'
      : danger
        ? 'text-red-700 hover:bg-red-50 focus-visible:bg-red-50'
        : 'text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100'
  }`

/** Une action. `href` → lien (interne, ou externe avec `external`), sinon bouton. */
export function MenuItem({ icon: Icon, iconColor, danger = false, disabled = false, href, external = false, onClick, children, hint }) {
  const { close } = useContext(MenuContext)
  const content = (
    <>
      {Icon && (
        <Icon
          className={`h-4 w-4 shrink-0 ${danger ? '' : iconColor ? '' : 'text-gray-400'}`}
          style={!danger && iconColor ? { color: iconColor } : undefined}
        />
      )}
      <span className="min-w-0 flex-1">{children}</span>
      {hint && <span className="shrink-0 text-xs font-normal text-gray-400">{hint}</span>}
    </>
  )
  const handle = (event) => {
    if (disabled) return
    close()
    onClick?.(event)
  }

  if (href && !disabled) {
    if (external) {
      return (
        <a role="menuitem" tabIndex={-1} href={href} target="_blank" rel="noopener noreferrer" onClick={handle} className={itemClass(danger, false)}>
          {content}
        </a>
      )
    }
    return (
      <Link role="menuitem" tabIndex={-1} href={href} onClick={handle} className={itemClass(danger, false)}>
        {content}
      </Link>
    )
  }
  return (
    <button role="menuitem" tabIndex={-1} type="button" disabled={disabled} onClick={handle} className={itemClass(danger, disabled)}>
      {content}
    </button>
  )
}

/** Trait entre deux groupes d'actions. */
export function MenuSeparator() {
  return <hr className="my-1 border-gray-100" />
}

/**
 * Une action avec plusieurs choix rapides sur une ligne (ex. mettre en avant
 * 7 j / 15 j / 30 j). `options` : [{ label, onClick, ariaLabel? }].
 */
export function MenuChoices({ icon: Icon, label, options = [], disabled = false }) {
  const { close } = useContext(MenuContext)
  return (
    <div className="px-2.5 py-1.5">
      <p className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" />}
        {label}
      </p>
      <div className="mt-1.5 flex gap-1.5 pl-[26px]">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={disabled}
            aria-label={option.ariaLabel || `${label} : ${option.label}`}
            onClick={() => {
              close()
              option.onClick?.()
            }}
            className="h-8 min-w-[2.5rem] flex-1 rounded-lg border border-gray-200 px-2 text-xs font-semibold text-gray-700 outline-none transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:border-gray-400 focus-visible:bg-gray-100 disabled:opacity-50"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Petit titre de groupe (facultatif). */
export function MenuLabel({ children }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{children}</div>
}
