import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiShieldKeyholeLine, RiCheckLine, RiCloseLine } from 'react-icons/ri'
import { useColors } from '../../contexts/ColorContext'
import {
  MANAGER_MODULES,
  MANAGER_ACTIONS,
  ALL_MANAGER_MODULE_KEYS,
  hasManagerAction,
} from '../../lib/constants/managerModules'

// Construit l'état initial des cases à cocher (modules + actions) à partir
// du tableau `permissions` brut d'un manager. Une action est pré-cochée
// dès que hasManagerAction() la considère accordée — donc automatiquement
// tout coché pour un module dont aucune action fine n'a encore été
// enregistrée (comportement actuel inchangé tant que l'admin ne touche à
// rien).
function buildInitialSelection(permissions) {
  const perms = permissions || ALL_MANAGER_MODULE_KEYS
  const next = new Set()
  MANAGER_MODULES.forEach((module) => {
    if (!perms.includes(module.key)) return
    next.add(module.key)
    module.actions.forEach((action) => {
      if (hasManagerAction(perms, module.key, action)) {
        next.add(`${module.key}:${action}`)
      }
    })
  })
  return next
}

// Champ `permissions` absent sur le compte = accès total (même défaut que
// firestore.rules -> managerPermissions()), pour rester cohérent avec les
// managers créés avant cette fonctionnalité.
function ManagerPermissionsModal({ manager, open, setOpen, onSave }) {
  const colors = useColors()
  const [selected, setSelected] = useState(() => buildInitialSelection(null))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (manager) {
      setSelected(buildInitialSelection(manager.permissions))
    }
  }, [manager])

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Décocher un module retire aussi toutes ses actions ; cocher un module
  // qui n'avait encore aucune action explicitement décochée les coche
  // toutes (même défaut "accès total" que buildInitialSelection).
  const toggleModule = (module) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(module.key)) {
        next.delete(module.key)
        module.actions.forEach((action) => next.delete(`${module.key}:${action}`))
      } else {
        next.add(module.key)
        module.actions.forEach((action) => next.add(`${module.key}:${action}`))
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!manager) return
    setSaving(true)
    try {
      await onSave(manager, Array.from(selected))
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!manager) return null

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                  >
                    <RiShieldKeyholeLine className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <Dialog.Title className="truncate text-sm font-bold text-gray-900">
                      Permissions — {manager.firstname || manager.name || manager.email}
                    </Dialog.Title>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Pages accessibles à ce manager
                    </p>
                  </div>
                </div>

                <div className="max-h-[60vh] space-y-1 overflow-y-auto p-4">
                  {MANAGER_MODULES.map((module) => {
                    const moduleChecked = selected.has(module.key)
                    return (
                      <div key={module.key} className="rounded-xl hover:bg-gray-50">
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={moduleChecked}
                            onChange={() => toggleModule(module)}
                            className="h-4 w-4 cursor-pointer rounded"
                            style={{ accentColor: colors.primary }}
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            {module.label}
                          </span>
                        </label>
                        {moduleChecked && module.actions.length > 0 && (
                          <div className="ml-7 mb-2 space-y-0.5 border-l pl-3" style={{ borderColor: colors.gray100 }}>
                            {module.actions.map((actionKey) => {
                              const action = MANAGER_ACTIONS.find((a) => a.key === actionKey)
                              if (!action) return null
                              const compoundKey = `${module.key}:${actionKey}`
                              return (
                                <label
                                  key={compoundKey}
                                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-100"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected.has(compoundKey)}
                                    onChange={() => toggle(compoundKey)}
                                    className="h-3.5 w-3.5 cursor-pointer rounded"
                                    style={{ accentColor: colors.primary }}
                                  />
                                  <span className="text-xs font-medium text-gray-600">
                                    {action.label}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 p-3">
                  <button
                    type="button"
                    onClick={() => setSelected(buildInitialSelection(ALL_MANAGER_MODULE_KEYS))}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                  >
                    Tout cocher
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                    >
                      <RiCloseLine className="h-4 w-4" />
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSave}
                      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <RiCheckLine className="h-4 w-4" />
                      Enregistrer
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default ManagerPermissionsModal
