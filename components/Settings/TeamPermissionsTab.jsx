import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { RiShieldCheckLine, RiShieldUserLine, RiCheckLine } from 'react-icons/ri'
import { db } from '@/lib/firebase/client_config'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import { Spinner } from '@/components/ui/AdminModal'
import { updateUserPermissions } from '@/lib/services/managers'
import {
  MANAGER_MODULES,
  MANAGER_ACTIONS,
  ALL_MANAGER_MODULE_KEYS,
  permissionsToSelection,
} from '@/lib/constants/managerModules'

const ACTION_LABELS = { process: 'Traiter', payments: 'Paiements', delete: 'Supprimer' }
const displayName = (user) =>
  [user.firstname, user.lastname].filter(Boolean).join(' ') || user.name || user.email || 'Sans nom'

/**
 * Permissions d'un membre de l'équipe (manager) : une case par section, et
 * pour chaque section cochée, les actions autorisées. Chaque clic est
 * enregistré tout de suite (pas de bouton « Enregistrer »).
 */
export function ManagerCard({ manager, onSaved }) {
  const colors = useColors()
  const [selected, setSelected] = useState(() => permissionsToSelection(manager.permissions))
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)

  const save = async (next) => {
    const previous = selected
    setSelected(next)
    setSaving(true)
    try {
      const permissions = Array.from(next)
      await updateUserPermissions(manager.id, permissions)
      onSaved(manager.id, permissions)
      setSavedAt(Date.now())
    } catch (error) {
      setSelected(previous)
      notify("Les permissions n'ont pas pu être enregistrées", 'error')
    }
    setSaving(false)
  }

  const toggleModule = (module) => {
    const next = new Set(selected)
    if (next.has(module.key)) {
      next.delete(module.key)
      module.actions.forEach((action) => next.delete(`${module.key}:${action}`))
    } else {
      next.add(module.key)
      module.actions.forEach((action) => next.add(`${module.key}:${action}`))
    }
    save(next)
  }

  const toggleAction = (module, action) => {
    const key = `${module.key}:${action}`
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    save(next)
  }

  const setAll = (on) => save(on ? permissionsToSelection(ALL_MANAGER_MODULE_KEYS) : new Set())
  const moduleCount = MANAGER_MODULES.filter((m) => selected.has(m.key)).length

  return (
    <div className="rounded-xl border bg-white" style={{ borderColor: colors.gray200 }}>
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: colors.gray100 }}>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
          >
            {displayName(manager).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{displayName(manager)}</p>
            <p className="truncate text-xs text-gray-500">
              {manager.email} · {moduleCount} section{moduleCount > 1 ? 's' : ''} sur {MANAGER_MODULES.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {saving ? (
            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <Spinner className="h-3.5 w-3.5" /> Enregistrement…
            </span>
          ) : savedAt ? (
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: colors.success }}>
              <RiCheckLine className="h-4 w-4" /> Enregistré
            </span>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => setAll(true)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Tout cocher
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => setAll(false)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Tout décocher
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-1 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {MANAGER_MODULES.map((module) => {
          const checked = selected.has(module.key)
          return (
            <div key={module.key} className="rounded-lg px-2 py-2 hover:bg-gray-50">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={saving}
                  onChange={() => toggleModule(module)}
                  className="h-4 w-4 cursor-pointer rounded"
                  style={{ accentColor: colors.primary }}
                />
                <span className={`text-sm font-semibold ${checked ? 'text-gray-900' : 'text-gray-400'}`}>
                  {module.label}
                </span>
              </label>
              {checked && module.actions.length > 0 && (
                <div className="ml-6 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                  {module.actions.map((action) => (
                    <label key={action} className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600" title={MANAGER_ACTIONS.find((a) => a.key === action)?.label}>
                      <input
                        type="checkbox"
                        checked={selected.has(`${module.key}:${action}`)}
                        disabled={saving}
                        onChange={() => toggleAction(module, action)}
                        className="h-3.5 w-3.5 cursor-pointer rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      {ACTION_LABELS[action] || action}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TeamPermissionsTab() {
  const colors = useColors()
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'users'), where('type', 'in', ['admin', 'manager'])))
      .then((snap) => setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => notify("Impossible de charger l'équipe", 'error'))
      .finally(() => setIsLoading(false))
  }, [])

  const admins = members.filter((m) => m.type === 'admin')
  const managers = members.filter((m) => m.type === 'manager')
  const onSaved = (id, permissions) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, permissions } : m)))

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader color="#111827" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Équipe & permissions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cochez les sections que chaque manager peut ouvrir, puis ce qu&apos;il peut y faire : traiter (valider,
          changer un statut), gérer les paiements, supprimer. Chaque clic est enregistré immédiatement ; le changement
          s&apos;applique à sa prochaine page ouverte.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Managers ({managers.length})</h3>
        {managers.length === 0 ? (
          <p className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow-sm">
            Aucun manager pour l&apos;instant. Créez-en un dans Utilisateurs → Managers.
          </p>
        ) : (
          managers.map((manager) => <ManagerCard key={manager.id} manager={manager} onSaved={onSaved} />)
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900">Administrateurs ({admins.length})</h3>
        <div className="divide-y rounded-xl border bg-white" style={{ borderColor: colors.gray200 }}>
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <RiShieldUserLine className="h-5 w-5 shrink-0" style={{ color: colors.primary }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{displayName(admin)}</p>
                  <p className="truncate text-xs text-gray-500">{admin.email}</p>
                </div>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
              >
                <RiShieldCheckLine className="h-3.5 w-3.5" /> Accès complet
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Un administrateur a toujours accès à tout. Pour limiter l&apos;accès de quelqu&apos;un, créez-lui un compte
          manager.
        </p>
      </section>
    </div>
  )
}
