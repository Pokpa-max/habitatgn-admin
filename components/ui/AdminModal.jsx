import { Fragment, useState } from 'react'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import { RiCloseLine, RiLockLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'

/**
 * Cadre commun à toutes les fenêtres de l'admin : en-tête (petit titre de
 * contexte, titre, ligne d'infos, croix), corps défilant, boutons en bas.
 * Sur téléphone, la fenêtre s'ouvre depuis le bas de l'écran.
 *
 * size : 'sm' (confirmations), 'md' (formulaires), 'lg' (fiches détaillées)
 * tone : couleur de l'icône d'en-tête ('primary' | 'error' | 'warning' | 'success')
 */
const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

export default function AdminModal({
  open,
  onClose,
  eyebrow,
  title,
  meta,
  icon: Icon,
  tone = 'primary',
  size = 'md',
  footer,
  children,
}) {
  const colors = useColors()
  const toneColor = { primary: colors.primary, error: colors.error, warning: colors.warning, success: colors.success }[tone] || colors.primary
  const toneBg = { primary: colors.primaryVeryLight, error: '#FDECEC', warning: '#FEF6E7', success: '#EAF7EE' }[tone] || colors.primaryVeryLight

  return (
    <Transition.Root show={!!open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => onClose?.()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center text-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={`w-full transform overflow-hidden rounded-t-2xl bg-white text-left shadow-2xl transition-all sm:rounded-2xl ${SIZES[size] || SIZES.md}`}
              >
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
                  <div className="flex min-w-0 items-start gap-3">
                    {Icon && (
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: toneBg, color: toneColor }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      {eyebrow && (
                        <p className="text-xs font-semibold" style={{ color: colors.primary }}>
                          {eyebrow}
                        </p>
                      )}
                      <Dialog.Title className="mt-0.5 text-lg font-bold leading-snug text-gray-900">
                        {title}
                      </Dialog.Title>
                      {meta && <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">{meta}</div>}
                    </div>
                  </div>
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Fermer"
                    >
                      <RiCloseLine className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {children && <div className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5">{children}</div>}

                {footer && (
                  <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:flex-row sm:justify-end">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

/** Bloc titré à l'intérieur d'une fenêtre. */
export function ModalSection({ title, children }) {
  return (
    <section>
      {title && <h3 className="mb-2.5 text-xs font-semibold text-gray-500">{title}</h3>}
      {children}
    </section>
  )
}

/** Informations en grille (libellé au-dessus, valeur en dessous) ; les valeurs vides sont ignorées. */
export function ModalFields({ fields }) {
  const visible = fields.filter((f) => f && f.value !== undefined && f.value !== null && f.value !== '')
  if (!visible.length) return null
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {visible.map((f) => (
        <div key={f.label} className={f.wide ? 'sm:col-span-2' : ''}>
          <dt className="text-xs text-gray-500">{f.label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-gray-900">{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Texte long (message, description) dans un encadré. */
export function ModalNote({ label, children }) {
  if (!children) return null
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      {label && <p className="text-xs text-gray-500">{label}</p>}
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-800">{children}</p>
    </div>
  )
}

/** Petit indicateur de chargement, de la couleur du texte du bouton. */
export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <span
      className={`${className} inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent`}
      aria-hidden="true"
    />
  )
}

/**
 * Bouton du pied de fenêtre. variant : 'primary' | 'secondary' | 'danger'.
 * Avec `href`, rend un lien (externe si `external`).
 * `loading` : indicateur de chargement et bouton bloqué pendant l'action.
 */
export function ModalButton({ variant = 'secondary', href, external, onClick, disabled, loading, type = 'button', icon: Icon, children, form }) {
  const colors = useColors()
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50'
  const style =
    variant === 'primary'
      ? { backgroundColor: colors.primary, color: '#FFFFFF' }
      : variant === 'danger'
      ? { backgroundColor: colors.error, color: '#FFFFFF' }
      : { backgroundColor: '#FFFFFF', color: colors.gray700, border: `1px solid ${colors.gray200}` }
  const content = (
    <>
      {loading ? <Spinner /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </>
  )
  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} hover:opacity-90`} style={style}>
          {content}
        </a>
      )
    }
    if (href.startsWith('tel:') || href.startsWith('mailto:')) {
      return (
        <a href={href} className={`${base} hover:opacity-90`} style={style}>
          {content}
        </a>
      )
    }
    return (
      <Link href={href} className={`${base} hover:opacity-90`} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} hover:opacity-90`}
      style={style}
    >
      {content}
    </button>
  )
}

/** Lien WhatsApp : numéro guinéen à 9 chiffres complété de l'indicatif 224. */
export function whatsappUrl(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits.length === 9 ? `224${digits}` : digits}`
}

/**
 * Choix du statut d'une demande, en un clic.
 * - Pendant l'enregistrement : chargement sur le bouton cliqué, les autres bloqués.
 * - `locked` (statut final, ex. « Terminée ») : les boutons disparaissent, seul
 *   le statut reste affiché, avec `lockedMessage` pour l'expliquer.
 */
export function StatusChoice({ options, value, onChange, locked = false, lockedMessage, columns = 'grid-cols-2 sm:grid-cols-4' }) {
  const colors = useColors()
  const [pending, setPending] = useState(null)

  const choose = async (next) => {
    if (pending || next === value) return
    setPending(next)
    try {
      await onChange(next)
    } finally {
      setPending(null)
    }
  }

  // Statut final : plus de boutons, seulement le statut et une explication
  if (locked) {
    const current = options.find((option) => option.value === value)
    return (
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3"
        style={{ borderColor: colors.gray200, backgroundColor: colors.gray50 }}
      >
        <RiLockLine className="h-5 w-5 shrink-0" style={{ color: colors.gray400 }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{current?.label || value}</p>
          {lockedMessage && <p className="mt-0.5 text-xs text-gray-500">{lockedMessage}</p>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={`grid gap-2 ${columns}`}>
        {options.map((option) => {
          const active = value === option.value
          const busy = pending === option.value
          return (
            <button
              key={option.value}
              type="button"
              disabled={active || !!pending}
              onClick={() => choose(option.value)}
              aria-busy={busy || undefined}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed"
              style={
                active
                  ? { borderColor: colors.primary, backgroundColor: colors.primary, color: '#FFFFFF' }
                  : {
                      borderColor: colors.gray200,
                      color: colors.gray700,
                      opacity: pending && !busy ? 0.45 : 1,
                    }
              }
            >
              {busy && <Spinner className="h-3.5 w-3.5" />}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
