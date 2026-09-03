import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiCheckLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import {
  getContactSettings,
  updateContactSettings,
} from '@/lib/services/siteSettings'

const FIELDS = [
  { name: 'email', label: 'Email', placeholder: 'contact@habitatgn.com' },
  { name: 'phone1', label: 'Téléphone 1', placeholder: '+224 6XX XXX XXX' },
  { name: 'phone2', label: 'Téléphone 2', placeholder: '+224 6XX XXX XXX' },
  {
    name: 'whatsappNumber',
    label: 'Numéro WhatsApp',
    placeholder: '+224 6XX XXX XXX',
  },
  { name: 'address1', label: 'Adresse 1', placeholder: 'Quartier, ville' },
  { name: 'address2', label: 'Adresse 2', placeholder: 'Quartier, ville' },
  {
    name: 'facebookUrl',
    label: 'Lien Facebook',
    placeholder: 'https://facebook.com/...',
  },
  {
    name: 'instagramUrl',
    label: 'Lien Instagram',
    placeholder: 'https://instagram.com/...',
  },
  {
    name: 'twitterUrl',
    label: 'Lien Twitter / X',
    placeholder: 'https://x.com/...',
  },
  {
    name: 'linkedinUrl',
    label: 'Lien LinkedIn',
    placeholder: 'https://linkedin.com/...',
  },
]

export default function ContactTab() {
  const colors = useColors()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const settings = await getContactSettings()
        reset(settings)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [reset])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await updateContactSettings(data)
      notify('Coordonnées mises à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader color="#111827" />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl bg-white p-6 shadow-sm"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          Contact & réseaux sociaux
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Coordonnées et liens affichés sur le site public (pied de page, page
          contact...)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              {field.label}
            </label>
            <input
              type="text"
              {...register(field.name)}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-start justify-between gap-4 rounded-2xl bg-gray-50 p-5">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Router les biens à vendre vers BâtiMoo
          </p>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Activé : sur les fiches de biens en vente, le numéro de l&apos;agent
            n&apos;est jamais affiché publiquement — les acheteurs contactent le
            numéro BâtiMoo configuré ci-dessus (Téléphone 1 / WhatsApp).
            Désactivé : comportement d&apos;origine, le numéro de l&apos;agent
            s&apos;affiche normalement, comme pour les locations.
          </p>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            {...register('routeSaleContactToBatimoo')}
          />
          <div className="relative h-6 w-11 rounded-full bg-gray-300 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus:outline-none" />
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        {saving ? (
          <div
            className="inline-flex justify-center rounded-lg px-6 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: colors.primary }}
          >
            <Loader />
          </div>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            <RiCheckLine className="h-4 w-4" />
            Enregistrer
          </button>
        )}
      </div>
    </form>
  )
}
