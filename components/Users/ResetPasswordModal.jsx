import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiLockPasswordLine, RiCheckLine, RiCloseLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import { useColors } from '../../contexts/ColorContext'

// Admin uniquement : force un nouveau mot de passe sur le compte d'un
// manager, sans avoir besoin de connaître l'ancien (voir
// lib/services/managers.ts -> resetManagerPassword, pages/api/resetManagerPassword.ts).
function ResetPasswordModal({ manager, open, setOpen, onReset }) {
  const colors = useColors()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setNewPassword('')
      setConfirmPassword('')
      setError('')
    }
  }, [open])

  if (!manager) return null

  const handleSave = async () => {
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await onReset(manager, newPassword)
      setOpen(false)
    } catch (e) {
      setError(e.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

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
                    <RiLockPasswordLine className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <Dialog.Title className="truncate text-sm font-bold text-gray-900">
                      Réinitialiser le mot de passe
                    </Dialog.Title>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {manager.firstname || manager.name || manager.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Au moins 6 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <RiEyeOffLine className="h-5 w-5" /> : <RiEyeLine className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Répéter le mot de passe"
                    />
                  </div>

                  {error && (
                    <p className="text-xs font-semibold" style={{ color: colors.error }}>
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/80 p-3">
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
                    Réinitialiser
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default ResetPasswordModal
