import Page from '@/components/Page'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { signin } from '../../lib/services/auth'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useColors } from '../../contexts/ColorContext'

function SignIn() {
  const colors = useColors()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    setApiError(null)
    try {
      await signin(data.email, data.password)
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      )
      console.log(error)
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: colors.gray50 }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200"
            style={{ borderTopColor: colors.primary }}
          />
          <p style={{ color: colors.gray600 }}>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.6;
          }
        }

        @keyframes spinIcon {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .wave {
          animation: wave 4s ease-in-out infinite;
        }

        .floating-circle {
          animation: float 6s ease-in-out infinite;
        }

        .grid-bg {
          background-image: 
            linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.05) 75%, rgba(255, 255, 255, 0.05) 76%, transparent 77%, transparent);
          background-size: 50px 50px;
        }

        .wave-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 150px;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><path d="M0,30 Q300,60 600,30 T1200,30 L1200,120 L0,120 Z" fill="rgba(2,70,82,0.1)"/></svg>') no-repeat bottom;
          background-size: cover;
          opacity: 0.7;
        }

        .wave-top {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 120px;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><path d="M0,30 Q300,60 600,30 T1200,30 L1200,0 L0,0 Z" fill="rgba(2,70,82,0.2)"/></svg>') no-repeat top;
          background-size: cover;
        }

        .input-with-border {
          border-left: 4px solid;
          transition: all 0.3s ease;
        }

        .input-with-border:focus {
          border-left-width: 4px;
        }

        .spin-icon {
          animation: spinIcon 1s linear infinite;
        }

        @media (max-width: 768px) {
          .left-panel {
            position: absolute;
            width: 100%;
            height: 30%;
            top: 0;
          }

          .right-panel {
            position: absolute;
            width: 100%;
            height: 70%;
            top: 30%;
            border-radius: 30px 30px 0 0;
          }
        }
      `}</style>

      <div className="flex min-h-screen overflow-hidden">
        {/* Left Panel - Branding */}
        <div
          className="grid-bg relative hidden flex-col items-center justify-center overflow-hidden p-8 md:flex md:w-1/2"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
          }}
        >
          {/* Decorative waves and circles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="wave-top" />
            <div className="wave-bottom" />

            {/* Floating circles */}
            <div
              className="floating-circle absolute h-32 w-32 rounded-full opacity-10"
              style={{
                backgroundColor: colors.white,
                top: '10%',
                right: '10%',
              }}
            />
            <div
              className="floating-circle absolute h-48 w-48 rounded-full opacity-5"
              style={{
                backgroundColor: colors.white,
                bottom: '10%',
                left: '-5%',
              }}
            />
            <div
              className="floating-circle absolute h-20 w-20 rounded-full opacity-20"
              style={{
                backgroundColor: colors.white,
                top: '20%',
                left: '15%',
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center text-white">
            <div className="mb-12 flex items-center justify-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white"
                style={{ borderColor: colors.white }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2.423-1.053a7.477 7.477 0 0111.154 0l2.423 1.053M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold uppercase tracking-widest">
                HabitatGN
              </span>
            </div>

            <p className="mb-6 text-sm opacity-90">Bienvenue,</p>
            <h1 className="mb-8 text-7xl font-black leading-tight md:text-8xl">
              Bienvenue
              <br />à vous
            </h1>
            <div
              className="mx-auto mb-8 h-1 w-20"
              style={{ backgroundColor: colors.white }}
            />

            <p className="mx-auto max-w-sm text-sm leading-relaxed opacity-80">
              Accédez à votre portail de gestion immobilière et gérez vos
              propriétés avec facilité. Sécurité, rapidité et flexibilité
              garanties.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div
          className="flex w-full flex-col items-center justify-center p-8 md:w-1/2 md:p-12"
          style={{ backgroundColor: colors.white }}
        >
          <div className="w-full max-w-md">
            {/* Mobile header */}
            <div className="mb-8 text-center md:hidden">
              <h2
                className="mb-2 text-3xl font-bold"
                style={{ color: colors.gray900 }}
              >
                HabitatGN
              </h2>
              <p className="text-sm" style={{ color: colors.gray500 }}>
                Portail Administrateur
              </p>
            </div>

            {/* Form Header */}
            <div className="mb-8">
              <h2
                className="mb-3 text-3xl font-bold"
                style={{ color: colors.primary }}
              >
                Connexion
              </h2>
              <p className="text-sm" style={{ color: colors.gray500 }}>
                Veuillez saisir vos identifiants pour accéder à votre compte
              </p>
            </div>

            {/* Error Alert */}
            {apiError && (
              <div
                className="mb-6 flex gap-3 rounded-lg border-l-4 p-4"
                style={{
                  backgroundColor: '#FEF2F2',
                  borderColor: colors.error,
                }}
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 flex-shrink-0"
                  style={{ color: colors.error }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.error }}
                >
                  {apiError}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: colors.gray700 }}
                >
                  Adresse Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    {...register('email', {
                      required: 'Email requis',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email invalide',
                      },
                    })}
                    type="email"
                    className="input-with-border w-full rounded-lg px-4 py-3 text-sm transition-all focus:outline-none"
                    style={{
                      backgroundColor: colors.gray100,
                      color: colors.gray900,
                      borderLeftColor: errors?.email
                        ? colors.error
                        : colors.primary,
                      border: `1px solid ${colors.gray200}`,
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'auto',
                    }}
                    placeholder="votre.email@habitatgn.com"
                    disabled={loading}
                    onFocus={(e) => {
                      if (!loading) {
                        e.target.style.backgroundColor = colors.white
                        e.target.style.boxShadow = `0 0 0 3px rgba(2, 70, 82, 0.1)`
                      }
                    }}
                    onBlur={(e) => {
                      if (!loading) {
                        e.target.style.backgroundColor = colors.gray100
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                  />
                </div>
                {errors?.email && (
                  <p
                    className="mt-2 flex items-center gap-1 text-xs font-medium"
                    style={{ color: colors.error }}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: colors.gray700 }}
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    {...register('password', {
                      required: 'Mot de passe requis',
                      minLength: {
                        value: 6,
                        message: 'Minimum 6 caractères',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input-with-border w-full rounded-lg px-4 py-3 pr-12 text-sm transition-all focus:outline-none"
                    style={{
                      backgroundColor: colors.gray100,
                      color: colors.gray900,
                      borderLeftColor: errors?.password
                        ? colors.error
                        : colors.primary,
                      border: `1px solid ${colors.gray200}`,
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'auto',
                    }}
                    placeholder="••••••••"
                    disabled={loading}
                    onFocus={(e) => {
                      if (!loading) {
                        e.target.style.backgroundColor = colors.white
                        e.target.style.boxShadow = `0 0 0 3px rgba(2, 70, 82, 0.1)`
                      }
                    }}
                    onBlur={(e) => {
                      if (!loading) {
                        e.target.style.backgroundColor = colors.gray100
                        e.target.style.boxShadow = 'none'
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{
                      color: colors.gray400,
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                    disabled={loading}
                    onMouseEnter={(e) => {
                      if (!loading) e.target.style.color = colors.primary
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.target.style.color = colors.gray400
                    }}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors?.password && (
                  <p
                    className="mt-2 flex items-center gap-1 text-xs font-medium"
                    style={{ color: colors.error }}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label
                  className="flex items-center gap-2"
                  style={{
                    opacity: loading ? 0.5 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 cursor-pointer rounded"
                    style={{ accentColor: colors.primary }}
                    disabled={loading}
                  />
                  <span className="text-sm" style={{ color: colors.gray700 }}>
                    Se souvenir de moi
                  </span>
                </label>

                <a
                  href="#"
                  className="text-sm font-semibold transition-colors"
                  style={{
                    color: colors.primary,
                    pointerEvents: loading ? 'none' : 'auto',
                    opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.color = colors.primaryDark
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.color = colors.primary
                  }}
                >
                  Mot de passe oublié?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full py-3 px-6 text-sm font-bold text-white transition-all"
                style={{
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.8 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = colors.primaryHover
                    e.target.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = colors.primary
                    e.target.style.transform = 'scale(1)'
                  }
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="spin-icon h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Connexion...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: colors.gray600 }}>
                Pas de compte?{' '}
                <a
                  href="#"
                  className="font-semibold transition-colors"
                  style={{
                    color: colors.primary,
                    pointerEvents: loading ? 'none' : 'auto',
                    opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.color = colors.primaryDark
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.color = colors.primary
                  }}
                >
                  Demander l'accès
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const SignInPage = () => (
  <Page name="HabitatGN - Connexion">
    {' '}
    <SignIn />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenAuthed: AuthAction.REDIRECT_TO_APP,
})()

export default withAuthUser({
  whenAuthed: AuthAction.REDIRECT_TO_APP,
  whenAuthedBeforeRedirect: AuthAction.RENDER,
})(SignInPage)
