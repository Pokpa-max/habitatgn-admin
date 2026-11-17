import { useEffect, useState } from 'react'
import { RiCheckLine, RiFileCopyLine, RiRefreshLine, RiUserAddLine } from 'react-icons/ri'
import AdminModal, { ModalButton } from '@/components/ui/AdminModal'
import { createWorkerAccount } from '@/lib/services/managers'
import { notify } from '@/utils/toast'

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const values = new Uint32Array(10)
  window.crypto.getRandomValues(values)
  return Array.from(values, (n) => chars[n % chars.length]).join('')
}

/**
 * Crée le compte de connexion d'un ouvrier ajouté sans compte. Son profil
 * (avis, paiements, visibilité sur le site) reste le même.
 */
export default function CreateWorkerAccountModal({ worker, open, setOpen, onCreated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  useEffect(() => {
    if (!open) return
    setEmail(worker?.email || '')
    setPassword(generatePassword())
    setError('')
    setCreated(null)
  }, [open, worker?.id, worker?.email])

  if (!worker) return null

  const submit = async (event) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Entrez un email valide.')
    if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.')
    setSaving(true)
    setError('')
    try {
      const uid = await createWorkerAccount(worker.id, email.trim(), password)
      onCreated?.(worker.id, { userId: uid, hasAccount: true, email: email.trim(), isAvailable: true })
      setCreated({ email: email.trim(), password })
    } catch (e) {
      setError(e.message || 'Le compte n’a pas pu être créé.')
    } finally {
      setSaving(false)
    }
  }

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      notify(`${label} copié`, 'success')
    } catch {
      notify('Impossible de copier', 'error')
    }
  }

  const field = 'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none'

  return (
    <AdminModal
      open={open}
      onClose={() => !saving && setOpen(false)}
      eyebrow="Ouvrier"
      title={created ? 'Compte créé' : `Créer le compte de ${worker.name || "l'ouvrier"}`}
      meta={<span>{created ? 'Transmettez ces identifiants à l’ouvrier' : 'Il pourra se connecter et gérer son profil sur le site'}</span>}
      icon={RiUserAddLine}
      size="sm"
      footer={
        created ? (
          <>
            <ModalButton onClick={() => copy(`Email : ${created.email}\nMot de passe : ${created.password}`, 'Identifiants')} icon={RiFileCopyLine}>
              Copier les identifiants
            </ModalButton>
            <ModalButton variant="primary" onClick={() => setOpen(false)}>
              Terminé
            </ModalButton>
          </>
        ) : (
          <>
            <ModalButton onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </ModalButton>
            <ModalButton variant="primary" type="submit" form="create-worker-account" loading={saving} icon={RiCheckLine}>
              Créer le compte
            </ModalButton>
          </>
        )
      }
    >
      {created ? (
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Email :</span> <strong className="text-gray-900">{created.email}</strong>
          </p>
          <p>
            <span className="text-gray-500">Mot de passe :</span> <strong className="font-mono text-gray-900">{created.password}</strong>
          </p>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Ce mot de passe ne sera plus affiché après la fermeture de cette fenêtre.
          </p>
        </div>
      ) : (
        <form id="create-worker-account" onSubmit={submit} noValidate className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Email de connexion</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="exemple@gmail.com" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Mot de passe</span>
            <div className="flex gap-2">
              <input value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} font-mono`} />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="shrink-0 rounded-lg border border-gray-200 px-3 text-gray-500 hover:bg-gray-50"
                title="Générer un autre mot de passe"
                aria-label="Générer un autre mot de passe"
              >
                <RiRefreshLine className="h-4 w-4" />
              </button>
            </div>
          </label>
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </form>
      )}
    </AdminModal>
  )
}
