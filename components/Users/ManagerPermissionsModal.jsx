import { useEffect, useState } from 'react'
import { RiShieldKeyholeLine, RiCheckLine } from 'react-icons/ri'
import AdminModal, { ModalButton } from '@/components/ui/AdminModal'
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
    <AdminModal
      open={open}
      onClose={() => setOpen(false)}
      icon={RiShieldKeyholeLine}
      eyebrow="Permissions du manager"
      title={manager.firstname || manager.name || manager.email}
      meta={<span>Cochez les pages et les actions autorisées.</span>}
      footer={
        <>
          <button
            type="button"
            onClick={() => setSelected(buildInitialSelection(ALL_MANAGER_MODULE_KEYS))}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 sm:mr-auto"
          >
            Tout cocher
          </button>
          <ModalButton onClick={() => setOpen(false)}>Annuler</ModalButton>
          <ModalButton variant="primary" icon={RiCheckLine} loading={saving} onClick={handleSave}>
            Enregistrer
          </ModalButton>
        </>
      }
    >
      <div className="-mx-3 -my-2 space-y-1">
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
    </AdminModal>
  )
}

export default ManagerPermissionsModal
