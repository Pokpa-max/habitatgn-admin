import { useEffect, useState } from 'react'
import { RiLockPasswordLine, RiCheckLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import AdminModal, { ModalButton } from '@/components/ui/AdminModal'
import { useColors } from '../contexts/ColorContext'
import { changeOwnPassword } from '../lib/services/managers'
import { notify } from '../utils/toast'

// Changement de mot de passe par l'utilisateur connecté lui-même (admin ou
// manager) — demande l'ancien mot de passe pour ré-authentifier, comme
// l'exige Firebase pour cette opération sensible sur son propre compte.
function ChangePasswordModal({ open, setOpen }) {
  const colors = useColors()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
    }
  }, [open])

  const handleSave = async () => {
    if (!currentPassword) {
      setError('Entrez votre mot de passe actuel.')
      return
    }
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await changeOwnPassword(currentPassword, newPassword)
      notify('Mot de passe mis à jour avec succès', 'success')
      setOpen(false)
    } catch (e) {
      if (e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') {
        setError('Mot de passe actuel incorrect.')
      } else if (e?.code === 'auth/weak-password') {
        setError('Le nouveau mot de passe est trop faible (6 caractères minimum).')
      } else if (e?.code === 'auth/requires-recent-login') {
        setError('Session trop ancienne — reconnectez-vous puis réessayez.')
      } else {
        setError(e.message || 'Une erreur est survenue')
      }
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
      eyebrow="Mon compte"
      title="Changer mon mot de passe"
      footer={
        <>
          <ModalButton onClick={() => setOpen(false)}>Annuler</ModalButton>
          <ModalButton variant="primary" icon={RiCheckLine} loading={saving} onClick={handleSave}>
            Enregistrer
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Mot de passe actuel
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Votre mot de passe actuel"
          />
        </div>

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
            Confirmer le nouveau mot de passe
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Répéter le nouveau mot de passe"
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

export default ChangePasswordModal
