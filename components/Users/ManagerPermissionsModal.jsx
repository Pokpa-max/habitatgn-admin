import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiShieldKeyholeLine, RiCheckLine, RiCloseLine } from 'react-icons/ri'
import { useColors } from '../../contexts/ColorContext'
import { MANAGER_MODULES, ALL_MANAGER_MODULE_KEYS } from '../../lib/constants/managerModules'

// Champ `permissions` absent sur le compte = accès total (même défaut que
// firestore.rules -> managerPermissions()), pour rester cohérent avec les
// managers créés avant cette fonctionnalité.
function ManagerPermissionsModal({ manager, open, setOpen, onSave }) {
  const colors = useColors()
  const [selected, setSelected] = useState(new Set(ALL_MANAGER_MODULE_KEYS))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (manager) {
      setSelected(new Set(manager.permissions || ALL_MANAGER_MODULE_KEYS))
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
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all">
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

                <div className="space-y-1 p-4">
                  {MANAGER_MODULES.map((module) => (
                    <label
                      key={module.key}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(module.key)}
                        onChange={() => toggle(module.key)}
                        className="h-4 w-4 cursor-pointer rounded"
                        style={{ accentColor: colors.primary }}
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        {module.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 p-3">
                  <button
                    type="button"
                    onClick={() => setSelected(new Set(ALL_MANAGER_MODULE_KEYS))}
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
