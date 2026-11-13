import { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Page from '@/components/Page'
import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'
import { auth } from '@/lib/firebase/client_config'
import { signin } from '@/lib/services/auth'
import { useColors } from '@/contexts/ColorContext'

function SignIn() {
  const colors = useColors()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    handleSubmit,
    register,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({ mode: 'onBlur', reValidateMode: 'onChange' })

  const translateError = (error) => {
    if (error.message && !error.code) return error.message
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Adresse e-mail ou mot de passe incorrect.'
      case 'auth/invalid-email':
        return "L’adresse e-mail n’est pas valide."
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.'
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez dans quelques minutes.'
      case 'auth/network-request-failed':
        return 'Connexion impossible. Vérifiez votre accès à Internet.'
      default:
        return error.message || 'La connexion a échoué. Réessayez.'
    }
  }

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    setApiError('')
    setResetMessage('')
    try {
      await signin(email.trim(), password)
    } catch (error) {
      setApiError(translateError(error))
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setResetError('')
    setResetMessage('')
    const emailIsValid = await trigger('email')
    if (!emailIsValid) return

    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, getValues('email').trim())
      setResetMessage('Si un compte correspond à cette adresse, un e-mail de réinitialisation vient d’être envoyé.')
    } catch (error) {
      if (error.code === 'auth/network-request-failed') {
        setResetError('Envoi impossible. Vérifiez votre connexion puis réessayez.')
      } else {
        // Le message générique évite de révéler si une adresse possède un compte.
        setResetMessage('Si un compte correspond à cette adresse, un e-mail de réinitialisation vient d’être envoyé.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <section className="relative w-full max-w-[440px]">
        <header className="mb-7 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-white shadow-sm"
            style={{ backgroundColor: colors.primary }}
            aria-hidden="true"
          >
            B
          </div>
          <p className="text-lg font-bold tracking-tight text-gray-900">BâtiMoo</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Administration
          </p>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
              <LockKeyhole className="h-3.5 w-3.5" /> Espace sécurisé
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Connexion</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Connectez-vous avec les identifiants de votre compte administrateur.
            </p>
          </div>

          {apiError && (
            <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-800">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                disabled={loading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email', {
                  required: 'Adresse e-mail requise.',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Adresse e-mail invalide.' },
                })}
                className={inputClass}
                placeholder="nom@entreprise.com"
              />
              {errors.email && <p id="email-error" className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading || resetLoading}
                  className="text-xs font-semibold text-gray-600 underline-offset-4 hover:text-gray-950 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resetLoading ? 'Envoi…' : 'Mot de passe oublié ?'}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password', {
                    required: 'Mot de passe requis.',
                    minLength: { value: 6, message: 'Le mot de passe doit contenir au moins 6 caractères.' },
                  })}
                  className={`${inputClass} pr-12`}
                  placeholder="Saisissez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-500 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>}
              {resetMessage && <p role="status" className="mt-2 text-xs leading-relaxed text-emerald-700">{resetMessage}</p>}
              {resetError && <p role="alert" className="mt-2 text-xs leading-relaxed text-red-600">{resetError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || resetLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: colors.primary }}
            >
              {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5 text-center">
            <p className="text-xs leading-relaxed text-gray-500">
              Accès réservé aux membres autorisés de l’équipe BâtiMoo.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">BâtiMoo Gestion</p>
      </section>
    </main>
  )
}

const SignInPage = () => (
  <Page name="BâtiMoo Gestion - Connexion">
    <SignIn />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenAuthed: AuthAction.REDIRECT_TO_APP,
})()

export default withUser({
  whenAuthed: AuthAction.REDIRECT_TO_APP,
  whenAuthedBeforeRedirect: AuthAction.RENDER,
})(SignInPage)
