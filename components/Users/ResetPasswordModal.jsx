import { useEffect, useState } from 'react'
import { RiLockPasswordLine, RiCheckLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import AdminModal, { ModalButton } from '@/components/ui/AdminModal'
import { useColors } from '../../contexts/ColorContext'

// Admin uniquement : force un nouveau mot de passe sur le compte d'un
// manager/agent/ouvrier, sans avoir besoin de connaître l'ancien (voir
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
    <AdminModal
      open={open}
      onClose={() => setOpen(false)}
      size="sm"
      icon={RiLockPasswordLine}
      eyebrow="Nouveau mot de passe"
      title={manager.firstname || manager.name || manager.fullName || manager.email}
      footer={
        <>
          <ModalButton onClick={() => setOpen(false)}>Annuler</ModalButton>
          <ModalButton variant="primary" icon={RiCheckLine} disabled={saving} onClick={handleSave}>
            Enregistrer le mot de passe
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
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
    </AdminModal>
  )
}

export default ResetPasswordModal
